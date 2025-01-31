function main() {
    console.log("Initialisation de WebGL...");
    gl = document.querySelector("#canvas").getContext("webgl");
    if (gl === null) {
        console.error("Erreur : Impossible d'initialiser WebGL.");
        return;
    }
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE);
    programs["room"] = room_program();
    programs["connection"] = connection_program();
    programs["solution"] = solution_program();
    programs["error_line"] = error_line_program();
    console.log("WebGL initialisé avec succès !");
}

let map_path = "../map/World/Regions/Rooms";
let rooms = {}; // Stocke les salles par région

console.log("Début du chargement des régions depuis :", map_path);

fetch(map_path + "/regions.txt")
    .then(response => response.text())
    .then(async function(data) {
        let region_abbrs = data.replaceAll("\r", "").split("\n").map(region => region.trim()).filter(region => region !== "");
    
        let fetchPromises = region_abbrs.map(region =>
            fetch(map_path + "/" + region + "/cf-" + region + ".txt")
                .then(response => response.text())
                .then(data => {
                    rooms[region] = data.split("\n").map(room => room.trim());
                })
                .catch(error => console.error("Erreur lors du chargement des salles pour " + region, error))
        );

        // Attendre que toutes les requêtes soient terminées
        await Promise.all(fetchPromises);

        //check all rooms
        //console.log(rooms);
        //console.log(Object.entries(rooms));
        //console.log(Object.keys(rooms).length);
        //for (const [key, value] of Object.entries(rooms)) {
        //    console.log(key);
        //    console.log(`${key}: ${value}`);
        //}

        // Après avoir récupéré les salles, afficher la première salle
        let firstRegion = Object.keys(rooms)[0];  // Première région
        let firstRoom = rooms[firstRegion][0];    // Première salle

        if (firstRegion && firstRoom) {
            console.log("Affichage de la première salle :", firstRoom);
            loadRoomGeometry(firstRegion, firstRoom);
        } else {
          console.warn("Aucune salle trouvée !");
        }
    })
    .catch(error => console.error("Erreur lors du chargement des régions :", error));

function loadRoomGeometry(region, room) {
    let roomPath = `${map_path}/${region}/${room}`;

    console.log(`Chargement des données de la salle ${room} dans la région ${region}...`);

    fetch(roomPath)
        .then(response => response.text())
        .then(data => {
            console.log(`Données brutes pour ${room}:`, data);
            
            // Convertir les données en géométrie utilisable
            let geometry = parseRoomGeometry(data);
            console.log(`Données de géométrie pour ${room}:`, geometry);
            
            // Afficher la salle en WebGL
            renderRoom(geometry);
        })
        .catch(error => console.error(`Erreur lors du chargement de la salle ${room} :`, error));
}
    
function parseRoomGeometry(data) {
    let lines = data.split("\n").map(line => line.trim()).filter(line => line !== "");
    
    let vertices = [];

    lines.forEach(line => {
        let coords = line.split(",").map(num => parseFloat(num.trim()));
        if (coords.length === 2) {  // Vérifier qu'il y a bien un couple (x, y)
            vertices.push({ x: coords[0], y: coords[1] });
        }
    });

    return vertices;
}

function renderRoom(vertices) {
    if (!gl) {
        gl = document.querySelector("#canvas").getContext("webgl");
        if (!gl) {
            console.error("Erreur WebGL : Impossible d'initialiser.");
            return;
        }
    }

    console.log("Rendu WebGL de la salle avec :", vertices.length, "points");

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    let flatVertices = vertices.flatMap(v => [v.x, v.y]); // Transformer en tableau plat [x1, y1, x2, y2, ...]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatVertices), gl.STATIC_DRAW);

    let vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position * 0.01, 0, 1); // Mise à l'échelle pour éviter dépassement de l'écran
        }
    `;

    let fragmentShaderSource = `
        void main() {
            gl_FragColor = vec4(1, 0, 0, 1); // Rouge
        }
    `;

    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    let shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    gl.useProgram(shaderProgram);

    let positionAttribute = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.LINE_STRIP, 0, vertices.length);
}
