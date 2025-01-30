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
    .then(function(response) {
        console.log("Réponse reçue du serveur pour les régions :", response);
        return response.text();
    })
    .then(async function(data) {
        console.log("Données brutes des régions reçues :", data);
        let region_abbrs = data.replaceAll("\r", "").split("\n"); // Convertir les données en tableau
        console.log("Liste des régions :", region_abbrs);

        // Lecture des régions
        for (let i = 0; i < region_abbrs.length; i++) {
            let region = region_abbrs[i].trim(); // Supprime les espaces au cas où
            if (region === "") continue; // Évite d’essayer de charger une région vide

            console.log("Chargement de la région :", region);
            fetch(map_path + "/" + region)
                .then(function(response) {
                    console.log("Réponse reçue pour la région " + region, response);
                    return response.text();
                })
                .then(async function(data) {
                    console.log("Données des salles pour " + region + " :", data);
                    rooms[region] = data.split("\n").map(room => room.trim()); // Stocke et nettoie les noms des salles
                    console.log("Salles stockées pour " + region + " :", rooms[region]);
                })
                .catch(error => console.error("Erreur lors du chargement des salles pour " + region, error));
        }
    })
    .catch(error => console.error("Erreur lors du chargement des régions :", error));
