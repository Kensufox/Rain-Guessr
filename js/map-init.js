let selectedRoom = null;
let worldBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

window.addEventListener('DOMContentLoaded', async () => {
    console.log('Map initialization starting...');
    
    const mapSvg = document.getElementById('map-svg');
    const roomsGroup = document.getElementById('rooms-group');
    const loadingIndicator = document.getElementById('score-info');

    if (!mapSvg || !roomsGroup) {
        console.error('SVG elements not found');
        return;
    }

    if (loadingIndicator) {
        loadingIndicator.innerHTML = '<p>Loading data...</p>';
    }

    try {
        const initialized = await RoomRenderer.init();
        
        if (!initialized) {
            throw new Error('Failed to initialize room renderer');
        }

        console.log('Room renderer initialized, rendering regions...');

        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<p>Rendering 11 regions... (this may take a moment)</p>';
        }

        const roomCount = await RoomRenderer.renderAllRegions(roomsGroup);
        
        console.log(`All regions rendered, adjusting view...`);
        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<p>Adjusting view...</p>';
        }

        adjustSVGBounds(mapSvg, roomsGroup);
        
        console.log(`Map loaded with ${roomCount} rooms`);

        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<p>✓ Map ready! Pan (left-click) • Zoom (scroll) • Click rooms to select</p>';
        }

        addRoomClickHandlers();

    } catch (error) {
        console.error('Error initializing map:', error);
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `<p style="color: red;">Error loading map: ${error.message}</p>`;
        }
    }
});

function adjustSVGBounds(svg, roomsGroup) {
    const rooms = roomsGroup.querySelectorAll('.room-group');
    
    if (rooms.length === 0) {
        console.warn('No rooms found');
        return;
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const room of rooms) {
        const x = parseInt(room.getAttribute('data-pos-x')) || 0;
        const y = parseInt(room.getAttribute('data-pos-y')) || 0;
        const w = parseInt(room.getAttribute('data-width')) || 0;
        const h = parseInt(room.getAttribute('data-height')) || 0;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
    }

    const padding = 500;
    minX = Math.floor(minX - padding);
    minY = Math.floor(minY - padding);
    const width = Math.ceil(maxX - minX + padding);
    const height = Math.ceil(maxY - minY + padding);

    console.log(`World bounds: x[${minX}, ${maxX}] y[${minY}, ${maxY}]`);
    console.log(`SVG viewBox: ${minX} ${minY} ${width} ${height}`);

    svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());

    worldBounds = { minX, maxX, minY, maxY };
}

function addRoomClickHandlers() {
    const roomsGroup = document.getElementById('rooms-group');
    if (!roomsGroup) return;

    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    mapContainer.addEventListener('click', (e) => {
        if (window.isDragging) return;

        const roomGroup = e.target.closest('.room-group');
        if (roomGroup) {
            selectRoom(roomGroup);
        }
    });

    roomsGroup.addEventListener('mouseover', (e) => {
        const roomGroup = e.target.closest('.room-group');
        if (roomGroup && !roomGroup.classList.contains('selected')) {
            roomGroup.classList.add('hovered');
        }
    });

    roomsGroup.addEventListener('mouseout', (e) => {
        const roomGroup = e.target.closest('.room-group');
        if (roomGroup) {
            roomGroup.classList.remove('hovered');
        }
    });
}

function selectRoom(roomGroup) {
    const roomsGroup = document.getElementById('rooms-group');
    
    if (selectedRoom) {
        selectedRoom.classList.remove('selected');
    }

    roomGroup.classList.add('selected');
    selectedRoom = roomGroup;

    const roomName = roomGroup.getAttribute('data-room');
    const regionCode = roomGroup.getAttribute('data-region');
    const infoDiv = document.getElementById('room-info');
    
    if (infoDiv && roomName) {
        infoDiv.classList.remove('hidden');
        document.getElementById('room-name').textContent = `Selected: ${roomName}`;
        console.log(`Selected room: ${roomName} (${regionCode})`);
    }
}

function getSelectedRoom() {
    if (!selectedRoom) return null;
    
    return {
        name: selectedRoom.getAttribute('data-room'),
        region: selectedRoom.getAttribute('data-region'),
        element: selectedRoom
    };
}

function clearSelection() {
    if (selectedRoom) {
        selectedRoom.classList.remove('selected');
        selectedRoom = null;
    }
    
    const infoDiv = document.getElementById('room-info');
    if (infoDiv) {
        infoDiv.classList.add('hidden');
    }
}
