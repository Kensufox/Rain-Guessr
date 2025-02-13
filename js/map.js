let gl;

// Wait until the DOM (HTML Document) is loaded
window.addEventListener("DOMContentLoaded", () => {
    console.log("Initialisation of WebGL...");
    
    //try yo load the canvas to draw (the line) on the page
    let canvas = document.querySelector("#canvas");
    if (!canvas) {
        console.error("Error : Impossible to find the canvas");
        return;
    }
    //try to get the webgl context
    gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("Error : Impossible to initialize Webgl");
        return;
    }

    gl.enable(gl.BLEND); //enable transparent color
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE);
    console.log("WebGL initialize with success !");
});

let map_path = "../map/World/Regions/Rooms";
let rooms = {}; // Store the rooms by region

console.log("Starting to load rooms map from :", map_path);

// get the list of regions
fetch(map_path + "/regions.txt")
    .then(response => response.text())
    .then(async function(data) {
        let region_abbrs = data.replaceAll("\r", "").split("\n").map(region => region.trim()).filter(region => region !== "");
    
        let fetchPromises = region_abbrs.map(region =>
            fetch(map_path + "/" + region + "/cf-" + region + ".txt")
                .then(response => response.text())
                .then(data => {
                    rooms[region] = data.split("\n").map(room => room.trim()); // store the list of rooms by region
                })
                .catch(error => console.error("Error while loading of rooms for region" + region, error))
        );

        // wait until all requests are done
        await Promise.all(fetchPromises);

        // find the first region and first room
        let firstRegion = Object.keys(rooms)[0];  // first region
        //let firstRoom = rooms[firstRegion][0];    // first room

        //console.log("Room found :", firstRoom);

        //if (firstRoom.endsWith(".txt")) {
        //    firstRoom = firstRoom.slice(0, -4); // Supp ".txt" if already present
        //}

        //if (firstRegion && firstRoom) {
        //    console.log("Starting to load first room :", firstRoom);
        //    loadRoomGeometry(firstRegion, firstRoom);
        //} else {
        //  console.warn("No room found.");
        //}
        initRender();
        for (let i = 0; i <= rooms[firstRegion].length; i++) {
            let firstRoom = rooms[firstRegion][i];    // first room

            console.log("Room found :", firstRoom);

            if (firstRoom.endsWith(".txt")) {
                firstRoom = firstRoom.slice(0, -4); // Supp ".txt" if already present
            }

            if (firstRegion && firstRoom) {
                console.log("Starting to load first room :", firstRoom);
                loadRoomGeometry(firstRegion, firstRoom);
            } else {
              console.warn("No room found.");
            }
          }
    })
    .catch(error => console.error("Error while loading of room :", error));

function loadRoomGeometry(region, room) {
    let roomPath = `${map_path}/${region}/${room}.txt`;

    console.log(`Loading the room ${room} in region ${region}...`);

    fetch(roomPath)
        .then(response => {
            if (!response.ok) throw new Error(`Unfound file : ${roomPath}`);
            return response.text();
        })
        .then(data => {
            console.log(`Raw data for ${room}:`, data);
            
            // Convert into useful geometry data
            let geometry = parseRoomGeometry(data);
            console.log(`Geometry data for ${room}:`, geometry);
            
            // Show room with WebGL
            renderRoom(geometry);
        })
        .catch(error => console.error(`Error while loading ${room} :`, error));
}
    
function parseRoomGeometry(data) {
    let lines = data.split("\n").map(line => line.trim()).filter(line => line !== "");

    // Get only the last 6 lines
    let lastSixLines = lines.slice(-7);

    let vertices = [];

    let height = 35;

    lastSixLines.forEach(line => {
        let pairs = line.split("|").map(pair => pair.trim());

        pairs.forEach(pair => {
            let coords = pair.replace(/[()]/g, "").split(",").map(num => parseFloat(num.trim()));
            //console.log(coords);
            if (coords.length === 4) {
                vertices.push({ 
                    x1: coords[0], 
                    y1: height - coords[1],  // Inversion de l'axe Y
                    x2: coords[2], 
                    y2: height - coords[3]   // Inversion de l'axe Y
                });
            }
        });
    });

    return vertices;
}

function initRender() {
    if (!gl) {
        console.error("WebGL Error : Initiation of WebGL failed,. `gl` is null !");
        return;
    }
}

function renderRoom(segments) {
    console.log("WebGL rendering :", segments.length, "segments");

    let flatVertices = segments.flatMap(s => [s.x1, s.y1, s.x2, s.y2]);

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatVertices), gl.STATIC_DRAW);

    let vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position * 0.01, 0, 1);
        }
    `;

    let fragmentShaderSource = `
        void main() {
            gl_FragColor = vec4(1, 0, 0, 1);
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

    //gl.clearColor(0, 0, 0, 1);
    //gl.clear(gl.COLOR_BUFFER_BIT);

    // Utiliser gl.LINES pour dessiner des segments indépendants
    gl.drawArrays(gl.LINES, 0, flatVertices.length / 2);
}
