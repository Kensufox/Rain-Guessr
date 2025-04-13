let gl;
let geometry;
const roomBoundaries = {};
let regionPositions = {}; // Cache pour éviter de recharger region_pos.txt

function initWebGL() {
    const canvas = document.querySelector("#canvas");
    if (!canvas) {
        console.error("Erreur : Canvas introuvable.");
        return null;
    }

    const context = canvas.getContext("webgl");
    if (!context) {
        console.error("Erreur : Impossible d'initialiser WebGL.");
        return null;
    }

    context.enable(context.BLEND);
    context.blendFuncSeparate(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA, context.SRC_ALPHA, context.ONE);
    return context;
}

window.addEventListener("DOMContentLoaded", async () => {
    gl = initWebGL();
    if (!gl) return;
    console.log("WebGL initialisé avec succès !");

    await loadRegions(); // Charger toutes les régions
    await loadAllRegions(); // Charger et afficher les salles
});

const mapPath = "../map/World/Regions/Rooms";
let rooms = {}; // Stocker les salles par région

async function loadRegions() {
    try {
        const response = await fetch(`${mapPath}/regions.txt`);
        if (!response.ok) throw new Error("Échec du chargement des régions.");

        const regionAbbrs = (await response.text())
            .split("\n")
            .map(r => r.trim())
            .filter(Boolean);

        console.log("Régions trouvées :", regionAbbrs);

        // Charger toutes les listes de salles en parallèle
        await Promise.all(regionAbbrs.map(async (region) => {
            try {
                const res = await fetch(`${mapPath}/${region}/cf-${region}.txt`);
                if (!res.ok) throw new Error(`Échec du chargement des salles pour ${region}.`);

                rooms[region] = res.text().split("\n").map(r => r.trim()).filter(Boolean);
            } catch (error) {
                console.error(error);
            }
        }));

        console.log("Toutes les salles sont chargées.", rooms);
    } catch (error) {
        console.error("Erreur lors du chargement des régions :", error);
    }
}

// Charger toutes les régions en parallèle
async function loadAllRegions() {
    const geometries = await Promise.all(Object.keys(rooms).map(loadRegion));
    geometries.flat().forEach(renderRoom);
}

// Charger la géométrie d'une région
async function loadRegion(region) {
    let geom = [];

    for (const room of rooms[region] || []) {
        try {
            const roomGeom = await loadRoomGeometry(region, room.replace(".txt", ""));
            if (roomGeom) geom.push(...roomGeom);
        } catch (error) {
            console.error(`Erreur de chargement ${region}/${room}:`, error);
        }
    }
    return geom;
}

// Charger la géométrie d'une salle
async function loadRoomGeometry(region, room) {
    if (!regionPositions[region]) {
        try {
            const response = await fetch(`${mapPath}/region_pos.txt`);
            if (!response.ok) throw new Error("Fichier region_pos.txt introuvable.");

            const positions = await response.text();
            for (const line of positions.split("\n").map(l => l.trim()).filter(Boolean)) {
                const [key, pos] = line.split(":");
                regionPositions[key.trim()] = pos.split("x").map(Number);
            }
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    const regionPos = regionPositions[region.split('-')[0]];
    if (!regionPos) return [];

    try {
        const response = await fetch(`${mapPath}/${region}/${room}.txt`);
        if (!response.ok) throw new Error(`Fichier ${room}.txt introuvable.`);
        return parseRoomGeometry(await response.text(), regionPos);
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Parser la géométrie de la salle
function parseRoomGeometry(data, regionPos) {
    const lines = data.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const [height, width] = lines[1].split("x").map(Number);
    const [posX, posY] = lines[2].split("x").map(Number);

    const x1 = posX / 2 + regionPos[0];
    const y1 = posY / 2 + regionPos[1];
    const x2 = x1 + width;
    const y2 = y1 + height;

    roomBoundaries[`${regionPos}-${posX}-${posY}`] = { x1, y1, x2, y2 };

    return lines.slice(-7, -1).flatMap(line =>
        line === "None|" ? [] : line.split("|").map(pair => {
            const [x1, y1, x2, y2] = pair.replace(/[()]/g, "").split(",").map(Number);
            return {
                x1: posX / 2 + x1 + regionPos[0],
                y1: posY / 2 - y1 + regionPos[1],
                x2: posX / 2 + x2 + regionPos[0],
                y2: posY / 2 - y2 + regionPos[1]
            };
        })
    );
}

function detectRoomCollision(mouseX, mouseY) {
    for (const [room, { x1, y1, x2, y2 }] of Object.entries(roomBoundaries)) {
        if (mouseX >= x1 && mouseX <= x2 && mouseY >= y1 && mouseY <= y2) {
            console.log("Mouse is inside room:", room);
            return;
        }
    }
    console.log("Mouse is not inside any room.");
}

canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - (canvas.width / 2);
    const mouseY = rect.bottom - event.clientY - (canvas.height / 2);
    detectRoomCollision(mouseX, mouseY);
});
