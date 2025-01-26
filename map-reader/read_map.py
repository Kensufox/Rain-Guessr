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
        elif i == 4:
            geometry_data = line.split('|')

    return room_name, width, height, geometry_data

def render_ascii_art(width, height, geometry_data):
    # Création d'une grille vide
    grid = [[' ' for _ in range(width)] for _ in range(height)]
    cell = 0

    for y in range(height):
        for x in range(width):
            if len(geometry_data[y+(x*height)]) == 1:
                cell = float(geometry_data[y+(x*height)].replace(",", "."))
            else:
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
                elif geometry_data[y+(x*height)] == "1,3":
                    cell = 92
                elif geometry_data[y+(x*height)] == "0,6":
                    cell = 93
                elif geometry_data[y+(x*height)] == "0,1":
                    cell = 94
                elif geometry_data[y+(x*height)] == "3,6":
                    cell = 95
                elif geometry_data[y+(x*height)] == "0,2":
                    cell = 96
                elif geometry_data[y+(x*height)] == "2,6":
                    cell = 97
                elif geometry_data[y+(x*height)] == "1,10":
                    cell = 98
                elif geometry_data[y+(x*height)] == "0,7":
                    cell = 99
                elif geometry_data[y+(x*height)] == "0,3":
                    cell = 100
                elif geometry_data[y+(x*height)] == "2,1":
                    cell = 101
                elif geometry_data[y+(x*height)] == "3,1":
                    cell = 102
            if cell == -1:  
                print(geometry_data[y+(x*height)])

            
            # I've tried to make an optimized versdion of this monstruous switch case, but it doesn't work, and was even slower.

            #tile_data_path = os.path.join(path, "tile-data.txt")
            #data_line = 0
            #data_bool = False
            #param_line = 0
            #cell_bool = False
            #with open(tile_data_path, 'r') as f:
            #    lines = f.readlines()
            #for i, line in enumerate(lines):
            #    if line.startswith("param:"):
            #        param_line = i
            #    elif line.startswith("data:"):
            #        data_line = i
            #        data_bool = True
            #    elif data_bool:
            #        if i == data_line + 1 + cell:
            #            temp = line.split('=')
            #            temp = temp[1].replace('\n', '')
            #            #print(i, temp, cell)
            #            var_found = False
            #            for pdata in range(data_line - param_line - 1):
            #                temp_pdata = lines[pdata].split(';')
            #                if temp == temp_pdata[0]:
            #                    grid[y][x] = temp_pdata[1].replace('\n', '')
            #                    var_found = True
            #                    break
            #            if not var_found:
            #                grid[y][x] = temp
            #                #print(f"Valeur inconnue : {cell}")
            #            cell_bool = True
            #if not cell_bool:
            #    grid[y][x] = '?'
            #    print(f"Valeur inconnue : {cell}")
            ##print(grid[y][x])

            if cell == 0:
                grid[y][x] = '.'  # Air
            elif cell == 1:
                grid[y][x] = '#'  # Mur
            elif cell == 2:
                grid[y][x] = '\\' # celling slope
            elif cell == 3:
                grid[y][x] = '#'  # start of creature pipe
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
                grid[y][x] = '+'  # also pipe crossing
            elif cell == 13:
                grid[y][x] = '#'  # half block
            elif cell == 14:
                grid[y][x] = '#'  # end of creature pipe vertical
            elif cell == 15:
                grid[y][x] = '+'  # also crossing pipe
            elif cell == 16:
                grid[y][x] = '.'  # bat spawn/pipe/nest
            elif cell == 17:
                grid[y][x] = '|'  # bat den and vertical pole crossing
            elif cell == 18:
                grid[y][x] = '#'  # end of creature pipe horizontal
            elif cell == 19:
                grid[y][x] = '.'  # end background between pipe
            elif cell == 20:
                grid[y][x] = '/'  # slope
            elif cell == 21:
                grid[y][x] = '-'  # hide inside room pipe behind horizontal pole aligning
            elif cell == 22:
                grid[y][x] = '|'  # hide inside room pipe behind vertical pole aligning             
            elif cell == 23:
                grid[y][x] = '.'  # bat den
            elif cell == 24:
                grid[y][x] = '+'  # also pipe crossing
            elif cell == 25:
                grid[y][x] = '-'  # hide inside room pipe behind horizontal pole 
            elif cell == 26:
                grid[y][x] = '9'
            elif cell == 27:
                grid[y][x] = '+'  # also pipe crossing
            elif cell == 28:
                grid[y][x] = '#'  # end creature pipe
            elif cell == 29:
                grid[y][x] = '+'  # also pipe crossing
            elif cell == 30:
                grid[y][x] = 'C'
            elif cell == 31:
                grid[y][x] = 'D'
            elif cell == 32:
                grid[y][x] = '#'  # underwater creature pipe
            elif cell == 33:
                grid[y][x] = 'E'
            elif cell == 34:
                grid[y][x] = '#'  # end creature pipe
            elif cell == 35:
                grid[y][x] = '|'  # also vertical pole
            elif cell == 36:
                grid[y][x] = '#'  # pole cross with half block
            elif cell == 37:
                grid[y][x] = '#'  # end between room pipe
            elif cell == 38:
                grid[y][x] = '#'  # I don't know
            elif cell == 39:
                grid[y][x] = 'F'
            elif cell == 40:
                grid[y][x] = '.'  # background pipe
            elif cell == 41:
                grid[y][x] = '|'  # pipe and virtical pole crossing
            elif cell == 42:
                grid[y][x] = '#'  # end underwater creature pipe
            elif cell == 43:
                grid[y][x] = 'G'
            elif cell == 44:
                grid[y][x] = 'H'
            elif cell == 45:
                grid[y][x] = 'I'
            elif cell == 46:
                grid[y][x] = 'J'
            elif cell == 47:
                grid[y][x] = '|'  # also vertical pole
            elif cell == 48:
                grid[y][x] = 'K'
            elif cell == 49:
                grid[y][x] = 'L'
            elif cell == 50:
                grid[y][x] = 'M'
            elif cell == 51:
                grid[y][x] = 'N'
            elif cell == 52:
                grid[y][x] = 'O'
            elif cell == 53:
                grid[y][x] = 'P'
            elif cell == 54:
                grid[y][x] = '/'  # slope and vertical pole crossing
            elif cell == 55:
                grid[y][x] = 'R'
            elif cell == 56:
                grid[y][x] = 'S'
            elif cell == 57:
                grid[y][x] = 'T'
            elif cell == 58:
                grid[y][x] = 'U'
            elif cell == 59:
                grid[y][x] = 'V'
            elif cell == 60:
                grid[y][x] = '#'  # half block
            elif cell == 61:
                grid[y][x] = 'W'
            elif cell == 62:
                grid[y][x] = 'X'
            elif cell == 63:
                grid[y][x] = 'Y'
            elif cell == 64:
                grid[y][x] = 'Z'
            elif cell == 65:
                grid[y][x] = 'a'
            elif cell == 66:
                grid[y][x] = 'b'
            elif cell == 67:
                grid[y][x] = 'c'
            elif cell == 68:
                grid[y][x] = 'd'
            elif cell == 69:
                grid[y][x] = 'e'
            elif cell == 70:
                grid[y][x] = 'f'
            elif cell == 71:
                grid[y][x] = 'g'
            elif cell == 72:
                grid[y][x] = 'h'
            elif cell == 73:
                grid[y][x] = 'i'
            elif cell == 74:
                grid[y][x] = 'j'
            elif cell == 75:
                grid[y][x] = 'k'
            elif cell == 76:
                grid[y][x] = '.'  # end between room pipe
            elif cell == 77:
                grid[y][x] = 'm'
            elif cell == 78:
                grid[y][x] = 'n'
            elif cell == 79:
                grid[y][x] = 'o'
            elif cell == 80:
                grid[y][x] = 'p'
            elif cell == 81:
                grid[y][x] = 'q'
            elif cell == 82:
                grid[y][x] = 'r'
            elif cell == 83:
                grid[y][x] = 's'
            elif cell == 84:
                grid[y][x] = 't'
            elif cell == 85:
                grid[y][x] = 'u'
            elif cell == 86:
                grid[y][x] = 'v'
            elif cell == 87:
                grid[y][x] = '#'  # half block
            elif cell == 89:
                grid[y][x] = 'x'
            elif cell == 90:
                grid[y][x] = 'y'
            elif cell == 91:
                grid[y][x] = '#'  # wall
            elif cell == 92:
                grid[y][x] = '#'  # end between room pipe
            elif cell == 93:
                grid[y][x] = '.'  # background
            elif cell == 94:
                grid[y][x] = '|'  # also vertical pole
            elif cell == 95:
                grid[y][x] = '#'  # entry creature pipe
            elif cell == 96:
                grid[y][x] = '-'  # horizontal pole
            elif cell == 97:
                grid[y][x] = '/'  # slope
            elif cell == 98:
                grid[y][x] = '#'  # something idk
            elif cell == 99:
                grid[y][x] = '.'  # aslo bat nest
            elif cell == 100:
                grid[y][x] = '.'  # between room pipe background
            elif cell == 101:
                grid[y][x] = '/'  # slop and vertical pole crossing
            elif cell == 102:
                grid[y][x] = '#'  # half block and vertical pole crossing
            else:
                grid[y][x] = '?'  # Inconnu
                print(f"Valeur inconnue : {cell}")

    # Génération du rendu ASCII
    ascii_art = '\n'.join(''.join(row) for row in grid)
    return ascii_art

output_file = os.path.join(path, "output.txt")
open(output_file, 'w').close()
error_file = os.path.join(path, "error.txt")
open(error_file, 'w').close()

def run(file_path):
    # Lecture et rendu de la pièce
    room_name, width, height, geometry_data = parse_room(file_path)
    if room_name:
        ascii_art = render_ascii_art(width, height, geometry_data)

        # Affichage
        print(f"Pièce : {room_name}")
        print(f"taille : {width}x{height}")
        print(ascii_art)
        with open(output_file, 'a') as f:
            f.write(f"Pièce : {room_name}\n")
            f.write(f"taille : {width}x{height}\n")
            f.write(ascii_art)
            f.write("\n")
    else:
        print("Erreur dans le fichier ou les dimensions.")
        with open(output_file, 'a') as f:
            print("Erreur dans le fichier ou les dimensions.")

for root, dirs, files in os.walk(file_path):
    for file in files:
        if file.endswith(".txt") and file != "regions.txt":
            with open(os.path.join(root, file), 'r') as fp:
                for count, line in enumerate(fp):
                    pass
            if count == 4:
                try:
                    run(os.path.join(root, file))
                except:
                    print("something went wrong")
                    with open(error_file, 'a') as f:
                        f.write(os.path.join(root, file))
                        f.write("\n")

# Chemin du fichier Room
#file_path = os.path.join(path, "gw_c04.txt")
#file_path = os.path.join(path, "gw_c11.txt")
#file_path = os.path.join(path, "gw_a23.txt")
#run(os.path.join(file_path))