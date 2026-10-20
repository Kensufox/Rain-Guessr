#!/usr/bin/env python3
"""
precompile-layers.py — extrait les positions 3 couches des fichiers natifs de Rain World
(worlds/<jeu>/world/<région>/map_<région>.txt + map_image_<région>.txt) vers UN fichier JSON
lu par map_loader.js (mode de navigation "layer").

Usage (depuis la racine du dépôt) :
    python precompile-layers.py
    python precompile-layers.py --world-dir "worlds/world downpour/world" --out map/World/Regions/Rooms/layers_downpour.json

Format de ligne dans map_<région>.txt :
    ROOM: x1><y1><x2><y2><couche><sous-région
Seule la 2e paire (x2, y2) est utilisée : mesurée sur le vanilla, c'est celle qui donne une
disposition sans chevauchement dans une même couche (2 chevauchements sur 596 rooms, contre 55
avec la 1re paire en coin haut-gauche). Elle désigne le coin BAS-GAUCHE de la room, Y vers le haut.
Les coordonnées brutes sont en demi-tuiles : on les divise par 2 ici, le JS n'a pas à le savoir.

map_image_<région>.txt : "ROOM: x,y,w,h" → on ne garde que w,h (en tuiles).

Sortie :
{
  "version": 1,
  "regions": { "CC": {"x": 890, "y": 1722}, ... },   # origine de chaque région (à ajuster à la main)
  "rooms":   { "CC": { "cc_a06": {"x": -59.64, "y": 386.35, "w": 54, "h": 35, "layer": 0, "sub": "Chimney Canopy"}, ... } }
}
Position finale d'une room dans le repère carte du JS (Y vers le haut) :
    x1 = region.x + room.x          y1 (haut) = region.y + room.y + room.h
"""
import argparse, json, re, statistics, sys
from pathlib import Path

LINE = re.compile(r'^([^:]+):\s*(-?[\d.]+)><(-?[\d.]+)><(-?[\d.]+)><(-?[\d.]+)><(\d+)(?:><(.*))?$')
IMG  = re.compile(r'^([^:]+):\s*(-?\d+),(-?\d+),(\d+),(\d+)')


def read_regions(world):
    f = world / 'regions.txt'
    return [l.strip() for l in f.read_text(encoding='utf8', errors='ignore').splitlines() if l.strip()]


def read_sizes(path):
    sizes = {}
    if path.exists():
        for l in path.read_text(encoding='utf8', errors='ignore').splitlines():
            m = IMG.match(l.strip())
            if m:
                sizes[m.group(1).lower()] = (int(m.group(4)), int(m.group(5)))
    return sizes


def read_map(path, sizes):
    rooms = {}
    for l in path.read_text(encoding='utf8', errors='ignore').splitlines():
        m = LINE.match(l.strip())
        if not m:
            continue
        name = m.group(1).strip().lower()
        x1, y1, x2, y2 = (float(m.group(i)) for i in range(2, 6))
        w, h = sizes.get(name, (None, None))
        rooms[name] = {
            'x': round(x2 / 2, 2), 'y': round(y2 / 2, 2),
            'w': w, 'h': h,
            'layer': int(m.group(6)),
            'sub': (m.group(7) or '').strip(),
            '_old': (x1 / 2, y1 / 2),          # 1re paire : uniquement pour estimer l'origine de région
        }
    return rooms


def suggest_regions(rooms_by_region, old_map_data, old_region_pos):
    """Origine de région de départ : on garde les régions à peu près là où l'ancienne carte 2D
    les mettait (médiane de l'écart centre ancien / centre nouveau). À ajuster ensuite à la main."""
    out = {}
    for reg, rooms in rooms_by_region.items():
        base = old_region_pos.get(reg, (0, 0))
        old = {}
        if old_map_data:
            for r in old_map_data.get('rooms', {}).get(reg, []):
                old[r['fullName'].lower()] = r
        dxs, dys = [], []
        for name, r in rooms.items():
            o = old.get(name)
            if not o or r['w'] is None:
                continue
            # ancien repère : coin haut-gauche = (position/2), Y vers le haut, taille width x height
            ocx = o['position']['x'] / 2 + o['width'] / 2
            ocy = o['position']['y'] / 2 - o['height'] / 2
            ncx = r['x'] + r['w'] / 2
            ncy = r['y'] + r['h'] / 2
            dxs.append(ocx - ncx)
            dys.append(ocy - ncy)
        if dxs:
            out[reg] = {'x': round(base[0] + statistics.median(dxs)), 'y': round(base[1] + statistics.median(dys))}
        else:
            out[reg] = {'x': base[0], 'y': base[1]}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--world-dir', default='worlds/world/world')
    ap.add_argument('--out', default='map/World/Regions/Rooms/layers_vanilla.json')
    ap.add_argument('--old-map-data', default='json/map-data.json')
    ap.add_argument('--old-region-pos', default='json/region_pos.txt')
    a = ap.parse_args()

    world = Path(a.world_dir)
    rooms_by_region, missing_size = {}, []
    for reg in read_regions(world):
        low = reg.lower()
        mp = world / low / f'map_{low}.txt'
        if not mp.exists():
            print(f'  (pas de {mp}, région ignorée)')
            continue
        sizes = read_sizes(world / low / f'map_image_{low}.txt')
        rooms = read_map(mp, sizes)
        missing_size += [n for n, r in rooms.items() if r['w'] is None]
        rooms_by_region[reg.upper()] = rooms

    old_md = json.load(open(a.old_map_data)) if Path(a.old_map_data).exists() else None
    old_rp = {}
    if Path(a.old_region_pos).exists():
        for l in open(a.old_region_pos):
            m = re.match(r'^(\w+):(-?\d+)x(-?\d+)$', l.strip())
            if m:
                old_rp[m.group(1).upper()] = (int(m.group(2)), int(m.group(3)))
    else:
        print('! region_pos.txt introuvable : origines de région à 0, à régler à la main', file=sys.stderr)

    regions = suggest_regions(rooms_by_region, old_md, old_rp)
    for rooms in rooms_by_region.values():
        for r in rooms.values():
            r.pop('_old', None)

    out = {'version': 1, 'regions': regions, 'rooms': rooms_by_region}
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf8')

    n = sum(len(r) for r in rooms_by_region.values())
    print(f'{len(rooms_by_region)} régions, {n} rooms → {a.out}')
    if missing_size:
        print(f'! {len(missing_size)} rooms sans taille (map_image) : {missing_size[:8]}...')


if __name__ == '__main__':
    main()