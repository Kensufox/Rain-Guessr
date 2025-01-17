const container = document.getElementById('map-container');
const map = document.getElementById('map');

let isDragging = false;
let startX, startY;
let scrollLeft, scrollTop;

// Échelle initiale pour le zoom
let scale = 1;

// Zoom avec la molette
container.addEventListener('wheel', (e) => {
  e.preventDefault(); // Empêche le défilement classique

  // Ajustement du facteur de zoom
  const zoomIntensity = 0.1;
  const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity; // Zoom avant/arrière
  scale = Math.min(Math.max(0.5, scale + delta), 3); // Limite le zoom entre 0.5x et 3x

  // Applique le zoom à l'image
  map.style.transform = `scale(${scale})`;
});

// Début du drag au clic gauche
container.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // Ne réagit qu'au clic gauche
  e.preventDefault(); // Empêche la sélection de texte
  isDragging = true;
  container.style.cursor = 'grabbing'; // Change le curseur
  startX = e.pageX; // Position de la souris
  startY = e.pageY;
  scrollLeft = container.scrollLeft; // Position actuelle du scroll horizontal
  scrollTop = container.scrollTop; // Position actuelle du scroll vertical
});

// Déplacement pendant le drag
container.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = startX - e.pageX; // Différence horizontale
  const dy = startY - e.pageY; // Différence verticale

  // Simule le défilement en transformant la position
  map.style.transform = `translate(${-dx}px, ${-dy}px) scale(${scale})`;
});

// Fin du drag
container.addEventListener('mouseup', () => {
  isDragging = false; // Désactive le drag
  container.style.cursor = 'grab'; // Retour au curseur par défaut
});

// Annuler le drag si la souris quitte le conteneur
container.addEventListener('mouseleave', () => {
  isDragging = false;
  container.style.cursor = 'grab';
});
