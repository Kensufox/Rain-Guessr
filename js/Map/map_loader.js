const roomBoundaries = {};

// ── Données (chemins relatifs à /html/) ──────────────────────────────────────
const MAP_DATA_URL  = "../json/map-data.json";
const GEOMETRY_BASE = "../json/geometry";
// Jeux de géométrie par ordre de priorité. Plus tard : ["downpour", "vanilla"]
// (une room Downpour remplace alors la room vanilla du même nom).
const GEOMETRY_SETS = ["vanilla"];

// ── Couleurs des couches [r, g, b, a] ────────────────────────────────────────
const LAYER_COLORS = {
    frame:     [0.00, 1.00, 0.00, 0.35], // cadre vert : room sans géométrie
    solid:     [1.00, 0.00, 0.00, 1.00], // murs (contours des polygones "solid")
    floors:    [0.85, 0.71, 0.24, 1.00], // sols traversables
    poles:     [0.47, 0.78, 1.00, 1.00], // poteaux verticaux / horizontaux
    shortcuts: [1.00, 0.31, 0.78, 1.00]  // entrées de raccourcis
};

// Les lignes de connexion (jaunes) viennent toujours des fichiers link_*_connection.txt
const map_path = "../map/World/Regions/Rooms";
let regionPosCache = {};   // { "CC": [x, y], ... } — lu par connection_loader.js

let mapData = null;
const geometryByKey = {};  // "cc_b10" → géométrie (toutes régions confondues)

const LAYERS_URL       = "../map/World/Regions/Rooms/layers_vanilla.json";
const LAYER_OTHER_ALPHA = 0.12;
const DEFAULT_ROOM_W = 48, DEFAULT_ROOM_H = 35;

let layerData   = null;
let navType     = window.navMode;
let activeLayer = 0;
let navBusy     = false;
let connectionFolders = [];
const scenes    = {};

const OFFSETS_URL = "../json/room_offsets.txt";
const roomOffsets = {};

async function loadOffsets() {
    try {
        const res = await fetch(OFFSETS_URL);
        if (!res.ok) throw new Error(res.status);
        for (const line of (await res.text()).split("\n")) {
            const m = line.trim().match(/^[^/]+\/([^:]+):(-?\d+)x(-?\d+)$/i);   // "CC/cc_a02:36x36"
            if (m) roomOffsets[m[1].toLowerCase()] = [parseInt(m[2]), parseInt(m[3])];
        }
        console.log(`Offsets loaded: ${Object.keys(roomOffsets).length} rooms`);
    } catch (err) {
        console.warn("Offsets non chargés :", err);
    }
}

const REGION_POS_URL = "../json/region_pos.txt";   // adapte le chemin
const regionOffsets = {};                          // "CC" → [x, y]

async function loadRegionPos() {
    try {
        const res = await fetch(REGION_POS_URL);
        if (!res.ok) throw new Error(res.status);
        for (const line of (await res.text()).split("\n")) {
            const m = line.trim().match(/^(\w+):(-?\d+)x(-?\d+)$/);   // "CC:890x1722"
            if (m) regionOffsets[m[1].toUpperCase()] = [parseInt(m[2]), parseInt(m[3])];
        }
        console.log(`Region positions loaded: ${Object.keys(regionOffsets).length}`);
    } catch (err) {
        console.warn("region_pos.txt non chargé :", err);
    }
}

async function loadLayerData() {
    if (layerData) return layerData;
    try {
        const res = await fetch(LAYERS_URL);
        if (!res.ok) throw new Error(res.status);
        layerData = await res.json();
        console.log(`Layer data loaded: ${Object.values(layerData.rooms).reduce((n, r) => n + Object.keys(r).length, 0)} rooms`);
    } catch (err) {
        console.warn("layers_vanilla.json non chargé (mode couches indisponible) :", err);
        layerData = null;
    }
    return layerData;
}

function loadSavedNav() {
    try {
        const t = localStorage.getItem(window.NAV_STORAGE_KEY);
        if (window.NAV_MODES.includes(t)) return t;
    } catch (e) { /* storage unavailable */ }
    return "flat";
}

window.addEventListener("DOMContentLoaded", () => {
    loadMap();
});

// ---------------------------------------------------------------------------
// Pipeline de chargement
// ---------------------------------------------------------------------------
async function loadMap() {
    console.log("Loading map from:", MAP_DATA_URL);
    try {
        // 1. Positions des rooms / régions
        const res = await fetch(MAP_DATA_URL);
        if (!res.ok) throw new Error(`map-data.json introuvable (${res.status})`);
        mapData = await res.json();

        for (const [region, p] of Object.entries(mapData.regionPositions)) {
            regionPosCache[region] = [p.x, p.y];
        }

        // 2. Géométrie : un fichier par région et par jeu
        await loadGeometry(Object.keys(mapData.rooms));

        // 3. Shader prêt (render.js a déjà créé le contexte gl au DOMContentLoaded)
        initRender();

        await Promise.all([loadOffsets(), loadRegionPos(), loadLayerData()]);

        // Les positions du fichier remplacent celles de map-data.json
        for (const [region, [x, y]] of Object.entries(regionOffsets)) {
            regionPosCache[region] = [x, y];
            if (mapData.regionPositions[region]) {
                mapData.regionPositions[region].x = x;
                mapData.regionPositions[region].y = y;
            }
        }

        // 4. Mode de navigation (sauvegardé) puis construction et dessin de la scène
        navType = loadSavedNav();
        if (navType === "layer" && !layerData) navType = "flat";
        window.navigationType = navType;
        window.renderFilter = navType === "layer" ? layerFilter : null;
        buildAndRenderLayers();

        // 5. Connexions : un seul appel, tous les fichiers fusionnés
        connectionFolders = Object.keys(mapData.rooms).map(r => r ? `${r}-rooms` : "Gate-rooms");
        if (!connectionFolders.includes("Gate-rooms")) connectionFolders.push("Gate-rooms");
        await loadConnections(connectionFolders);

        // Premier affichage : envoie pan/zoom au shader et dessine tout (géométrie + connexions + overlay)
        if (typeof applyTransform === "function") applyTransform();
        else if (typeof redraw === "function") redraw();

        // game.js / map-room.html écoutent cet évènement
        window.dispatchEvent(new Event("mapLoaded"));

    } catch (err) {
        console.error("Error loading map:", err);
    }
}

async function loadGeometry(regions) {
    // Tout en parallèle, puis fusion dans l'ordre de priorité des jeux
    const results = await Promise.all(GEOMETRY_SETS.map(async set => {
        // + GATES.json : géométrie des gates (GATE_CC_UW...), listées dans map-data.json avec "gate": true
        const perRegion = await Promise.all([...regions, "GATES"].map(region =>
            fetch(`${GEOMETRY_BASE}/${set}/${region.toUpperCase()}.json`)
                .then(r => (r.ok ? r.json() : null))
                .catch(() => null)
        ));
        return perRegion.filter(Boolean);
    }));

    for (const files of results) {
        for (const file of files) {
            for (const [key, geo] of Object.entries(file)) {
                const k = key.toLowerCase();
                if (k.includes("(")) continue;   // ex. "gate_lf_su(error!)"
                // le 1er jeu de la liste gagne
                if (!(k in geometryByKey)) geometryByKey[k] = geo;
            }
        }
    }
    console.log(`Geometry loaded: ${Object.keys(geometryByKey).length} rooms`);
}

// ---------------------------------------------------------------------------
// Construction des segments
// ---------------------------------------------------------------------------
function rectEdges(x1, y1, x2, y2, out) {
    out.push({ x1,       y1,       x2,       y2: y1 });
    out.push({ x1: x2,   y1,       x2,       y2 });
    out.push({ x1: x2,   y1: y2,   x2: x1,   y2 });
    out.push({ x1,       y1: y2,   x2: x1,   y2: y1 });
}

const GEOMETRY_LAYERS = ["frame", "solid", "floors", "poles", "shortcuts"];
const makeLayerSet = () => ({ frame: [], solid: [], floors: [], poles: [], shortcuts: [] });

// Ajoute la géométrie d'une room (origine haut-gauche ox, oy en repère carte, Y vers le haut)
function pushRoomSegments(set, geo, ox, oy) {
    // Murs : contour fermé de chaque polygone
    for (const poly of geo.solid || []) {
        for (let i = 0; i < poly.length; i++) {
            const a = poly[i], b = poly[(i + 1) % poly.length];
            set.solid.push({ x1: ox + a[0], y1: oy - a[1], x2: ox + b[0], y2: oy - b[1] });
        }
    }

    // Segments [x1, y1, x2, y2]
    const addSegs = (segs, target) => {
        for (const s of segs || []) {
            target.push({ x1: ox + s[0], y1: oy - s[1], x2: ox + s[2], y2: oy - s[3] });
        }
    };
    addSegs(geo.floors,  set.floors);
    addSegs(geo.poles_v, set.poles);
    addSegs(geo.poles_h, set.poles);

    // Raccourcis : petit carré dans la tuile [x, y]
    const m = 0.2;
    for (const [sx, sy] of geo.shortcuts || []) {
        rectEdges(ox + sx + m, oy - sy - m, ox + sx + 1 - m, oy - sy - 1 + m, set.shortcuts);
    }
    // geo.broken_slopes : format non documenté (vide dans les fichiers vus) → ignoré
}

// Un jeu de segments → lots prêts pour renderRoom (tag = filtre de visibilité, voir render.js)
function pushBatches(scene, set, tag) {
    for (const name of GEOMETRY_LAYERS) {
        if (set[name].length) scene.batches.push({ segments: set[name], color: LAYER_COLORS[name], tag });
    }
}

// ── Scène "flat" : l'ancienne carte 2D (positions de map-data.json + room_offsets.txt) ──
function buildFlatScene() {
    const scene = { boundaries: {}, batches: [] };
    const set = makeLayerSet();
    let placed = 0, withGeo = 0;

    for (const [region, list] of Object.entries(mapData.rooms)) {
        const rp = mapData.regionPositions[region];
        if (!rp) { console.warn(`Région "${region}" absente de regionPositions`); continue; }

        for (const room of list) {
            const nameLower = room.fullName.toLowerCase();

            // Origine haut-gauche en repère carte (Y vers le haut) — voir l'en-tête
            const [dx, dy] = roomOffsets[nameLower] || [0, 0];
            const ox = room.position.x / 2 + rp.x + dx;
            const oy = room.position.y / 2 + rp.y + dy;   // Y carte = vers le haut

            const geo = geometryByKey[nameLower];
            // La géométrie fait foi pour la taille quand elle existe
            const w = geo ? geo.w : room.width;
            const h = geo ? geo.h : room.height;

            scene.boundaries[`${region}-rooms/${nameLower}`] = { x1: ox, y1: oy, x2: ox + w, y2: oy - h };
            placed++;

            if (!geo) {
                rectEdges(ox, oy, ox + w, oy - h, set.frame);
                continue;
            }
            withGeo++;
            pushRoomSegments(set, geo, ox, oy);
        }
    }

    pushBatches(scene, set, null);
    console.log(`Flat rooms placed: ${placed} (${withGeo} with geometry)`);
    return scene;
}

// ── Scène "layer" : positions natives du jeu, une couche = un plan ───────────────
//   room.x / room.y = coin BAS-GAUCHE de la room en tuiles (déjà /2 par precompile-layers.py)
//   origine haut-gauche en repère carte : ox = region.x + room.x ; oy = region.y + room.y + h
//   Les gates existent dans les deux régions qu'elles relient (deux copies, une par région) ;
//   elles n'ont pas de couche (layer = null) : visibles quelle que soit la couche affichée.
function buildLayerScene() {
    if (!layerData) return null;
    const scene = { boundaries: {}, batches: [] };
    const sets = Array.from({ length: 3 }, makeLayerSet);
    const gateSet = makeLayerSet();
    let placed = 0, withGeo = 0;

    for (const [region, rooms] of Object.entries(layerData.rooms)) {
        const rp = layerData.regions?.[region] || { x: 0, y: 0 };

        for (const [name, r] of Object.entries(rooms)) {
            if (name.startsWith("offscreenden_")) continue;   // pas une vraie room

            const geo = geometryByKey[name];
            const w = geo ? geo.w : (r.w ?? DEFAULT_ROOM_W);
            const h = geo ? geo.h : (r.h ?? DEFAULT_ROOM_H);
            const isGate = name.startsWith("gate_");

            const ox = rp.x + r.x;
            const oy = rp.y + r.y + h;

            scene.boundaries[`${region}-rooms/${name}`] = {
                x1: ox, y1: oy, x2: ox + w, y2: oy - h,
                layer: isGate ? null : r.layer, sub: r.sub, gate: isGate
            };
            placed++;

            const set = isGate ? gateSet : (sets[r.layer] || sets[0]);
            if (!geo) { rectEdges(ox, oy, ox + w, oy - h, set.frame); continue; }
            withGeo++;
            pushRoomSegments(set, geo, ox, oy);
        }
    }

    sets.forEach((set, layer) => pushBatches(scene, set, { layer }));
    pushBatches(scene, gateSet, { layer: null });
    console.log(`Layer rooms placed: ${placed} (${withGeo} with geometry)`);
    return scene;
}

// ── Navigation : changement de mode / de couche ──────────────────────────────

// Visibilité par couche (appelé par render.js via window.renderFilter) → facteur d'opacité
function layerFilter(tag) {
    if (navType !== "layer" || tag.layer == null || activeLayer === "all") return 1;
    return tag.layer === activeLayer ? 1 : LAYER_OTHER_ALPHA;
}

// Appelé par room_detection.js : seules les rooms de la couche affichée sont sélectionnables
function isRoomPickable(b) {
    return navType !== "layer" || b.layer == null || activeLayer === "all" || b.layer === activeLayer;
}

function getScene(type) {
    if (!scenes[type]) scenes[type] = type === "layer" ? buildLayerScene() : buildFlatScene();
    return scenes[type];
}

// Remplace roomBoundaries (objet partagé : render, détection, connexions, locate le lisent)
// et la géométrie GL par celles de la scène. Ne redessine pas : appeler redrawMap() ensuite.
function applyScene(scene) {
    clearRenderData();
    for (const k of Object.keys(roomBoundaries)) delete roomBoundaries[k];
    Object.assign(roomBoundaries, scene.boundaries);
    for (const b of scene.batches) renderRoom(b.segments, b.color, b.tag);
}

function redrawMap() {
    if (typeof applyTransform === "function") applyTransform();
    else if (typeof redraw === "function") redraw();
}

// Première construction (loadMap) : scène du mode courant
function buildAndRenderLayers() {
    applyScene(getScene(navType));
}

function notifyNavChange() {
    window.dispatchEvent(new CustomEvent("navigationChanged", { detail: { type: navType, layer: activeLayer } }));
}

function getNavigationState() {
    return { type: navType, layer: activeLayer, layerAvailable: !!layerData };
}

/**
 * Change le mode de navigation : "flat" ou "layer" (layer facultatif : 0 | 1 | 2 | "all").
 * Reconstruit géométrie + connexions (les positions changent), efface la sélection.
 */
async function setNavigationType(type, layer) {
    if (!window.NAV_MODES.includes(type) || navBusy || !mapData) return;
    if (type === "layer" && !(await loadLayerData())) { console.warn("Mode couches indisponible"); return; }

    navBusy = true;
    try {
        navType = type;
        if (layer !== undefined) activeLayer = layer;
        window.navigationType = type;
        window.renderFilter = type === "layer" ? layerFilter : null;
        try { localStorage.setItem(window.NAV_STORAGE_KEY, type); } catch (e) { /* ignore */ }

        clearSelection();
        applyScene(getScene(type));
        await loadConnections(connectionFolders);   // positions différentes → on recalcule les liens
        redrawMap();
        notifyNavChange();
    } finally {
        navBusy = false;
    }
}

// Couche affichée en mode "layer" : 0 | 1 | 2 | "all"
function setActiveLayer(layer) {
    activeLayer = layer;
    if (navType !== "layer") return;
    // La sélection n'est conservée que si sa room est toujours visible
    const b = window.selectedRoom && roomBoundaries[window.selectedRoom];
    if (b && !isRoomPickable(b)) clearSelection();
    redrawMap();
    notifyNavChange();
}