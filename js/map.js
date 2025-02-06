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
let rooms = {}; // Stocke les salles par région

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
        let firstRoom = rooms[firstRegion][0];    // first room

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
            //console.log(`Raw data for ${room}:`, data);
            
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
    let lastSixLines = lines.slice(-6);

    let vertices = [];

    lastSixLines.forEach(line => {
        let pairs = line.split("|").map(pair => pair.trim());

        pairs.forEach(pair => {
            let coords = pair.replace(/[()]/g, "").split(",").map(num => parseFloat(num.trim()));
            if (coords.length === 2) {  // Ensure (x, y) pairs
                vertices.push({ x: coords[0], y: coords[1] });
            }
        });
    });

    return vertices;
}

function renderRoom(vertices) {
    if (!gl) {
        console.error("Error WebGL : Impossible to initialize. `gl` is null !");
        return;
    }

    console.log("Webgl render of the room with :", vertices.length, "points");

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    let flatVertices = vertices.flatMap(v => [v.x, v.y]); // transform the vertices in [x1, y1, x2, y2, ...]
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
