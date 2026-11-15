let gl;
let canvas;
let shaderProgram;
let positionAttribute;
let uTranslate, uScale, uViewport, uColor;

const allSegments      = []; // all WebGL geometry buffers
const storedConnections = []; // all connection data for redraw

window.renderFilter = null;

// Parallax : facteur d'échelle propre à la couche du tag (fourni par map_loader.js), appliqué autour du centre de
// l'écran. Les couches de fond sont un peu plus petites, celles de devant un peu plus grandes → elles bougent à des
// vitesses différentes quand on déplace la caméra.
window.renderScale = null;
function tagScale(tag) {
    return (tag && window.renderScale) ? window.renderScale(tag) : 1;
}
let baseRenderScale = 1;

function tagAlpha(tag) {
    if (!tag || !window.renderFilter) return 1;
    return window.renderFilter(tag);
}

window.addEventListener("DOMContentLoaded", () => {
    console.log("Initialising WebGL...");

    canvas = document.querySelector("#canvas");
    if (!canvas) { console.error("Cannot find #canvas"); return; }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    gl = canvas.getContext("webgl", { stencil: true });   // stencil : sert à découper l'eau selon la géométrie
    if (!gl) { console.error("Cannot initialise WebGL"); return; }

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE);
    console.log("WebGL initialised.");
});

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";

    ["canvas-overlay", "canvas-connections"].forEach(id => {
        const c = document.getElementById(id);
        if (!c) return;
        c.width  = canvas.width;
        c.height = canvas.height;
        c.style.width  = canvas.style.width;
        c.style.height = canvas.style.height;
    });

    if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        redraw();
    }
}

function initRender() {
    if (!gl) { console.error("initRender: gl is null"); return; }

    const vertexShaderSource = `
        attribute vec2 a_position;
        uniform vec2 u_translate;
        uniform float u_scale;
        uniform vec2 u_viewport;
        void main() {
            vec2 pos = (a_position + u_translate) * u_scale;
            vec2 ndc = pos / (u_viewport * 0.5);
            gl_Position = vec4(ndc.x, ndc.y, 0, 1);
        }
    `;
    const fragmentShaderSource = `
        precision mediump float;
        uniform vec4 u_color;
        void main() {
            gl_FragColor = u_color;
        }
    `;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertexShaderSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
        console.error("Vertex shader error:", gl.getShaderInfoLog(vs));

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentShaderSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
        console.error("Fragment shader error:", gl.getShaderInfoLog(fs));

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vs);
    gl.attachShader(shaderProgram, fs);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
        console.error("Shader link error:", gl.getProgramInfoLog(shaderProgram));

    gl.useProgram(shaderProgram);
    positionAttribute = gl.getAttribLocation(shaderProgram, "a_position");
    uTranslate = gl.getUniformLocation(shaderProgram, "u_translate");
    uScale     = gl.getUniformLocation(shaderProgram, "u_scale");
    uViewport  = gl.getUniformLocation(shaderProgram, "u_viewport");
    uColor     = gl.getUniformLocation(shaderProgram, "u_color");
    gl.enableVertexAttribArray(positionAttribute);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Le shader n'existe qu'à partir d'ici : moving_map_script.js a appelé setRenderTransform()
    // au DOMContentLoaded, trop tôt (shaderProgram était null, rien n'a été envoyé).
    // Sans cet appel, u_scale reste à 0 et la géométrie est invisible jusqu'au 1er déplacement.
    setRenderTransform(window.mapPanX || 0, window.mapPanY || 0, window.scale || 1);

    console.log("Shader compiled and ready.");
}

function setRenderTransform(mapOffsetX, mapOffsetY, scale) {
    if (!shaderProgram) return;
    gl.useProgram(shaderProgram);
    gl.uniform2f(uTranslate, mapOffsetX, mapOffsetY);
    gl.uniform1f(uScale,     scale);
    gl.uniform2f(uViewport,  canvas.width, canvas.height);
    baseRenderScale = scale;
}

// segments : [{x1,y1,x2,y2}] en coordonnées carte (tuiles, y vers le haut)
// color    : [r,g,b,a] (0..1) — rouge par défaut comme avant
// tag      : null ou { layer } — sert uniquement au filtre de visibilité (navigation par couches)
// fill     : true → chaque élément est un rectangle { x1, y1, x2, y2 } dessiné plein (2 triangles), ex. l'eau.
//            Si l'élément a un `mask` (liste de boucles [[x, y], ...] = zones PLEINES de la room), le rectangle n'est
//            dessiné que là où le masque ne couvre pas (règle pair/impair, comme le fill 'evenodd' d'un canvas 2D) :
//            l'eau reste dans la partie jouable et le reste est transparent.
function uploadBuffer(floats) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, floats, gl.STATIC_DRAW);
    return buf;
}

// Boucles → triangles en éventail (p0, pi, pi+1) : dessinés avec stencil INVERT, la parité donne l'intérieur
function maskTriangles(loops) {
    const out = [];
    for (const loop of loops) {
        for (let i = 1; i < loop.length - 1; i++) {
            out.push(loop[0][0], loop[0][1], loop[i][0], loop[i][1], loop[i + 1][0], loop[i + 1][1]);
        }
    }
    return new Float32Array(out);
}

function renderRoom(segments, color = [1, 0, 0, 1], tag = null, fill = false) {
    if (!shaderProgram) { console.error("renderRoom called before initRender"); return; }

    if (fill) {
        const plain = segments.filter(r => !(r.mask && r.mask.length));
        for (const r of segments) {
            if (!(r.mask && r.mask.length)) continue;
            const maskVerts = maskTriangles(r.mask);
            allSegments.push({
                buf: uploadBuffer(new Float32Array([r.x1, r.y1, r.x2, r.y1, r.x2, r.y2, r.x1, r.y1, r.x2, r.y2, r.x1, r.y2])),
                count: 6, color, tag, fill: true,
                maskBuf: uploadBuffer(maskVerts), maskCount: maskVerts.length / 2
            });
        }
        segments = plain;
        if (!segments.length) return;
    }

    let flatVertices;
    if (fill) {
        flatVertices = new Float32Array(segments.length * 12);
        for (let i = 0; i < segments.length; i++) {
            const r = segments[i], o = i * 12;
            flatVertices.set([r.x1, r.y1,  r.x2, r.y1,  r.x2, r.y2,
                              r.x1, r.y1,  r.x2, r.y2,  r.x1, r.y2], o);
        }
    } else {
        flatVertices = new Float32Array(segments.length * 4);
        for (let i = 0; i < segments.length; i++) {
            const s = segments[i];
            flatVertices[i * 4]     = s.x1;
            flatVertices[i * 4 + 1] = s.y1;
            flatVertices[i * 4 + 2] = s.x2;
            flatVertices[i * 4 + 3] = s.y2;
        }
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, flatVertices, gl.STATIC_DRAW);
    allSegments.push({ buf, count: flatVertices.length / 2, color, tag, fill });
    // Pas de dessin immédiat : l'appelant fait redraw() une fois tout ajouté
    // (le dessin direct ignorait le filtre de couches et ne servait qu'au premier affichage).
}

// Vide la géométrie et les connexions (changement de mode de navigation)
function clearRenderData() {
    if (gl) for (const { buf, maskBuf } of allSegments) { gl.deleteBuffer(buf); if (maskBuf) gl.deleteBuffer(maskBuf); }
    allSegments.length = 0;
    storedConnections.length = 0;
}

function redraw() {
    if (!gl || !shaderProgram) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shaderProgram);
    // Les couches atténuées sont dessinées d'abord, la couche active passe par-dessus
    const visible = [];
    for (const seg of allSegments) {
        const k = tagAlpha(seg.tag);
        if (k > 0) visible.push({ seg, k });
    }
    // À opacité égale, les remplissages (eau) passent avant les lignes pour ne jamais les recouvrir
    visible.sort((a, b) => (a.k - b.k) || ((b.seg.fill ? 1 : 0) - (a.seg.fill ? 1 : 0)));

    for (const { seg: { buf, count, color, fill, maskBuf, maskCount, tag }, k } of visible) {
        gl.uniform4f(uColor, color[0], color[1], color[2], color[3] * k);
        gl.uniform1f(uScale, baseRenderScale * tagScale(tag));    // parallax (1 hors mode couches)

        if (maskBuf) {
            // 1) zones pleines de la room → stencil (INVERT = parité, rien n'est dessiné à l'écran)
            gl.enable(gl.STENCIL_TEST);
            gl.clear(gl.STENCIL_BUFFER_BIT);
            gl.colorMask(false, false, false, false);
            gl.stencilFunc(gl.ALWAYS, 0, 0xFF);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);
            gl.bindBuffer(gl.ARRAY_BUFFER, maskBuf);
            gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, maskCount);
            // 2) l'eau, seulement où le stencil vaut 0 (hors zones pleines) ; le reste reste transparent
            gl.colorMask(true, true, true, true);
            gl.stencilFunc(gl.EQUAL, 0, 0xFF);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(fill ? gl.TRIANGLES : gl.LINES, 0, count);

        if (maskBuf) gl.disable(gl.STENCIL_TEST);
    }
    gl.uniform1f(uScale, baseRenderScale);
    redrawConnections();
    // Redraw persistent overlays (selection + located room) on top
    refreshOverlay();
}

function mapToCanvas(mx, my, targetCanvas, depthScale = 1) {
    const s    = (window.scale  || 1) * depthScale;
    const panX = window.mapPanX || 0;
    const panY = window.mapPanY || 0;
    return {
        px:  (mx + panX) * s + targetCanvas.width  / 2,
        py: -(my + panY) * s + targetCanvas.height / 2
    };
}

// Draw a rect on the overlay canvas for a given room boundary
function drawRoomRect(ctx, roomKey, color, lineWidth, labelColor) {
    const dpr = window.devicePixelRatio || 1;
    const overlay = ctx.canvas;
    const b = roomBoundaries[roomKey];
    if (!b) return;

    const p1 = mapToCanvas(b.x1, b.y1, overlay);
    const p2 = mapToCanvas(b.x2, b.y2, overlay);
    const rx = Math.min(p1.px, p2.px);
    const ry = Math.min(p1.py, p2.py);
    const rw = Math.abs(p2.px - p1.px);
    const rh = Math.abs(p2.py - p1.py);

    ctx.strokeStyle = color;
    ctx.lineWidth   = lineWidth * dpr;
    ctx.strokeRect(rx, ry, rw, rh);

    if (labelColor) {
        ctx.fillStyle = labelColor;
        ctx.font = `bold ${14 * dpr}px monospace`;
        ctx.fillText(roomKey.split("/")[1], rx + 4, ry - 6 * dpr);
    }
}

// ── Located room (cyan, set from the console with locateRoom(), see room_locate.js) ──
window.locatedRoom = null;

function drawLocated(ctx) {
    if (window.locatedRoom) drawRoomRect(ctx, window.locatedRoom, "#00e5ff", 3, "#00e5ff");
}

// Clears the overlay and redraws every persistent highlight
function refreshOverlay() {
    const overlay = document.getElementById("canvas-overlay");
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (window.selectedRoom) drawRoomRect(ctx, window.selectedRoom, "#ff8800", 2.5, "#ff8800");
    drawLocated(ctx);
}

// ── Hover highlight (green, temporary) ──────────────────────────────────────
function renderBoundaryHighlight(roomKey) {
    const overlay = document.getElementById("canvas-overlay");
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    drawRoomRect(ctx, roomKey, "#00ff00", 2, "#00ff00");

    // Redraw selection on top if one exists
    if (window.selectedRoom && window.selectedRoom !== roomKey) {
        drawRoomRect(ctx, window.selectedRoom, "#ff8800", 2.5, "#ff8800");
    }
    drawLocated(ctx);
}

function clearHighlight() {
    const overlay = document.getElementById("canvas-overlay");
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Keep selection visible after hover clears
    if (window.selectedRoom) {
        drawRoomRect(ctx, window.selectedRoom, "#ff8800", 2.5, "#ff8800");
    }
    drawLocated(ctx);
}

// ── Selection highlight (orange, persistent) ─────────────────────────────────
function renderSelectionHighlight(roomKey) {
    const overlay = document.getElementById("canvas-overlay");
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    drawRoomRect(ctx, roomKey, "#ff8800", 2.5, "#ff8800");
    drawLocated(ctx);
}

function clearSelection() {
    window.selectedRoom = null;
    const overlay = document.getElementById("canvas-overlay");
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    drawLocated(ctx);
}

// ── Connections ───────────────────────────────────────────────────────────────
function renderConnections(connections) {
    storedConnections.push(...connections);
    redrawConnections();
}

function redrawConnections() {
    const connCanvas = document.getElementById("canvas-connections");
    if (!connCanvas) return;
    const ctx = connCanvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, connCanvas.width, connCanvas.height);
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth   = 0.5 * dpr;
    ctx.setLineDash([12 * dpr, 8 * dpr]);

    const DIR = { N:[0,-1], S:[0,1], E:[1,0], W:[-1,0] };

    for (const c of storedConnections) {
        // Mode couches : une connexion n'apparaît que si ses deux rooms sont visibles
        // (les connexions sans tag, et celles des gates, restent toujours visibles)
        const k = Math.min(tagAlpha(c.tagA), tagAlpha(c.tagB));
        if (k <= 0) continue;
        ctx.globalAlpha = k;
        const p1 = mapToCanvas(c.x1, c.y1, connCanvas, tagScale(c.tagA));   // chaque bout suit la couche de sa room
        const p2 = mapToCanvas(c.x2, c.y2, connCanvas, tagScale(c.tagB));
        const dist   = Math.hypot(p2.px - p1.px, p2.py - p1.py);
        const cpDist = Math.max(20 * dpr, dist / 8);
        const d1 = DIR[c.dir1] || [0,0];
        const d2 = DIR[c.dir2] || [0,0];
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.bezierCurveTo(
            p1.px + d1[0]*cpDist, p1.py + d1[1]*cpDist,
            p2.px + d2[0]*cpDist, p2.py + d2[1]*cpDist,
            p2.px, p2.py
        );
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
}