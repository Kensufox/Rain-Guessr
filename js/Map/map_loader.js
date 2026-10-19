// map_loader.js — chargement de la carte : positions (map-data.json) + géométrie JSON par région
// Expose : roomBoundaries (lu par render.js, room_detection.js, connection_loader.js, room_locate.js)
// Dépend de : initRender(), renderRoom() (render.js), loadConnections() (connection_loader.js)
// Ordre de chargement : render.js → map_loader.js → room_detection.js → connection_loader.js
//
// ── Repère « carte » (identique à l'ancienne version .txt, donc la carte n'est plus retournée) ──
//   unité = 1 tuile, X vers la droite, Y vers le HAUT (le shader / mapToCanvas inversent Y à l'écran)
//   origine d'une room  : ox = position.x / 2 + region.x      (le /2 est indispensable)
//                         oy = position.y / 2 + region.y
//   point de géométrie (gx, gy) en tuiles, Y vers le bas depuis le coin haut-gauche de la room
//                       → (ox + gx,  oy - gy)
//   roomBoundaries[key] = { x1: ox, y1: oy, x2: ox + largeur, y2: oy - hauteur }
//   key = "CC-rooms/cc_b10" (même format qu'avant : dossier de région + nom en minuscules)

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

const OFFSETS_URL = "../json/room_offsets.txt";   // adapte le chemin
const roomOffsets = {};                           // "cc_a02" → [dx, dy]

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

        await Promise.all([loadOffsets(), loadRegionPos()]);

        // Les positions du fichier remplacent celles de map-data.json
        for (const [region, [x, y]] of Object.entries(regionOffsets)) {
            regionPosCache[region] = [x, y];
            if (mapData.regionPositions[region]) {
                mapData.regionPositions[region].x = x;
                mapData.regionPositions[region].y = y;
            }
        }

        // 4. Construction et dessin des couches
        buildAndRenderLayers();

        // 5. Connexions
        //await Promise.all(Object.keys(mapData.rooms).map(region =>
        //    loadConnections(`${region}-rooms`, regionPosCache)
        //));
        // 5. Connexions : un seul appel, tous les fichiers fusionnés
        const folders = Object.keys(mapData.rooms).map(r => r ? `${r}-rooms` : "Gate-rooms");
        if (!folders.includes("Gate-rooms")) folders.push("Gate-rooms");
        await loadConnections(folders);

        // Premier affichage : envoie pan/zoom au shader et dessine tout (géométrie + connexions + overlay)
        if (typeof applyTransform === "function") applyTransform();
        else if (typeof redraw === "function") redraw();

        // game.js / map.html écoutent cet évènement
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

function buildAndRenderLayers() {
    const layers = { frame: [], solid: [], floors: [], poles: [], shortcuts: [] };
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

            roomBoundaries[`${region}-rooms/${nameLower}`] = { x1: ox, y1: oy, x2: ox + w, y2: oy - h };
            placed++;

            if (!geo) {
                rectEdges(ox, oy, ox + w, oy - h, layers.frame);
                continue;
            }
            withGeo++;

            // Murs : contour fermé de chaque polygone
            for (const poly of geo.solid || []) {
                for (let i = 0; i < poly.length; i++) {
                    const a = poly[i], b = poly[(i + 1) % poly.length];
                    layers.solid.push({ x1: ox + a[0], y1: oy - a[1], x2: ox + b[0], y2: oy - b[1] });
                }
            }

            // Segments [x1, y1, x2, y2]
            const addSegs = (segs, target) => {
                for (const s of segs || []) {
                    target.push({ x1: ox + s[0], y1: oy - s[1], x2: ox + s[2], y2: oy - s[3] });
                }
            };
            addSegs(geo.floors,  layers.floors);
            addSegs(geo.poles_v, layers.poles);
            addSegs(geo.poles_h, layers.poles);

            // Raccourcis : petit carré dans la tuile [x, y]
            const m = 0.2;
            for (const [sx, sy] of geo.shortcuts || []) {
                rectEdges(ox + sx + m, oy - sy - m, ox + sx + 1 - m, oy - sy - 1 + m, layers.shortcuts);
            }
            // geo.broken_slopes : format non documenté (vide dans les fichiers vus) → ignoré
        }
    }

    for (const name of ["frame", "solid", "floors", "poles", "shortcuts"]) {
        if (layers[name].length) renderRoom(layers[name], LAYER_COLORS[name]);
    }

    console.log(`Rooms placed: ${placed} (${withGeo} with geometry)`);
}