let isDragging = false;
let startX = 0, startY = 0;

window.mapPanX = 0;
window.mapPanY = 0;
window.scale   = 1;

Object.defineProperty(window, 'offsetX', { get: () => 0 });
Object.defineProperty(window, 'offsetY', { get: () => 0 });

function applyTransform() {
    if (typeof setRenderTransform === 'function') {
        setRenderTransform(window.mapPanX, window.mapPanY, window.scale);
    }
    if (typeof redraw === 'function') redraw();
}

window.addEventListener('DOMContentLoaded', () => {
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) { console.error('Canvas not found'); return; }

    applyTransform();

    canvasEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const oldScale = window.scale;
        const zoomIntensity = 0.1 * oldScale;
        const delta    = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        const newScale = Math.min(Math.max(0.01, oldScale + delta), 50);

        const dpr  = window.devicePixelRatio || 1;
        const rect = canvasEl.getBoundingClientRect();
        const cx   = (e.clientX - rect.left)  * dpr;
        const cy   = (e.clientY - rect.top)   * dpr;

        const cw = canvasEl.width, ch = canvasEl.height;
        const mapCursorX =  (cx - cw/2) / oldScale - window.mapPanX;
        const mapCursorY = -(cy - ch/2) / oldScale - window.mapPanY;

        window.mapPanX =  (cx - cw/2) / newScale - mapCursorX;
        window.mapPanY = -(cy - ch/2) / newScale - mapCursorY;
        window.scale   = newScale;

        applyTransform();
    }, { passive: false });

    canvasEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDragging = true;
        document.body.style.cursor = 'grabbing';
        startX = e.clientX;
        startY = e.clientY;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dpr = window.devicePixelRatio || 1;
        const dx =  (e.clientX - startX) * dpr / window.scale;
        const dy = -(e.clientY - startY) * dpr / window.scale; // Y flipped
        window.mapPanX += dx;
        window.mapPanY += dy;
        startX = e.clientX;
        startY = e.clientY;
        applyTransform();
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button !== 0) return;
        isDragging = false;
        document.body.style.cursor = '';
    });

    canvasEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    const keyPanStep = 20;

    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA') return;

        let moved = true;
        switch (e.key) {
            case 'ArrowLeft':  window.mapPanX += keyPanStep; break;
            case 'ArrowRight': window.mapPanX -= keyPanStep; break;
            case 'ArrowUp':    window.mapPanY -= keyPanStep; break;
            case 'ArrowDown':  window.mapPanY += keyPanStep; break;
            default: moved = false;
        }
        if (moved) { e.preventDefault(); applyTransform(); }
    });
});