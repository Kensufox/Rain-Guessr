const SCORE = {
    max: 5000,
    wRegion: 0.4,
    wRoom: 0.6,
    regionScale: 10,   // sauts de région où le score tombe à ~37 %
    roomScale: 8      // sauts de room, idem
};

const GATE_RE    = /^gate_([a-z0-9]+)_([a-z0-9]+)/;
const SHELTER_RE = /^[a-z0-9]+_s\d+/;

let roomRegions = null;    // "cc_a02" → ["CC"]  /  "gate_cc_uw" → ["CC","UW"]
let regionGraph = null;    // "CC" → Set { "UW", ... }

function regionsOfRoom(name, region) {
    const g = name.match(GATE_RE);
    if (g) return [g[1].toUpperCase(), g[2].toUpperCase()];

    const regs = new Set(region ? [region.toUpperCase()] : []);
    if (SHELTER_RE.test(name)) {
        for (const n of roomLinks[name] || []) {
            const gg = n.match(GATE_RE);
            if (gg) { regs.add(gg[1].toUpperCase()); regs.add(gg[2].toUpperCase()); }
        }
    }
    return [...regs];
}

function linkRegions(a, b) {
    (regionGraph[a] ??= new Set()).add(b);
    (regionGraph[b] ??= new Set()).add(a);
}

function buildScoreIndex() {
    roomRegions = {};
    regionGraph = {};

    for (const [region, list] of Object.entries(mapData.rooms)) {
        for (const room of list) {
            const name = room.fullName.toLowerCase();
            roomRegions[name] = regionsOfRoom(name, region);
        }
    }

    // Régions voisines : une gate relie ses deux régions,
    // et toute connexion entre rooms de régions différentes aussi
    for (const [name, regs] of Object.entries(roomRegions)) {
        if (regs.length === 2 && GATE_RE.test(name)) linkRegions(regs[0], regs[1]);
        for (const n of roomLinks[name] || []) {
            const nr = roomRegions[n];
            if (!nr || regs.some(r => nr.includes(r))) continue;
            for (const a of regs) for (const b of nr) linkRegions(a, b);
        }
    }
}

// Parcours en largeur : nombre de sauts de `start` vers `target`
function bfs(start, target, neighbors, allowed = () => true) {
    if (start === target) return 0;
    const seen = new Set([start]);
    let frontier = [start], d = 0;
    while (frontier.length) {
        d++;
        const next = [];
        for (const cur of frontier) {
            for (const n of neighbors(cur)) {
                if (seen.has(n) || !allowed(n)) continue;
                if (n === target) return d;
                seen.add(n);
                next.push(n);
            }
        }
        frontier = next;
    }
    return Infinity;
}

// Sauts depuis `start` jusqu'à la room la plus proche qui satisfait `isTarget`
function bfsToRoom(start, isTarget, neighbors) {
    if (isTarget(start)) return 0;
    const seen = new Set([start]);
    let frontier = [start], d = 0;
    while (frontier.length) {
        d++;
        const next = [];
        for (const cur of frontier) {
            for (const n of neighbors(cur)) {
                if (seen.has(n)) continue;
                if (isTarget(n)) return d;
                seen.add(n);
                next.push(n);
            }
        }
        frontier = next;
    }
    return Infinity;
}

function computeScore(guessRoom, trueRoom) {
    if (!roomRegions) buildScoreIndex();
    const g = guessRoom.toLowerCase(), t = trueRoom.toLowerCase();
    const gRegs = roomRegions[g], tRegs = roomRegions[t];
    if (!gRegs?.length || !tRegs?.length) return null;

    const common = gRegs.filter(r => tRegs.includes(r));
    const sameRegion = common.length > 0;

    // région = 1 si bonne, sinon sauts dans le graphe des régions
        // Facteur 1 : région (1 si bonne, sinon sauts de rooms jusqu'à la bonne région)
    let regionScore = 1, regionHops = 0;
    if (!sameRegion) {
        const inTrueRegion = n => (roomRegions[n] || []).some(r => tRegs.includes(r));
        regionHops = bfsToRoom(g, inTrueRegion, n => roomLinks[n] || []);
        regionScore = Math.exp(-regionHops / SCORE.regionScale);   // Infinity → 0
    }

    // room (seulement si la région est bonne), sauts limités à la région commune
    let roomScore = 0, roomHops = null;
    if (sameRegion) {
        const inCommon = n => (roomRegions[n] || []).some(r => common.includes(r));
        roomHops = bfs(g, t, n => roomLinks[n] || [], inCommon);
        roomScore = Math.exp(-roomHops / SCORE.roomScale);
    }

    const points = Math.round(SCORE.max * (SCORE.wRegion * regionScore + SCORE.wRoom * roomScore));
    return { points, regionScore, roomScore, sameRegion, regionHops, roomHops };
}