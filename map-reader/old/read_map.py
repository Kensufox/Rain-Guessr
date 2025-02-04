import os

path = os.path.dirname(os.path.abspath(__file__))

file = "World\Regions\Rooms"
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
    list_error = []

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
                elif geometry_data[y+(x*height)] == "0,1,3":
                    cell = 47
                elif geometry_data[y+(x*height)] == "0,1,3,2,6":
                    cell = 48
                elif geometry_data[y+(x*height)] == "0,3,1,2,6":
                    cell = 49
                elif geometry_data[y+(x*height)] == "3,3,6":
                    cell = 53
                elif geometry_data[y+(x*height)] == "2,1,6":
                    cell = 54
                elif geometry_data[y+(x*height)] == "0,8,6":
                    cell = 57
                elif geometry_data[y+(x*height)] == "2,2,6":
                    cell = 58
                elif geometry_data[y+(x*height)] == "3,2,1,6":
                    cell = 60
                elif geometry_data[y+(x*height)] == "0,7,1,6":
                    cell = 63
                elif geometry_data[y+(x*height)] == "0,11,6":
                    cell = 65
                elif geometry_data[y+(x*height)] == "0,1,11,6":
                    cell = 66
                elif geometry_data[y+(x*height)] == "0,4,3":
                    cell = 76
                elif geometry_data[y+(x*height)] == "0,2,3":
                    cell = 77
                elif geometry_data[y+(x*height)] == "0,9,3":
                    cell = 81
                elif geometry_data[y+(x*height)] == "3,1,3,6":
                    cell = 87
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
                elif geometry_data[y+(x*height)] == "4,3":
                    cell = 103
                elif geometry_data[y+(x*height)] == "0,8":
                    cell = 104
                elif geometry_data[y+(x*height)] == "0,11":
                    cell = 105
                elif geometry_data[y+(x*height)] == "3,2":
                    cell = 106
                elif geometry_data[y+(x*height)] == "2,2":
                    cell = 107
                elif geometry_data[y+(x*height)] == "2,3":
                    cell = 108
                elif geometry_data[y+(x*height)] == "4,3,2,6":
                    cell = 109
                elif geometry_data[y+(x*height)] == "4,3,1,3,6":
                    cell = 110
                elif geometry_data[y+(x*height)] == "4,3,3,6":
                    cell = 111
                elif geometry_data[y+(x*height)] == "0,11,1":
                    cell = 112
                elif geometry_data[y+(x*height)] == "0,1,11":
                    cell = 113
                elif geometry_data[y+(x*height)] == "4,3,1":
                    cell = 114
                elif geometry_data[y+(x*height)] == "4,6,1,3":
                    cell = 115
                elif geometry_data[y+(x*height)] == "0,6,1,2":
                    cell = 116
                elif geometry_data[y+(x*height)] == "2,6,1":
                    cell = 117
                elif geometry_data[y+(x*height)] == "0,7,1":
                    cell = 118
                elif geometry_data[y+(x*height)] == "0,8,1,6":
                    cell = 119
                elif geometry_data[y+(x*height)] == "0,1,8,6":
                    cell = 120
                elif geometry_data[y+(x*height)] == "0,2,8,6":
                    cell = 121
                elif geometry_data[y+(x*height)] == "4,3,2":
                    cell = 122
                elif geometry_data[y+(x*height)] == "4,3,2,1,6":
                    cell = 123
                elif geometry_data[y+(x*height)] == "0,7,3,6":
                    cell = 124
                elif geometry_data[y+(x*height)] == "0,6,11":
                    cell = 125
                elif geometry_data[y+(x*height)] == "0,3,2":
                    cell = 126
                elif geometry_data[y+(x*height)] == "13":
                    cell = 13
                elif geometry_data[y+(x*height)] == "11":
                    cell = 11
            if cell == -1:  
                list_error.append(geometry_data[y+(x*height)])
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
                grid[y][x] = 'H'  # half block
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
                grid[y][x] = '|'  # pole and bat den crossing
            elif cell == 27:
                grid[y][x] = '+'  # also pipe crossing
            elif cell == 28:
                grid[y][x] = '#'  # end creature pipe
            elif cell == 29:
                grid[y][x] = '+'  # also pipe crossing
            elif cell == 32:
                grid[y][x] = '#'  # underwater creature pipe
            elif cell == 33:
                grid[y][x] = '.'  # bat den
            elif cell == 34:
                grid[y][x] = '#'  # end creature pipe
            elif cell == 35:
                grid[y][x] = '|'  # also vertical pole
            elif cell == 36:
                grid[y][x] = 'H'  # pole cross with half block
            elif cell == 37:
                grid[y][x] = '#'  # end between room pipe
            elif cell == 38:
                grid[y][x] = '#'  # I don't know
            elif cell == 39:
                grid[y][x] = '-'  # vertical pole
            elif cell == 40:
                grid[y][x] = '.'  # background pipe
            elif cell == 41:
                grid[y][x] = '|'  # pipe and virtical pole crossing
            elif cell == 42:
                grid[y][x] = '#'  # end underwater creature pipe
            elif cell == 43:
                grid[y][x] = '='  # pipe entry and vertical pole crossing
            elif cell == 44:
                grid[y][x] = 'H'  # half block
            elif cell == 45:
                grid[y][x] = 'H'  # half block and vertical pole crossing
            elif cell == 47:
                grid[y][x] = '|'  # also vertical pole
            elif cell == 48:
                grid[y][x] = '+'  # also pipe crossing
            elif cell == 49:
                grid[y][x] = '+'  # also pipe crossing
            elif cell == 53:
                grid[y][x] = 'H'  # half block and background pipe crossing
            elif cell == 54:
                grid[y][x] = '/'  # slope and vertical pole crossing
            elif cell == 57:
                grid[y][x] = '.'  # background plant
            elif cell == 58:
                grid[y][x] = '/'  # slope and horizontal pole crossing
            elif cell == 60:
                grid[y][x] = 'H'  # half block
            elif cell == 63:
                grid[y][x] = '|'  # vertical pole and background grass crossing
            elif cell == 65:
                grid[y][x] = '.'  # grass worm
            elif cell == 66:
                grid[y][x] = '|'  # vertical pole and grass worm crossing
            elif cell == 76:
                grid[y][x] = '.'  # end between room pipe
            elif cell == 77:
                grid[y][x] = '-'  # horizontal pole
            elif cell == 81:
                grid[y][x] = '.'  # background thing
            elif cell == 87:
                grid[y][x] = 'H'  # half block
            elif cell == 90:
                grid[y][x] = '.'  # grass worm
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
                grid[y][x] = 'H'  # half block and vertical pole crossing
            elif cell == 103:
                grid[y][x] = '#'  # creature pipe
            elif cell == 104:
                grid[y][x] = '#'  # background plant
            elif cell == 105:
                grid[y][x] = '#'  # grass worm
            elif cell == 106:
                grid[y][x] = 'H'  # half block
            elif cell == 107:
                grid[y][x] = '/'  # slope and horizontal pole crossing 
            elif cell == 108:
                grid[y][x] = '/'  # slope
            elif cell == 109:
                grid[y][x] = '-'  # horizontal pole and in room pipe
            elif cell == 110:
                grid[y][x] = '#'  # wall
            elif cell == 111:
                grid[y][x] = '='  # pipe
            elif cell == 112:
                grid[y][x] = '#'  # wall
            elif cell == 113:
                grid[y][x] = '|'  # vertical pole and grass worm crossing
            elif cell == 114:
                grid[y][x] = '#'  # wall
            elif cell == 115:
                grid[y][x] = '#'  # wall
            elif cell == 116:
                grid[y][x] = '+'  # pole crossing
            elif cell == 117:
                grid[y][x] = '/'  # slope and vertical pole crossing
            elif cell == 118:
                grid[y][x] = '#'  # wall
            elif cell == 119:
                grid[y][x] = '|'  # vertical pole
            elif cell == 120:
                grid[y][x] = '|'  # vertical pole
            elif cell == 121:
                grid[y][x] = '-'  # horizontal pole
            elif cell == 122:
                grid[y][x] = '#'  # wall
            elif cell == 123:
                grid[y][x] = '#'  # wall
            elif cell == 124:
                grid[y][x] = '.'  # air or something in the background
            elif cell == 125:
                grid[y][x] = '.'  # grass worm
            elif cell == 126:
                grid[y][x] = '.'  # vertical pole
            else:
                grid[y][x] = '?'  # Inconnu
                print(f"Valeur inconnue : {cell}")

    # Génération du rendu ASCII
    ascii_art = '\n'.join(''.join(row) for row in grid)
    return ascii_art, list_error

output_file = os.path.join(path, "output.txt")
open(output_file, 'w').close()
error_file = os.path.join(path, "error.txt")
open(error_file, 'w').close()

list_error = []

def run(file_path):
    # Lecture et rendu de la pièce
    room_name, width, height, geometry_data = parse_room(file_path)
    if room_name:
        ascii_art, list_error = render_ascii_art(width, height, geometry_data)

        # Affichage
        print(f"Pièce : {room_name}")
        print(f"taille : {width}x{height}")
        print(list_error)
        print(ascii_art)
        with open(output_file, 'a') as f:
            f.write(f"Pièce : {room_name}\n")
            f.write(f"taille : {width}x{height}\n")
            for i in range(len(list_error)): #list_error:
                f.write(list_error[i] + "\n")
            f.write(ascii_art + "\n")
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
            