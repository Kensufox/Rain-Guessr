const container = document.getElementById('map-container');
const map = document.getElementById('map');

let isDragging = false; // État du drag
let startX = 0, startY = 0; // Position initiale de la souris au clic
let currentX = 0, currentY = 0; // Décalage actuel de la carte
let offsetX = 0, offsetY = 0; // Position finale accumulée après drag
let scale = 1; // Facteur de zoom initial

// Gestion du zoom avec la molette
container.addEventListener('wheel', (e) => {
  e.preventDefault(); // Empêche le comportement par défaut (scroll)

  // Définir l'intensité du zoom
  const zoomIntensity = 0.1;
  const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity; // Zoom avant/arrière
  scale = Math.min(Math.max(0.5, scale + delta), 3); // Limite le zoom entre 0.5 et 3

  // Appliquer le zoom tout en préservant la position actuelle
  map.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
});

// Début du drag au clic gauche
container.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // Ne réagit qu'au clic gauche
  e.preventDefault(); // Empêche la sélection de texte
  isDragging = true; // Active l'état de drag
  container.style.cursor = 'grabbing'; // Change le curseur

  // Sauvegarde de la position initiale de la souris
  startX = e.pageX - offsetX;
  startY = e.pageY - offsetY;
});

// Déplacement pendant le drag
container.addEventListener('mousemove', (e) => {
  if (!isDragging) return; // Arrête si on ne drag pas

  // Calcul du déplacement
  offsetX = e.pageX - startX;
  offsetY = e.pageY - startY;

  // Mise à jour de la position actuelle de la carte
  currentX = offsetX;
  currentY = offsetY;

  // Appliquer la transformation
  map.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
});

// Fin du drag au relâchement du bouton de la souris
container.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false; // Désactive le drag
    container.style.cursor = 'grab'; // Change le curseur
  }
});

// Annuler le drag si la souris quitte le conteneur
container.addEventListener('mouseleave', () => {
  if (isDragging) {
    isDragging = false; // Désactive le drag
    container.style.cursor = 'grab'; // Change le curseur
  }
});
