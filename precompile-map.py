#!/usr/bin/env python3
"""
Map Data Precompiler
Génère json/map-data.json : position de chaque room (gates comprises) + position de chaque région.

Sources :
  - worlds/world/world/<région>/map_<région>.txt   → toutes les rooms et les GATE_* avec leur position
  - json/geometry/<jeu>/*.json                      → taille (w, h) de chaque room (GATES.json pour les gates)
  - json/region_pos.txt                             → position de chaque région (sinon map/World/Regions/Rooms/region_pos.txt)

Position d'une room = partie entière (tronquée) des deux premiers nombres de sa ligne :
    "SU_A02: 986.4821><7.310151><925.6138><-24.15985><0><Outskirts"  ->  (986, 7)

Gates : une gate relie deux régions et apparaît dans les map_*.txt des deux, chacune avec les coordonnées de sa
région. On la place avec la région qui apparaît en premier dans son nom (GATE_CC_UW -> CC), ou l'autre si la
première ne la contient pas. Son entrée porte "gate": true. Son décalage peut ensuite être ajusté dans l'éditeur.
"""

import json
import math
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent
WORLD_DIR = BASE_DIR / "worlds" / "world" / "world"
REGION_POS_FILES = [BASE_DIR / "json" / "region_pos.txt",
                    BASE_DIR / "map" / "World" / "Regions" / "Rooms" / "region_pos.txt"]
GEOMETRY_DIR = BASE_DIR / "json" / "geometry"
OUTPUT_FILE = BASE_DIR / "json" / "map-data.json"

TILE_SIZE = 15
GEOMETRY_SETS = ["vanilla"]          # par ordre de priorité
EXCLUDED_REGIONS = set()             # ex. {"GW"} pour ne pas inclure une région

MAP_LINE = re.compile(r'^([A-Za-z0-9_]+)\s*:\s*(-?[\d.]+)><(-?[\d.]+)><')


def load_region_positions():
    for f in REGION_POS_FILES:
        if not f.exists():
            continue
        positions = {}
        for line in f.read_text(encoding="utf-8").splitlines():
            m = re.match(r'^\s*(\w+)\s*:\s*(-?\d+)\s*x\s*(-?\d+)', line)
            if m:
                positions[m.group(1)] = {"x": int(m.group(2)), "y": int(m.group(3)), "name": m.group(1)}
        print(f"Region positions: {f.relative_to(BASE_DIR)} ({len(positions)})")
        return positions
    print("Warning: no region_pos.txt found")
    return {}


def load_geometry_sizes():
    """{ 'su_b04': (w, h) } toutes régions et gates confondues."""
    sizes = {}
    for game in GEOMETRY_SETS:
        for f in sorted((GEOMETRY_DIR / game).glob("*.json")):
            if f.name == "index.json":
                continue
            for key, geo in json.loads(f.read_text(encoding="utf-8")).items():
                if "(" in key:                      # ex. "gate_lf_su(error!)"
                    continue
                sizes.setdefault(key.lower(), (geo["w"], geo["h"]))
    return sizes


def parse_map_file(path):
    """-> [(NOM, x, y)] pour chaque entrée de la section des positions (rooms et GATE_*)."""
    entries = []
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        m = MAP_LINE.match(line.strip())
        if m:
            entries.append((m.group(1), math.trunc(float(m.group(2))), math.trunc(float(m.group(3)))))
    return entries


def make_room(name, x, y, size, region, region_positions, gate=False):
    room = {
        "name": name.split("_", 1)[1] if "_" in name else name,
        "fullName": name,
        "width": size[0],
        "height": size[1],
        "position": {"x": x, "y": y},
    }
    if gate:
        room["gate"] = True
    if region in region_positions:
        rp = region_positions[region]
        room["worldPos"] = {"x": (rp["x"] + x) * TILE_SIZE, "y": (rp["y"] + y) * TILE_SIZE}
    return room


def precompile_map_data():
    print("Starting map data precompilation...")
    region_positions = load_region_positions()
    sizes = load_geometry_sizes()
    print(f"Loaded {len(sizes)} room geometries")

    # 1. lecture de toutes les map_*.txt
    per_region = {}
    for d in sorted(p for p in WORLD_DIR.iterdir() if p.is_dir()):
        f = d / f"map_{d.name}.txt"
        region = d.name.upper()
        if f.exists() and region not in EXCLUDED_REGIONS:
            per_region[region] = parse_map_file(f)

    all_rooms = {}
    total = 0
    for region, entries in sorted(per_region.items()):
        rooms, no_geo = [], []
        for name, x, y in sorted(entries):
            if name.upper().startswith("GATE_"):
                continue                        # traitées à part (étape 2)
            size = sizes.get(name.lower())
            if not size:
                no_geo.append(name)             # ex. OFFSCREENDEN_xx : rien à dessiner
                continue
            rooms.append(make_room(name, x, y, size, region, region_positions))
        all_rooms[region] = rooms
        total += len(rooms)
        extra = f" (sans géométrie, ignorées : {', '.join(no_geo)})" if no_geo else ""
        print(f"  {region}: {len(rooms)} rooms{extra}")

    # 2. gates : une seule fois chacune, avec la région propriétaire
    gate_entries = {}                           # NOM -> { région: (x, y) }
    for region, entries in per_region.items():
        for name, x, y in entries:
            if name.upper().startswith("GATE_"):
                gate_entries.setdefault(name.upper(), {})[region] = (x, y)

    placed_gates = 0
    for name, where in sorted(gate_entries.items()):
        size = sizes.get(name.lower())
        if not size:
            print(f"  ! {name}: pas de géométrie dans GATES.json → ignorée")
            continue
        wanted = [p for p in name.split("_")[1:3]]          # GATE_CC_UW -> CC puis UW
        owner = next((r for r in wanted if r in where), next(iter(where)))
        x, y = where[owner]
        all_rooms.setdefault(owner, []).append(make_room(name, x, y, size, owner, region_positions, gate=True))
        placed_gates += 1
    for rooms in all_rooms.values():
        rooms.sort(key=lambda r: r["fullName"])
    total += placed_gates
    print(f"  gates: {placed_gates}")

    output = {
        "version": "1.1",
        "tileSize": TILE_SIZE,
        "regionPositions": region_positions,
        "rooms": all_rooms,
        "totalRooms": total,
    }
    OUTPUT_FILE.write_text(json.dumps(output, separators=(",", ":")), encoding="utf-8")
    print(f"\n✓ {total} rooms -> {OUTPUT_FILE} ({OUTPUT_FILE.stat().st_size / 1024:.0f} KB)")
    return True


if __name__ == "__main__":
    raise SystemExit(0 if precompile_map_data() else 1)
