const RoomRenderer = {
  // Configuration
  TILE_SIZE: 15,
  TILE_TYPES: {
    '.': '#1a1a1a',
    '#': '#444',
    '|': '#666',
    '-': '#666',
    '+': '#888',
    '=': '#666',
    '/': '#555',
    'H': '#ff6600',
  },

  GEOMETRY_BASE: '../json/geometry',
  GEOMETRY_SETS: ['vanilla'],
  geometry: {},
  roomsCache: {},
  regionPositions: {},
  allRooms: {},
  precompiledData: null,
  usePrecompiled: false,

  async init() {
    console.log('Initializing Room Renderer...');
    try {
      const precompiled = await this.loadPrecompiledData();
      
      if (precompiled && precompiled.rooms && Object.keys(precompiled.rooms).length > 0) {
        console.log('Using precompiled map data');
        this.usePrecompiled = true;
        this.precompiledData = precompiled;
        this.regionPositions = precompiled.regionPositions || {};
        this.allRooms = precompiled.rooms;
        console.log(`Precompiled data loaded: ${precompiled.totalRooms} rooms`);
        console.log(`Regions available: ${Object.keys(this.allRooms).join(', ')}`);
        await this.loadGeometry();
        return true;
      } else {
        console.log('Precompiled data is incomplete or empty');
      }
      
      console.log('Precompiled data not available, loading from files');
      this.usePrecompiled = false;
      await this.loadRegionPositions();
      await this.loadAllRoomMetadata();
      await this.loadGeometry();
      return true;
    } catch (error) {
      console.error('Failed to initialize Room Renderer:', error);
      return false;
    }
  },

  async loadGeometry() {
    const regions = Object.keys(this.allRooms);
    const jobs = [];
    for (const set of this.GEOMETRY_SETS) {
      this.geometry[set] = {};
      for (const region of regions) {
        jobs.push(
          fetch(`${this.GEOMETRY_BASE}/${set}/${region.toUpperCase()}.json`)
            .then(r => (r.ok ? r.json() : null))
            .then(data => { if (data) this.geometry[set][region.toUpperCase()] = data; })
            .catch(() => {})
        );
      }
    }
    await Promise.all(jobs);
    const n = Object.values(this.geometry)
      .flatMap(byRegion => Object.values(byRegion))
      .reduce((sum, rooms) => sum + Object.keys(rooms).length, 0);
    console.log(`Geometry loaded: ${n} rooms`);
  },

  getGeometry(roomData) {
    const key = (roomData.fullName || `${roomData.regionCode}_${roomData.name}`).toLowerCase();
    for (const set of this.GEOMETRY_SETS) {
      const byRegion = this.geometry[set] || {};
      const own = byRegion[(roomData.regionCode || '').toUpperCase()];
      if (own && own[key]) return own[key];
      for (const rooms of Object.values(byRegion)) if (rooms[key]) return rooms[key];
    }
    return null;
  },

  buildGeometryGroup(geo, worldX, worldY) {
    const NS = 'http://www.w3.org/2000/svg';
    const T = this.TILE_SIZE;
    const make = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    };
    const g = make('g', { class: 'room-geo', transform: `translate(${worldX} ${worldY})` });

    g.appendChild(make('rect', {
      class: 'geo-bounds', x: 0, y: 0, width: geo.w * T, height: geo.h * T,
      fill: 'none', stroke: '#0f0', 'stroke-opacity': '0.35', 'stroke-width': 1
    }));

    if (geo.solid.length) {
      const d = geo.solid
        .map(poly => 'M' + poly.map(([x, y]) => `${x * T} ${y * T}`).join('L') + 'Z')
        .join('');
      g.appendChild(make('path', { class: 'geo-solid', d, 'fill-rule': 'evenodd', fill: '#555' }));
    }

    const lines = (segs, cls, stroke, width) => {
      if (!segs.length) return;
      const d = segs.map(([x1, y1, x2, y2]) => `M${x1 * T} ${y1 * T}L${x2 * T} ${y2 * T}`).join('');
      g.appendChild(make('path', {
        class: cls, d, fill: 'none', stroke, 'stroke-width': width, 'stroke-linecap': 'butt'
      }));
    };
    lines(geo.floors, 'geo-floor', '#d8b43c', 3);
    lines(geo.poles_v, 'geo-pole', '#78c8ff', 2);
    lines(geo.poles_h, 'geo-pole', '#78c8ff', 2);

    if (geo.shortcuts.length) {
      const d = geo.shortcuts
        .map(([x, y]) => `M${x * T + 3} ${y * T + 3}h${T - 6}v${T - 6}h${6 - T}Z`).join('');
      g.appendChild(make('path', { class: 'geo-shortcut', d, fill: '#ff50c8' }));
    }
    return g;
  },

  async loadPrecompiledData() {
    try {
      console.log('Attempting to fetch ../json/map-data.json');
      const response = await fetch('../json/map-data.json');
      console.log('Fetch response received, status:', response.status);
      
      if (!response.ok) {
        console.log('Precompiled data not found, status:', response.status);
        return null;
      }

      const data = await response.json();
      console.log(`Loaded precompiled data: ${data.totalRooms} rooms`);
      return data;
    } catch (error) {
      console.error('Error loading precompiled data:', error);
      console.error('Error details:', error.message, error.stack);
      return null;
    }
  },

  async loadRegionPositions() {
    try {
      const response = await fetch('../map/World/Regions/Rooms/region_pos.txt');
      if (!response.ok) throw new Error('Failed to load region_pos.txt');

      const text = await response.text();
      const lines = text.split('\n').filter(l => l.trim());

      this.regionPositions = {};
      for (const line of lines) {
        const [region, coords] = line.split(':');
        if (region && coords) {
          const [x, y] = coords.match(/-?\d+/g) || [0, 0];
          this.regionPositions[region.trim()] = {
            x: parseInt(x),
            y: parseInt(y),
            name: region.trim()
          };
        }
      }

      console.log('Region positions loaded:', this.regionPositions);
      return this.regionPositions;
    } catch (error) {
      console.error('Error loading region positions:', error);
      throw error;
    }
  },

  async loadAllRoomMetadata() {
    try {
      const response = await fetch('../map/World/Regions/Rooms/regions.txt');
      if (!response.ok) throw new Error('Failed to load regions.txt');

      const regions = (await response.text())
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);

      console.log('Regions found:', regions);

      await Promise.all(regions.map(region => this.loadRegionRoomList(region)));
      
      return this.allRooms;
    } catch (error) {
      console.error('Error loading room metadata:', error);
      throw error;
    }
  },

  async loadRegionRoomList(region) {
    try {
      const regionCode = region.replace('-rooms', '');
      const fileToLoad = `../map/World/Regions/Rooms/${region}/cf-${regionCode}-rooms.txt`;

      const response = await fetch(fileToLoad);
      if (!response.ok) {
        console.warn(`Could not load room list for ${region}`);
        this.allRooms[regionCode] = [];
        return;
      }

      const roomNames = (await response.text())
        .split('\n')
        .map(r => r.trim())
        .filter(r => r && !r.startsWith('cf-'));

      this.allRooms[regionCode] = roomNames;
      console.log(`Loaded ${roomNames.length} rooms for ${regionCode}`);
    } catch (error) {
      console.warn(`Error loading room list for ${region}:`, error);
      this.allRooms[region.replace('-rooms', '')] = [];
    }
  },

  async loadRoomGeometry(regionCode, roomName) {
    const cacheKey = `${regionCode}_${roomName}`;
    
    if (this.roomsCache[cacheKey]) {
      return this.roomsCache[cacheKey];
    }

    try {
      const cleanRoomName = roomName.endsWith('.txt') ? roomName.slice(0, -4) : roomName;
      const filePath = `../map/World/Regions/Rooms/${regionCode}-rooms/${cleanRoomName}.txt`;
      const response = await fetch(filePath);
      
      if (!response.ok) {
        console.warn(`Could not load room: ${filePath}`);
        return null;
      }

      const text = await response.text();
      const roomData = this.parseRoomFile(text, regionCode, cleanRoomName);
      
      this.roomsCache[cacheKey] = roomData;
      return roomData;
    } catch (error) {
      console.warn(`Error loading room geometry for ${regionCode}/${roomName}:`, error);
      return null;
    }
  },

  parseRoomFile(fileContent, regionCode, roomName) {
    const lines = fileContent.split('\n');
    let roomData = {
      name: roomName.toUpperCase(),
      regionCode: regionCode,
      width: 0,
      height: 0,
      position: { x: 0, y: 0 },
      tiles: [],
      geometry: []
    };

    let geometryStarted = false;
    let tileLines = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('Piece :')) {
        roomData.fullName = trimmed.replace('Piece :', '').trim();
      }

      else if (/^\d+x\d+$/.test(trimmed)) {
        const [w, h] = trimmed.split('x').map(Number);
        roomData.width = w;
        roomData.height = h;
      }

      else if (/^-?\d+x-?\d+$/.test(trimmed)) {
        const [x, y] = trimmed.match(/-?\d+/g).map(Number);
        roomData.position = { x, y };
      }

      else if (!geometryStarted && (trimmed.match(/^[.#|+\-=HV\/]/))) {
        tileLines.push(line);
      }

      else if (trimmed.includes('(') && trimmed.includes('|')) {
        roomData.geometry.push(trimmed);
        geometryStarted = true;
      }

      else if (trimmed === 'end file : ' + roomData.fullName) {
        break;
      }
    }

    roomData.tileMap = tileLines;
    return roomData;
  },

  renderRoomToCanvas(roomData) {
    if (!roomData || !roomData.width || !roomData.height) {
      return null;
    }

    const width = roomData.width * this.TILE_SIZE;
    const height = roomData.height * this.TILE_SIZE;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    return canvas;
  },

  renderRoomToSVG(roomData, svgGroup) {
    if (!roomData || !roomData.width || !roomData.height) {
      console.warn('Invalid room data:', roomData);
      return null;
    }

    let worldX, worldY;
    
    if (this.usePrecompiled && roomData.worldPos) {
      worldX = roomData.worldPos.x;
      worldY = roomData.worldPos.y;
    } else {
      const regionPos = this.regionPositions[roomData.regionCode];
      if (!regionPos) {
        console.warn(`No position data for region ${roomData.regionCode}`);
        return null;
      }
      worldX = (regionPos.x + roomData.position.x) * this.TILE_SIZE;
      worldY = (regionPos.y + roomData.position.y) * this.TILE_SIZE;
    }

    const geo = this.getGeometry(roomData);
    let pxW, pxH, drawing;
    if (geo) {
      pxW = geo.w * this.TILE_SIZE;
      pxH = geo.h * this.TILE_SIZE;
      drawing = this.buildGeometryGroup(geo, worldX, worldY);
    } else {
      const canvas = this.renderRoomToCanvas(roomData);
      if (!canvas) return null;
      pxW = canvas.width;
      pxH = canvas.height;
      drawing = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      drawing.setAttribute('x', worldX.toString());
      drawing.setAttribute('y', worldY.toString());
      drawing.setAttribute('width', pxW.toString());
      drawing.setAttribute('height', pxH.toString());
      drawing.setAttribute('href', canvas.toDataURL('image/png'));
      drawing.setAttribute('class', 'room-image');
    }

    const roomGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    roomGroup.setAttribute('class', 'room-group');
    roomGroup.setAttribute('data-room', roomData.fullName || roomData.name);
    roomGroup.setAttribute('data-region', roomData.regionCode);
    roomGroup.setAttribute('data-pos-x', worldX);
    roomGroup.setAttribute('data-pos-y', worldY);
    roomGroup.setAttribute('data-width', pxW);
    roomGroup.setAttribute('data-height', pxH);
    roomGroup.appendChild(drawing);

    const hitRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hitRect.setAttribute('x', worldX.toString());
    hitRect.setAttribute('y', worldY.toString());
    hitRect.setAttribute('width', pxW.toString());
    hitRect.setAttribute('height', pxH.toString());
    hitRect.setAttribute('fill', 'transparent');
    hitRect.setAttribute('class', 'room-hit-area');
    roomGroup.appendChild(hitRect);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', (worldX + pxW / 2).toString());
    label.setAttribute('y', (worldY + pxH / 2).toString());
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dy', '0.3em');
    label.setAttribute('fill', '#0f0');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('class', 'room-label');
    label.setAttribute('pointer-events', 'none');
    label.textContent = roomData.name || (roomData.fullName && roomData.fullName.split('_')[1]) || '';
    roomGroup.appendChild(label);

    if (svgGroup) {
      svgGroup.appendChild(roomGroup);
    }

    return roomGroup;
  },

  async renderRegion(regionCode, svgGroup) {
    console.log(`Rendering region ${regionCode}...`);
    
    const roomsData = this.allRooms[regionCode] || [];
    
    if (roomsData.length === 0) {
      console.log(`No rooms found for region ${regionCode}`);
      return 0;
    }

    let renderedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < roomsData.length; i += batchSize) {
      const batch = roomsData.slice(i, i + batchSize);
      
      const renderPromises = batch.map(async (roomData) => {
        try {
          if (roomData && roomData.width > 0 && roomData.height > 0) {
            this.renderRoomToSVG(roomData, svgGroup);
            return 1;
          }
        } catch (error) {
          console.warn(`Error rendering ${regionCode}/${roomData.name}:`, error);
        }
        return 0;
      });

      const results = await Promise.all(renderPromises);
      renderedCount += results.reduce((sum, val) => sum + val, 0);
      
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    console.log(`Rendered ${renderedCount} rooms for ${regionCode}`);
    return renderedCount;
  },

  async renderAllRegions(svgGroup) {
    console.log('Rendering all regions...');
    const regions = Object.keys(this.allRooms);
    
    let totalRooms = 0;

    const regionBatch = regions.slice(0, 11);
    
    const renderPromises = regionBatch.map(region => this.renderRegion(region, svgGroup));
    const counts = await Promise.all(renderPromises);
    
    totalRooms += counts.reduce((sum, count) => sum + count, 0);

    console.log(`Total rooms rendered: ${totalRooms}`);
    return totalRooms;
  },

  getRoomAtPoint(x, y, svgGroup) {
    if (!svgGroup) return null;

    const rooms = svgGroup.querySelectorAll('.room-group');
    for (const room of rooms) {
      const roomX = parseInt(room.getAttribute('data-pos-x'));
      const roomY = parseInt(room.getAttribute('data-pos-y'));
      const roomW = parseInt(room.getAttribute('data-width'));
      const roomH = parseInt(room.getAttribute('data-height'));
      
      if (x >= roomX && y >= roomY && x < roomX + roomW && y < roomY + roomH) {
        return {
          name: room.getAttribute('data-room'),
          region: room.getAttribute('data-region'),
          x: roomX,
          y: roomY,
          svgElement: room
        };
      }
    }
    return null;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoomRenderer;
}