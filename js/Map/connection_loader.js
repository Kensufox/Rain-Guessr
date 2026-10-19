const roomLinks = {};

async function fetchConnectionText(folder) {
    const connPath = `${map_path}/${folder}/link_${folder.toLowerCase()}_connection.txt`;
    try {
        const response = await fetch(connPath);
        if (!response.ok) {
            console.warn(`No connection file for ${folder}: ${connPath}`);
            return null;
        }
        return await response.text();
    } catch (err) {
        console.warn(`Could not load connections for ${folder}:`, err);
        return null;
    }
}

function parseConnectionText(text, folder, endpointsByPair) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
        if (line.startsWith('room|')) continue;

        const parts = line.split('|');
        const roomA = parts[0].trim().toLowerCase();
        const count = parseInt(parts[1]);

        let idx = 2;
        for (let i = 0; i < count; i++) {
            const roomB  = (parts[idx++] || '').trim().toLowerCase();
            const posStr = (parts[idx++] || '').trim();

            const nextField = (parts[idx] || '').trim().toUpperCase();
            const dir = /^[NSEW]$/.test(nextField) ? (idx++, nextField) : '';

            (roomLinks[roomA] ??= new Set()).add(roomB);
            (roomLinks[roomB] ??= new Set()).add(roomA);
            if (!roomB || !posStr) continue;

            const [tileX, tileY] = posStr.toLowerCase().split('x').map(Number);

            // Swap X/Y: coordinate system is rotated 90°CW + vflip vs map space
            const mapTileX = tileY;
            const mapTileY = tileX;

            const boundaryA = getRoomBoundary(roomA, folder);
            if (!boundaryA) {
                console.warn(`Missing boundary for ${roomA}`);
                continue;
            }

            const mapX = boundaryA.x1 + mapTileX;
            const mapY = boundaryA.y1 - mapTileY;

            const [first, second] = [roomA, roomB].sort();
            const pairKey = `${first}↔${second}`;
            const entry = (endpointsByPair[pairKey] ??= { first, second });

            if (roomA === first) {
                entry.ax = mapX; entry.ay = mapY; entry.dirA = dir;
            } else {
                entry.bx = mapX; entry.by = mapY; entry.dirB = dir;
            }
            entry.folder = entry.folder || folder;
        }
    }
}

// Called by map_loader.js once all rooms are loaded and rendered
async function loadConnections(folders) {
    const texts = await Promise.all(folders.map(async f => [f, await fetchConnectionText(f)]));

    const endpointsByPair = {};
    for (const [folder, text] of texts) {
        if (text) parseConnectionText(text, folder, endpointsByPair);
    }

    const center = b => b ? [(b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2] : [null, null];

    const connections = [];
    for (const e of Object.values(endpointsByPair)) {
        const [cax, cay] = center(getRoomBoundary(e.first,  e.folder));
        const [cbx, cby] = center(getRoomBoundary(e.second, e.folder));

        const x1 = e.ax ?? cax, y1 = e.ay ?? cay, dir1 = e.dirA ?? '';
        const x2 = e.bx ?? cbx, y2 = e.by ?? cby, dir2 = e.dirB ?? '';

        if (x1 == null || x2 == null) continue;
        connections.push({ x1, y1, dir1, x2, y2, dir2 });
    }

    if (connections.length > 0) {
        renderConnections(connections);
        console.log(`Drew ${connections.length} connections`);
    }
}

// Find the roomBoundaries entry for a room name
function getRoomBoundary(roomName, region) {
    const key = `${region}/${roomName}`;
    if (roomBoundaries[key]) return roomBoundaries[key];
    for (const [k, v] of Object.entries(roomBoundaries)) {
        if (k.toLowerCase().endsWith('/' + roomName)) return v;
    }
    return null;
}