let gl;
let geometry;

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
                .catch(error => console.error("Error while loading rooms for region " + region, error))
        );

        // Wait until all room lists are loaded
        await Promise.all(fetchPromises);
        initRender();

        // Load all room geometries
        let loadRegionPromises = Object.keys(rooms).map(region => loadRegion(region));
        let geometryArray = await Promise.all(loadRegionPromises);

        geometryArray.forEach(geometry => {
            if (geometry.length > 0) renderRoom(geometry);
        });
    })
    .catch(error => console.error("Error while loading rooms:", error));

async function loadRegion(Region) {
    rooms[Region].pop(); // Remove last empty element if it exists

    let geom = [];

    for (let i = 0; i < rooms[Region].length; i++) {
        let Room = rooms[Region][i];

        if (Room.endsWith(".txt")) {
            Room = Room.slice(0, -4); // Remove ".txt" extension
        }

        if (Region && Room) {
            try {
                let roomGeom = await loadRoomGeometry(Region, Room); // Await result
                if (roomGeom) {
                    geom.push(...roomGeom); // Store geometry data
                }
            } catch (error) {
                console.error(`Error loading geometry for ${Region}/${Room}:`, error);
            }
        } else {
            console.warn("No room found.");
        }
    }

    return geom; // Return the collected geometry
}

async function loadRoomGeometry(region, room) {
    let roomPath = `${map_path}/${region}/${room}.txt`;
    let region_pos_path = `${map_path}/region_pos.txt`;

    try {
        let response = await fetch(roomPath);
        if (!response.ok) throw new Error(`File not found: ${roomPath}`);
        let response2 = await fetch(region_pos_path);
        if (!response2.ok) throw new Error(`File not found: ${region_pos_path}`);


        let data = await response.text();
        let pos_region = await response2.text();
        console.log(pos_region);
        //pos_region = pos_region.split("\n").split(":");
        //console.log(pos_region);
        for (let i = 0; i < pos_region.length; i++) {
            let region_pos = pos_region[i].split(":");
            if (region_pos[0].includes(region)) {
                pos_region = region_pos[1].split("x");
        }
        console.log(pos_region);
        //pos_region = pos_region.split("\n").map(region => region.trim()).filter(region => region !== "");
        return parseRoomGeometry(data, region_pos); // Return parsed geometry
    } catch (error) {
        console.error(`Error loading ${room}:`, error);
        return []; // Return an empty array on failure
    }
}
    
function parseRoomGeometry(data, region_pos) {
    let lines = data.split("\n").map(line => line.trim()).filter(line => line !== "");

    // Get only the last 6 lines
    let lastSixLines = lines.slice(-7);
    lastSixLines.pop();

    let vertices = [];

    let size = lines.slice()[1];
    let pos = lines.slice()[2];
    let [height, width] = size.split("x").map(num => parseInt(num.trim(), 10));
    let [pos_x, pos_y] = pos.split("x").map(num => parseInt(num.trim(), 10));

    lastSixLines.forEach(line => {

        if (line.trim() === "None|") {
            return;
        }

        let pairs = line.split("|").map(pair => pair.trim());
        pairs.pop();

        pairs.forEach(pair => {
            let coords = pair.replace(/[()]/g, "").split(",").map(num => parseFloat(num.trim()));
            if (coords.length === 4) {
                vertices.push({ 
                    x1: pos_x/2 + coords[0], //+ region_pos[0], 
                    y1: pos_y/2 - coords[1], //+ region_pos[1],
                    x2: pos_x/2 + coords[2], //+ region_pos[0], 
                    y2: pos_y/2 - coords[3]  //+ region_pos[1]
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
    //console.log("WebGL rendering:", segments);
    //console.log("WebGL rendering:", segments.length, "segments");

    let flatVertices = segments.flatMap(s => [s.x1, s.y1, s.x2, s.y2]);

    // Center the coordinates in WebGL space ([-1, 1])
    const scaleX = 2 / canvas.width;  // Échelle pour l'axe X
    const scaleY = 2 / canvas.height; // Échelle pour l'axe Y

    flatVertices = flatVertices.map((value, index) => 
        index % 2 === 0  // X coordinate
            ? (value / canvas.width) * 2  // Transformation X pour centrer
            : (value / canvas.height) * 2 // Transformation Y pour centrer
    );

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatVertices), gl.STATIC_DRAW);

    let vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0, 1);
        }
    `;

    let fragmentShaderSource = `
        void main() {
            gl_FragColor = vec4(1, 0, 0, 1);  // Red color for the lines
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

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Vertex shader compilation failed: " + gl.getShaderInfoLog(vertexShader));
    }

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("Fragment shader compilation failed: " + gl.getShaderInfoLog(fragmentShader));
    }

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("Program linking failed: " + gl.getProgramInfoLog(shaderProgram));
    }

    gl.useProgram(shaderProgram);

    let positionAttribute = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    //gl.clearColor(0, 0, 0, 1); // Clear the canvas to black
    //gl.clear(gl.COLOR_BUFFER_BIT); // Actually clear the canvas

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.drawArrays(gl.LINES, 0, flatVertices.length / 2);
}