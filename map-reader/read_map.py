import os

path = os.path.dirname(os.path.abspath(__file__))

def parse_room(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    # Initialisation des variables
    room_name = None
    width, height = 0, 0
    geometry_data = []

    # Analyse des données du fichier
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        if room_name is None:
            room_name = line  # Premier champ : nom de la pièce
        elif i == 1:
            # Ligne avec les dimensions
            width, height = map(int, line.split('|')[0].split('*'))
        elif i == 11:
            geometry_data = line.split('|')

    return room_name, width, height, geometry_data


def render_ascii_art(width, height, geometry_data):
    # Création d'une grille vide
    grid = [[' ' for _ in range(width)] for _ in range(height)]
    cell = 0
    strange_value = []

    for x in range(width):
        for y in range(height):
            try :
                cell = float(geometry_data[x+(y*width)].replace(",", "."))
            except ValueError:
                cell = -1
                strange_value.append(geometry_data[x+(y*width)])
            if cell == 0:
                grid[y][x] = '□'  # Air
            elif cell == 1:
                grid[y][x] = '#'  # Mur
            elif cell == 2:
                grid[y][x] = '~'  # Eau
            elif cell == 3:
                grid[y][x] = '|'  # Poteaux verticaux
            elif cell == 4:
                grid[y][x] = '-'  # Poteaux horizontaux
            else:
                grid[y][x] = '?'  # Inconnu

    print(strange_value)
    # Génération du rendu ASCII
    ascii_art = '\n'.join(''.join(row) for row in grid)
    return ascii_art


# Chemin du fichier Room
file_path = os.path.join(path, "gw_c11.txt")

# Lecture et rendu de la pièce
room_name, width, height, geometry_data = parse_room(file_path)
if room_name:
    ascii_art = render_ascii_art(width, height, geometry_data)

    # Affichage
    print(f"Pièce : {room_name}")
    print(f"taille : {width}x{height}")
    print(ascii_art)
else:
    print("Erreur dans le fichier ou les dimensions.")
