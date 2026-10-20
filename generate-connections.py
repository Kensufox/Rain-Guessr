#!/usr/bin/env python3
"""
Génère les fichiers de connexions  map/World/Regions/Rooms/<REGION>-rooms/link_<region>-rooms_connection.txt
lus par js/Map/connection_loader.js (lignes jaunes entre les rooms).

Sources :
  - map-reader/World/Regions/Data/<REGION>/world_<region>.txt   section ROOMS : "ROOM : DEST0, DEST1, ... : FLAGS"
        l'ordre des destinations = l'ordre des sorties (exits) de la room
  - worlds/world/world/<region>-rooms/<room>.txt                 fichier de room brut Rain World (vanilla)

Principe :
  Dans un fichier de room brut, les tuiles sont stockées colonne par colonne (index = x * hauteur + y), chacune
  "type,attr,attr...". Un raccourci est une entrée (type 4) suivie d'un chemin de tuiles portant l'attribut 3.
  Quand ce chemin se termine par une tuile portant l'attribut 4, c'est une SORTIE de la room vers une autre room.
  Le fichier world donne les destinations d'une room mais pas quelle sortie mène à laquelle : on associe chaque
  sortie à la destination la plus proche sur la carte (positions de json/map-data.json, donc lancer
  precompile-map.py avant). Les destinations de type GATE_* n'ont pas de position et prennent les sorties restantes.
  Sur les 7 régions qui avaient déjà un fichier fait à la main, ~80 % des rooms sont retrouvées à l'identique,
  le reste diffère de quelques tuiles.

Format de sortie (identique aux fichiers existants) :
  room|nb|destB|YxX[|dir]|destC|YxX[|dir]...        (destinations triées par nom ; dir = N/S/E/W, sens de la sortie)
  YxX = position de la tuile d'entrée de la sortie, Y puis X.

Gates : une gate n'a pas de ligne dans les fichiers de région ; on écrit ses lignes (position de ses sorties) dans le
  fichier de la région de chaque room qu'elle relie (une gate de 2 régions a donc une ligne dans chacun des 2
  fichiers). Ses destinations sont réparties sur les deux fichiers world (une moitié "DISCONNECTED" de chaque
  côté) et fusionnées. Seules les lignes commençant par "gate_"
  sont remplacées dans ces fichiers, le reste n'est pas touché.

Usage :  python generate-connections.py [REGION ...]      (sans argument : toutes les régions)
         python generate-connections.py --check           (compare avec les fichiers existants, n'écrit rien)
         python generate-connections.py --force SU        (remplace un fichier existant ; sinon les existants sont conservés)
"""

import itertools
import json
import re
import sys
from pathlib import Path

BASE = Path(__file__).parent
WORLD_DIR = BASE / "worlds" / "world" / "world"      # world_<r>.txt, map_<r>.txt et les rooms brutes
RAW_ROOMS = WORLD_DIR
OUT_DIR = BASE / "map" / "World" / "Regions" / "Rooms"
MAP_DATA = BASE / "json" / "map-data.json"
GATE_LINK_FILE = Path("Gate-rooms") / "link_gate-rooms_connection.txt"   # une ligne par gate (toutes ses destinations)


def parse_world_rooms(region):
    """-> { 'CC_A02': ['CC_C08', 'CC_A12', 'CC_A16'], ... } (la liste garde les DISCONNECTED pour conserver l'index)."""
    path = WORLD_DIR / region.lower() / f"world_{region.lower()}.txt"
    rooms, inside = {}, False
    for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw.strip()
        if line == "ROOMS":
            inside = True
            continue
        if line == "END ROOMS":
            break
        if not inside or ":" not in line:
            continue
        parts = [p.strip() for p in line.split(":")]
        name = parts[0]
        dests = [d.strip() for d in parts[1].split(",")] if len(parts) > 1 and parts[1] else []
        rooms[name] = dests
    return rooms


def load_room_tiles(room):
    """-> (w, h, tiles) où tiles[x][y] = (type, [attributs]) ; None si le fichier est introuvable ou illisible."""
    folder = "gates" if room.upper().startswith("GATE_") else f"{room.split('_')[0].lower()}-rooms"
    path = RAW_ROOMS / folder / f"{room.lower()}.txt"
    if not path.exists():
        return None
    lines = path.read_text(encoding="utf-8", errors="ignore").split("\n")
    try:
        w, h = (int(v) for v in lines[1].split("|")[0].split("*"))
    except (IndexError, ValueError):
        return None
    for line in lines[8:16]:                       # la ligne des tuiles est celle qui contient w*h entrées
        cells = line.split("|")
        if len(cells) in (w * h, w * h + 1):          # (1 entrée vide finale possible)
            tiles = []
            for x in range(w):
                col = []
                for y in range(h):
                    parts = cells[x * h + y].split(",")
                    col.append((parts[0], parts[1:]))
                tiles.append(col)
            return w, h, tiles
    return None


def find_exits(w, h, tiles):
    """-> liste triée (y, x) de { x, y, dir } : une entrée de raccourci par sortie de la room."""
    def is_path(x, y):
        return 0 <= x < w and 0 <= y < h and "3" in tiles[x][y][1]

    exits, seen = [], set()
    for y in range(h):
        for x in range(w):
            if tiles[x][y][0] != "4" or (x, y) in seen:
                continue
            # parcours du chemin à partir de l'entrée
            stack, comp = [(x, y)], {(x, y)}
            while stack:
                cx, cy = stack.pop()
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if (nx, ny) not in comp and is_path(nx, ny):
                        comp.add((nx, ny))
                        stack.append((nx, ny))
            seen |= {c for c in comp if tiles[c[0]][c[1]][0] == "4"}
            ends = [c for c in comp if tiles[c[0]][c[1]][0] != "4" and "4" in tiles[c[0]][c[1]][1]]
            if not ends:
                continue                           # tuyau ou tanière : pas une sortie
            ex, ey = ends[0]
            # plusieurs entrées reliées au même chemin : on garde celle la plus proche du bout du chemin
            entrances = [c for c in comp if tiles[c[0]][c[1]][0] == "4"]
            sx, sy = min(entrances, key=lambda c: abs(c[0] - ex) + abs(c[1] - ey))
            dx, dy = ex - sx, ey - sy
            d = ("E" if dx > 0 else "W") if abs(dx) >= abs(dy) else ("S" if dy > 0 else "N")
            exits.append({"x": sx, "y": sy, "dir": d})
    exits.sort(key=lambda e: (e["y"], e["x"]))
    return exits


def load_room_positions():
    """{ 'cc_a02': (x, y, w, h) } en repère carte (tuiles, Y vers le haut, coin haut-gauche), comme map_loader.js."""
    data = json.loads(MAP_DATA.read_text(encoding="utf-8"))
    rooms = {}
    for region, lst in data["rooms"].items():
        rp = data["regionPositions"][region]
        for r in lst:
            rooms[r["fullName"].lower()] = (r["position"]["x"] / 2 + rp["x"], r["position"]["y"] / 2 + rp["y"],
                                            r["width"], r["height"])
    return rooms


def dist_to_room(px, py, room):
    ox, oy, w, h = room
    dx = max(ox - px, 0, px - (ox + w))
    dy = max((oy - h) - py, 0, py - oy)
    return (dx * dx + dy * dy) ** 0.5


def match_exits(room, dests, exits, positions):
    """Associe chaque destination à une sortie (permutation qui minimise la distance entrée → room destination)."""
    ox, oy, _, _ = positions[room.lower()]
    best = None
    for perm in itertools.permutations(range(len(exits))):
        cost = 0.0
        for di, ei in enumerate(perm):
            d = dests[di].lower()
            if d == "disconnected" or d.startswith("gate") or d not in positions:
                continue
            cost += dist_to_room(ox + exits[ei]["x"], oy - exits[ei]["y"], positions[d])
        key = (round(cost, 3), sum(abs(a - b) for a, b in enumerate(perm)))   # à égalité : ordre du fichier world
        if best is None or key < best[0]:
            best = (key, perm)
    return best[1]


def build_region(region, positions):
    world = parse_world_rooms(region)
    lines, warnings = [], []
    for room in sorted(world, key=str.lower):
        dests = world[room]
        if room.upper().startswith("GATE_") or room.upper().startswith("OFFSCREEN") or not any(d != "DISCONNECTED" for d in dests):
            continue
        data = load_room_tiles(room)
        if data is None:
            warnings.append(f"{room}: fichier de room brut illisible")
            continue
        exits = find_exits(*data)
        if len(exits) != len(dests):
            warnings.append(f"{room}: {len(exits)} sortie(s) trouvée(s) pour {len(dests)} destination(s) → ignorée")
            continue
        if len(exits) > 7 or room.lower() not in positions:
            warnings.append(f"{room}: association impossible (trop de sorties ou room absente de map-data.json) → ignorée")
            continue
        order = match_exits(room, dests, exits, positions)
        entries = []
        for dest, ei in zip(dests, order):
            if dest == "DISCONNECTED":
                continue
            ex = exits[ei]
            entries.append((dest.lower(), f"{ex['y']}x{ex['x']}", ex["dir"]))
        entries.sort(key=lambda e: e[0])
        lines.append(f"{room.lower()}|{len(entries)}|" + "|".join(f"{d}|{p}|{r}" for d, p, r in entries))
    return lines, warnings


def read_existing(region):
    path = OUT_DIR / f"{region}-rooms" / f"link_{region.lower()}-rooms_connection.txt"
    return path, ([l.strip() for l in path.read_text(encoding="utf-8").splitlines() if l.strip()] if path.exists() else None)


def entries_of(line):
    """'room|n|destB|pos[|dir]|destC|pos...' -> (room, frozenset({(dest, pos)})) — sans les directions, insensible à l'ordre."""
    parts = line.split("|")
    try:
        n = int(parts[1])
    except (IndexError, ValueError):
        return None
    out, i = set(), 2
    for _ in range(n):
        dest, pos = parts[i].lower(), parts[i + 1].lower()
        i += 2
        if i < len(parts) and re.fullmatch(r"[NSEWnsew]", parts[i]):
            i += 1
        out.add((dest, pos))
    return parts[0].lower(), frozenset(out)


# ── Gates ─────────────────────────────────────────────────────────────────────

MAP_LINE = re.compile(r'^([A-Za-z0-9_]+)\s*:\s*(-?[\d.]+)><(-?[\d.]+)><')


def local_map_positions():
    """Positions BRUTES (dans le repère de chaque région, sans region_pos ni décalages) : { région: { nom_minuscule: (x/2, y/2) } }."""
    out = {}
    for d in sorted(p for p in WORLD_DIR.iterdir() if p.is_dir()):
        f = d / f"map_{d.name}.txt"
        if not f.exists():
            continue
        pos = {}
        for line in f.read_text(encoding="utf-8", errors="ignore").splitlines():
            m = MAP_LINE.match(line.strip())
            if m:
                pos[m.group(1).lower()] = (int(float(m.group(2))) / 2, int(float(m.group(3))) / 2)
        out[d.name.upper()] = pos
    return out


def merged_gate_destinations():
    """{ 'GATE_CC_UW': ['CC_H01', 'UW_D07'] } + { 'GATE_CC_UW': { 'CC_H01': 'CC', 'UW_D07': 'UW' } }"""
    dests, origin = {}, {}
    for region_dir in sorted(p for p in WORLD_DIR.iterdir() if (p / f"world_{p.name}.txt").exists()):
        region = region_dir.name.upper()
        for room, lst in parse_world_rooms(region).items():
            if not room.upper().startswith("GATE_"):
                continue
            cur = dests.setdefault(room.upper(), [None] * len(lst))
            if len(cur) < len(lst):
                cur.extend([None] * (len(lst) - len(cur)))
            for i, d in enumerate(lst):
                if d != "DISCONNECTED" and cur[i] is None:
                    cur[i] = d.upper()
                    origin.setdefault(room.upper(), {})[d.upper()] = region
    return dests, origin


def update_gate_lines(check=False):
    data = json.loads(MAP_DATA.read_text(encoding="utf-8"))
    sizes = {r["fullName"].lower(): (r["width"], r["height"], region)
             for region, lst in data["rooms"].items() for r in lst}
    local = local_map_positions()
    dests, origin = merged_gate_destinations()
    gate_lines, warnings = [], []

    for gate in sorted(dests):
        names = dests[gate]
        raw = load_room_tiles(gate)
        if raw is None or gate.lower() not in sizes:
            warnings.append(f"{gate}: fichier brut ou entrée map-data.json introuvable → ignorée")
            continue
        exits = find_exits(*raw)
        wanted = [d for d in names if d]
        if len(exits) != len(names):
            warnings.append(f"{gate}: {len(exits)} sortie(s) trouvée(s) pour {len(names)} destination(s) → ignorée")
            continue

        def cost(perm):
            total = 0.0
            for di, ei in enumerate(perm):
                d = names[di]
                if not d:
                    continue
                region = origin[gate][d]
                gx, gy = local[region][gate.lower()]            # la gate dans le repère de la région de la room
                rx, ry = local[region][d.lower()]
                w, h = sizes[d.lower()][0], sizes[d.lower()][1]
                total += dist_to_room(gx + exits[ei]["x"], gy - exits[ei]["y"], (rx, ry, w, h))
            return total

        best = min(itertools.permutations(range(len(exits))),
                   key=lambda perm: (round(cost(perm), 3), sum(abs(a - b) for a, b in enumerate(perm))))
        entries = []
        for di, ei in enumerate(best):
            if names[di]:
                ex = exits[ei]
                entries.append((names[di].lower(), f"{ex['y']}x{ex['x']}", ex["dir"]))
        if not entries:
            continue
        entries.sort(key=lambda e: e[0])
        gate_lines.append(f"{gate.lower()}|{len(entries)}|" + "|".join(f"{d}|{p}|{r}" for d, p, r in entries) + "|")

    path = OUT_DIR / GATE_LINK_FILE
    old_text = path.read_text(encoding="utf-8") if path.exists() else ""
    old = {}
    for line in old_text.splitlines():
        e = entries_of(line)
        if e:
            old[e[0]] = e[1]
    new = dict(e for e in map(entries_of, gate_lines) if e)
    filled = sum(1 for k, v in old.items() if any(pos != "0x0" for _, pos in v))
    agree = sum(1 for k, v in old.items() for item in v if item[1] != "0x0" and item in new.get(k, ()))
    manual = sum(1 for k, v in old.items() for item in v if item[1] != "0x0")
    if manual:
        print(f"Gate-rooms: {agree}/{manual} position(s) déjà saisies à la main retrouvées à l'identique")
    if check:
        print(f"Gate-rooms: {len(gate_lines)} gate(s) → {path.relative_to(BASE)} (non écrit)")
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        eol = "\r\n" if "\r\n" in old_text else "\n"
        with open(path, "w", encoding="utf-8", newline="") as fh:
            fh.write("".join(l + eol for l in gate_lines))
        print(f"Gate-rooms: {len(gate_lines)} gate(s) → {path.relative_to(BASE)}")
    for w in warnings:
        print(f"   ! {w}")


def main(argv):
    check = "--check" in argv
    force = "--force" in argv
    regions = [a for a in argv if not a.startswith("--")] or sorted(p.name.upper() for p in WORLD_DIR.iterdir() if (p / f"world_{p.name}.txt").exists())
    positions = load_room_positions()
    for region in regions:
        lines, warnings = build_region(region, positions)
        path, existing = read_existing(region)
        if check:
            if existing is None:
                print(f"{region}: pas de fichier existant ({len(lines)} lignes générées)")
            else:
                gen = dict(e for e in map(entries_of, lines) if e)
                old = dict(e for e in map(entries_of, existing) if e)
                same = sum(1 for k in old if gen.get(k) == old[k])
                print(f"{region}: {same}/{len(old)} rooms identiques à la main (positions), {len(set(gen) - set(old))} en plus générées")
        else:
            if existing is not None and not force:
                print(f"{region}: fichier existant conservé (--force pour le remplacer)")
                continue
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            print(f"{region}: {len(lines)} rooms → {path.relative_to(BASE)}")
        for w in warnings:
            print(f"   ! {w}")

    if "--no-gates" not in argv:
        update_gate_lines(check)


if __name__ == "__main__":
    main(sys.argv[1:])