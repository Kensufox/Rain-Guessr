import os

path = os.path.dirname(os.path.abspath(__file__))

file = "World\Regions"
file_path = os.path.join(path, file)

strange_values = []

def parse_room(file_path):
    print(file_path)
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

    for y in range(height):
        for x in range(width):
            try :
                cell = float(geometry_data[y+(x*height)].replace(",", "."))
            except ValueError:
                cell = -1

                if geometry_data[y+(x*height)] == "1,4,3":
                    cell = 5
                elif geometry_data[y+(x*height)] == "0,3,6":
                    cell = 6
                elif geometry_data[y+(x*height)] == "0,3,1,6":
                    cell = 7
                elif geometry_data[y+(x*height)] == "0,1,6":
                    cell = 8
                elif geometry_data[y+(x*height)] == "4,3,6":
                    cell = 9
                elif geometry_data[y+(x*height)] == "0,2,6":
                    cell = 10
                elif geometry_data[y+(x*height)] == "0,1,2":
                    cell = 11
                elif geometry_data[y+(x*height)] == "0,1,2,6":
                    cell = 12
                elif geometry_data[y+(x*height)] == "3,1,6":
                    cell = 13
                elif geometry_data[y+(x*height)] == "1,9,3":
                    cell = 14
                elif geometry_data[y+(x*height)] == "0,2,1":
                    cell = 15
                elif geometry_data[y+(x*height)] == "0,7,6":
                    cell = 16
                elif geometry_data[y+(x*height)] == "0,1,7,6":
                    cell = 17
                elif geometry_data[y+(x*height)] == "1,5,3":
                    cell = 18
                elif geometry_data[y+(x*height)] == "0,4,3,6":
                    cell = 19
                elif geometry_data[y+(x*height)] == "2,3,6":
                    cell = 20
                elif geometry_data[y+(x*height)] == "0,3,2,6":
                    cell = 21
                elif geometry_data[y+(x*height)] == "0,1,3,6":
                    cell = 22
                elif geometry_data[y+(x*height)] == "0,3,7,6":
                    cell = 23
                elif geometry_data[y+(x*height)] == "0,2,1,6":
                    cell = 24
                elif geometry_data[y+(x*height)] == "0,2,3,6":
                    cell = 25
                elif geometry_data[y+(x*height)] == "0,1,7":
                    cell = 26
                elif geometry_data[y+(x*height)] == "0,2,1,3,6":
                    cell = 27
                elif geometry_data[y+(x*height)] == "1,12,3":
                    cell = 28
                elif geometry_data[y+(x*height)] == "0,1,2,3,6":
                    cell = 29
                elif geometry_data[y+(x*height)] == "4,3,2,6":
                    cell = 30
                elif geometry_data[y+(x*height)] == "3,3,1,6":
                    cell = 31
                elif geometry_data[y+(x*height)] == "4,6,3":
                    cell = 32
                elif geometry_data[y+(x*height)] == "0,6,7":
                    cell = 33
                elif geometry_data[y+(x*height)] == "1,3,9":
                    cell = 34
                elif geometry_data[y+(x*height)] == "0,6,1":
                    cell = 35
                elif geometry_data[y+(x*height)] == "3,6,1":
                    cell = 36
                elif geometry_data[y+(x*height)] == "1,3,4":
                    cell = 37
                elif geometry_data[y+(x*height)] == "1,3,12":
                    cell = 38
                elif geometry_data[y+(x*height)] == "0,6,2":
                    cell = 39
                elif geometry_data[y+(x*height)] == "0,6,3":
                    cell = 40
                elif geometry_data[y+(x*height)] == "0,6,1,3":
                    cell = 41
                elif geometry_data[y+(x*height)] == "1,3,5":
                    cell = 42
                elif geometry_data[y+(x*height)] == "4,3,1,2,6":
                    cell = 43
                elif geometry_data[y+(x*height)] == "3,2,6":
                    cell = 44
                elif geometry_data[y+(x*height)] == "3,1,2,6":
                    cell = 45
                elif geometry_data[y+(x*height)] == "4,3,1":
                    cell = 46
                elif geometry_data[y+(x*height)] == "0,1,3":
                    cell = 47
                elif geometry_data[y+(x*height)] == "0,1,3,2,6":
                    cell = 48
                elif geometry_data[y+(x*height)] == "0,3,1,2,6":
                    cell = 49
                elif geometry_data[y+(x*height)] == "0,3,1":
                    cell = 50
                elif geometry_data[y+(x*height)] == "0,3,2":
                    cell = 51
                elif geometry_data[y+(x*height)] == "0,3,2,1,6":
                    cell = 52
                elif geometry_data[y+(x*height)] == "3,3,6":
                    cell = 53
                elif geometry_data[y+(x*height)] == "2,1,6":
                    cell = 54
                elif geometry_data[y+(x*height)] == "1,4,3,6":
                    cell = 55
                elif geometry_data[y+(x*height)] == "1,3,6":
                    cell = 56
                elif geometry_data[y+(x*height)] == "0,8,6":
                    cell = 57
                elif geometry_data[y+(x*height)] == "2,2,6":
                    cell = 58
                elif geometry_data[y+(x*height)] == "4,3,3,6":
                    cell = 59
                elif geometry_data[y+(x*height)] == "3,2,1,6":
                    cell = 60
                elif geometry_data[y+(x*height)] == "3,1,2":
                    cell = 61
                elif geometry_data[y+(x*height)] == "0,7,1":
                    cell = 62
                elif geometry_data[y+(x*height)] == "0,7,1,6":
                    cell = 63
                elif geometry_data[y+(x*height)] == "4,3,1,3,6":
                    cell = 64
                elif geometry_data[y+(x*height)] == "0,11,6":
                    cell = 65
                elif geometry_data[y+(x*height)] == "0,1,11,6":
                    cell = 66
                elif geometry_data[y+(x*height)] == "0,11,3,6":
                    cell = 67
                elif geometry_data[y+(x*height)] == "0,11,1":
                    cell = 68
                elif geometry_data[y+(x*height)] == "4,6,1,3":
                    cell = 69
                elif geometry_data[y+(x*height)] == "0,6,1,8":
                    cell = 70
                elif geometry_data[y+(x*height)] == "0,6,8":
                    cell = 71
                elif geometry_data[y+(x*height)] == "0,6,3,9":
                    cell = 72
                elif geometry_data[y+(x*height)] == "0,6,1,2":
                    cell = 73
                elif geometry_data[y+(x*height)] == "0,7,3,6":
                    cell = 74
                elif geometry_data[y+(x*height)] == "0,4,1,3,6":
                    cell = 75
                elif geometry_data[y+(x*height)] == "0,4,3":
                    cell = 76
                elif geometry_data[y+(x*height)] == "0,2,3":
                    cell = 77
                elif geometry_data[y+(x*height)] == "2,6,1":
                    cell = 78
                elif geometry_data[y+(x*height)] == "0,8,1,6":
                    cell = 79
                elif geometry_data[y+(x*height)] == "0,1,8,6":
                    cell = 80
                elif geometry_data[y+(x*height)] == "0,9,3":
                    cell = 81
                elif geometry_data[y+(x*height)] == "4,3,2":
                    cell = 82
                elif geometry_data[y+(x*height)] == "4,3,2,1,6":
                    cell = 83
                elif geometry_data[y+(x*height)] == "0,9,3,6":
                    cell = 84
                elif geometry_data[y+(x*height)] == "4,3,3,1,6":
                    cell = 85
                elif geometry_data[y+(x*height)] == "0,6,11":
                    cell = 86
                elif geometry_data[y+(x*height)] == "3,1,3,6":
                    cell = 87
                elif geometry_data[y+(x*height)] == "0,11,1,6":
                    cell = 88
                elif geometry_data[y+(x*height)] == "0,1,11":
                    cell = 89
                elif geometry_data[y+(x*height)] == "0,3,11,6":
                    cell = 90
                elif geometry_data[y+(x*height)] == "4,3,1,6":
                    cell = 91            
                        
            if cell == 0:
                grid[y][x] = '.'  # Air
            elif cell == 1:
                grid[y][x] = '#'  # Mur
            elif cell == 2:
                grid[y][x] = '~'  # Eau
            elif cell == 3:
                grid[y][x] = '1'  # ?
            elif cell == 4:
                grid[y][x] = '2'  # ?
            elif cell == 5:
                grid[y][x] = '#'  # and of between room pipe
            elif cell == 6:
                grid[y][x] = '.'  # background inside room pipe
            elif cell == 7:
                grid[y][x] = '|'  # hide inside room pipe behind vertical pole crossing
            elif cell == 8:
                grid[y][x] = '|'  # vertical pole
            elif cell == 9:
                grid[y][x] = '='  # pipe entry
            elif cell == 10:
                grid[y][x] = '-'  # horizontal pole
            elif cell == 11:
                grid[y][x] = '+'  # vertical pipe and horizontal pipe crossing
            elif cell == 12:
                grid[y][x] = '5'  # also pipe crossing ? (need to be sure)
            elif cell == 13:
                grid[y][x] = '#'  # half block
            elif cell == 14:
                grid[y][x] = '#'  # and of creature pipe
            elif cell == 15:
                grid[y][x] = '8'
            elif cell == 16:
                grid[y][x] = '9'
            elif cell == 17:
                grid[y][x] = 'A'
            elif cell == 18:
                grid[y][x] = 'B'
            elif cell == 19:
                grid[y][x] = 'C'
            elif cell == 20:
                grid[y][x] = 'D'
            elif cell == 21:                
                grid[y][x] = 'E'
            elif cell == 22:
                grid[y][x] = '|'   # hide inside room pipe behind vertical pole aligning             
            elif cell == 23:
                grid[y][x] = 'G'
            elif cell == 24:
                grid[y][x] = 'H'
            elif cell == 25:
                grid[y][x] = '-'  # hide inside room pipe behind horizontal pole 
            elif cell == 26:
                grid[y][x] = 'J'
            else:
                grid[y][x] = '?'  # Inconnu

    # Génération du rendu ASCII
    ascii_art = '\n'.join(''.join(row) for row in grid)
    return ascii_art


# Chemin du fichier Room
#file_path = os.path.join(path, "gw_c04.txt")

def run(file_path):
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

for root, dirs, files in os.walk(file_path):
    for file in files:
        if file.endswith(".txt") and file != "regions.txt":
            with open(os.path.join(root, file), 'r') as fp:
                for count, line in enumerate(fp):
                    pass
            if count == 11:
                run(os.path.join(root, file))