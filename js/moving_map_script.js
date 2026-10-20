let isDragging = false;
let startX = 0, startY = 0;

window.mapPanX = 0;
window.mapPanY = 0;
window.scale   = 1;

Object.defineProperty(window, 'offsetX', { get: () => 0 });
Object.defineProperty(window, 'offsetY', { get: () => 0 });

function applyTransform() {
    if (typeof setRenderTransform === 'function') {
        setRenderTransform(window.mapPanX, window.mapPanY, window.scale);
    }
    if (typeof redraw === 'function') redraw();
}

window.addEventListener('DOMContentLoaded', () => {
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) { console.error('Canvas not found'); return; }

    applyTransform();

    canvasEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const oldScale = window.scale;
        const zoomIntensity = 0.1 * oldScale;
        const delta    = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        const newScale = Math.min(Math.max(0.01, oldScale + delta), 50);

        const dpr  = window.devicePixelRatio || 1;
        const rect = canvasEl.getBoundingClientRect();
        const cx   = (e.clientX - rect.left)  * dpr;
        const cy   = (e.clientY - rect.top)   * dpr;

        const cw = canvasEl.width, ch = canvasEl.height;
        const mapCursorX =  (cx - cw/2) / oldScale - window.mapPanX;
        const mapCursorY = -(cy - ch/2) / oldScale - window.mapPanY;

        window.mapPanX =  (cx - cw/2) / newScale - mapCursorX;
        window.mapPanY = -(cy - ch/2) / newScale - mapCursorY;
        window.scale   = newScale;

        applyTransform();
    }, { passive: false });

    canvasEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDragging = true;
        document.body.style.cursor = 'grabbing';
        startX = e.clientX;
        startY = e.clientY;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dpr = window.devicePixelRatio || 1;
        const dx =  (e.clientX - startX) * dpr / window.scale;
        const dy = -(e.clientY - startY) * dpr / window.scale; // Y flipped
        window.mapPanX += dx;
        window.mapPanY += dy;
        startX = e.clientX;
        startY = e.clientY;
        applyTransform();
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button !== 0) return;
        isDragging = false;
        document.body.style.cursor = '';
    });

    canvasEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    const keyPanStep = 20;

    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA') return;

        let moved = true;
        switch (e.key) {
            case 'ArrowLeft':  window.mapPanX += keyPanStep; break;
            case 'ArrowRight': window.mapPanX -= keyPanStep; break;
            case 'ArrowUp':    window.mapPanY -= keyPanStep; break;
            case 'ArrowDown':  window.mapPanY += keyPanStep; break;
            default: moved = false;
        }
        if (moved) { e.preventDefault(); applyTransform(); }
    });
});

// ── Tactile : 1 doigt = déplacer, 2 doigts = zoom ───────────────────────────
(function () {
    const MIN_SCALE = 0.01, MAX_SCALE = 50;      // mêmes bornes que room_locate.js
    const pts = new Map();                       // pointerId → { x, y } en px CSS
    let last = null, dragged = false;

    const gesture = () => {
        const p = [...pts.values()];
        if (p.length === 1) return { n: 1, x: p[0].x, y: p[0].y, dist: 0 };
        return { n: p.length, x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2,
                 dist: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) };
    };

    canvas.addEventListener("pointerdown", e => {
        if (e.pointerType !== "touch") return;   // la souris reste gérée par le code existant
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        last = gesture();
        if (pts.size === 1) dragged = false;
    });

    canvas.addEventListener("pointermove", e => {
        if (e.pointerType !== "touch" || !pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const g = gesture();
        if (!last || last.n !== g.n) { last = g; return; }   // nombre de doigts changé : on repart

        const rect = canvas.getBoundingClientRect(), d = window.devicePixelRatio || 1;
        const cw = canvas.width, ch = canvas.height;
        const s = window.scale || 1, panX = window.mapPanX || 0, panY = window.mapPanY || 0;

        // point carte qui était sous le geste (même formule que pixelToMap)
        const mapX =  ((last.x - rect.left) * d - cw / 2) / s - panX;
        const mapY = -((last.y - rect.top)  * d - ch / 2) / s - panY;

        // pincement → nouveau zoom, sinon inchangé
        let s2 = s;
        if (last.dist && g.dist) s2 = Math.min(Math.max(s * g.dist / last.dist, MIN_SCALE), MAX_SCALE);

        // on remet ce même point carte sous la nouvelle position du geste
        window.scale   = s2;
        window.mapPanX =  ((g.x - rect.left) * d - cw / 2) / s2 - mapX;
        window.mapPanY = -((g.y - rect.top)  * d - ch / 2) / s2 - mapY;

        if (Math.hypot(g.x - last.x, g.y - last.y) > 3 || g.n > 1) dragged = true;
        last = g;
        applyTransform();
    });

    const end = e => { pts.delete(e.pointerId); last = pts.size ? gesture() : null; };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);

    // Un glissement ne doit pas sélectionner la room sous le doigt
    window.addEventListener("click", e => {
        if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; }
    }, true);
})();