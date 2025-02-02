import os

path = os.path.dirname(os.path.abspath(__file__))

file = "World\Regions\Rooms"
file_path = os.path.join(path, file)
file2 = "World-vector\Regions\Rooms"
file2_path = os.path.join(path, file2)

strange_values = []

def parse_room(spe_file_path):
    with open(spe_file_path, 'r') as file:
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
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,3,6":
                    cell = 0
                elif geometry_data[y+(x*height)] == "0,3,1,6":
                    cell = 3
                elif geometry_data[y+(x*height)] == "0,1,6":
                    cell = 3
                elif geometry_data[y+(x*height)] == "4,3,6":
                    cell = 4
                elif geometry_data[y+(x*height)] == "0,2,6":
                    cell = 5
                elif geometry_data[y+(x*height)] == "0,1,2":
                    cell = 6
                elif geometry_data[y+(x*height)] == "0,1,2,6":
                    cell = 6
                elif geometry_data[y+(x*height)] == "3,1,6":
                    cell = 7
                elif geometry_data[y+(x*height)] == "1,9,3":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,2,1":
                    cell = 6
                elif geometry_data[y+(x*height)] == "0,7,6":
                    cell = 0
                elif geometry_data[y+(x*height)] == "0,1,7,6":
                    cell = 3
                elif geometry_data[y+(x*height)] == "1,5,3":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,4,3,6":
                    cell = 0
                elif geometry_data[y+(x*height)] == "2,3,6":
                    cell = 2
                elif geometry_data[y+(x*height)] == "0,3,2,6":
                    cell = 5
                elif geometry_data[y+(x*height)] == "0,1,3,6":
                    cell = 3
                elif geometry_data[y+(x*height)] == "0,3,7,6":
                    cell = 0
                elif geometry_data[y+(x*height)] == "0,2,1,6":
                    cell = 6
                elif geometry_data[y+(x*height)] == "0,2,3,6":
                    cell = 5
                elif geometry_data[y+(x*height)] == "0,1,7":
                    cell = 3
                elif geometry_data[y+(x*height)] == "0,2,1,3,6":
                    cell = 6
                elif geometry_data[y+(x*height)] == "1,12,3":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,1,2,3,6":
                    cell = 6
                elif geometry_data[y+(x*height)] == "4,6,3":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,6,7":
                    cell = 0
                elif geometry_data[y+(x*height)] == "1,3,9":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,6,1":
                    cell = 3
                elif geometry_data[y+(x*height)] == "3,6,1":
                    cell = 7
                elif geometry_data[y+(x*height)] == "1,3,4":
                    cell = 1
                elif geometry_data[y+(x*height)] == "1,3,12":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,6,2":
                    cell = 5
                elif geometry_data[y+(x*height)] == "0,6,3":
                    cell = 0
                elif geometry_data[y+(x*height)] == "0,6,1,3":
                    cell = 3
                elif geometry_data[y+(x*height)] == "1,3,5":
                    cell = 1
                elif geometry_data[y+(x*height)] == "4,3,1,2,6":
                    cell = 4
                elif geometry_data[y+(x*height)] == "3,2,6":
                    cell = 7
                elif geometry_data[y+(x*height)] == "3,1,2,6":
                    cell = 7
                elif geometry_data[y+(x*height)] == "0,1,3":
                    cell = 3
                elif geometry_data[y+(x*height)] == "0,1,3,2,6":
                    cell = 6
                elif geometry_data[y+(x*height)] == "0,3,1,2,6":
                    cell = 6
                elif geometry_data[y+(x*height)] == "3,3,6":
                    cell = 7
                elif geometry_data[y+(x*height)] == "2,1,6":
                    cell = 2
                elif geometry_data[y+(x*height)] == "0,8,6":
                    cell = 0
                elif geometry_data[y+(x*height)] == "2,2,6":
                    cell = 2
                elif geometry_data[y+(x*height)] == "3,2,1,6":
                    cell = 7
                elif geometry_data[y+(x*height)] == "0,7,1,6":
                    cell = 3
                elif geometry_data[y+(x*height)] == "0,11,6":
                    cell = 0
                elif geometry_data[y+(x*height)] == "0,1,11,6":
                    cell = 3
                elif geometry_data[y+(x*height)] == "0,4,3":
                    cell = 0
                elif geometry_data[y+(x*height)] == "0,2,3":
                    cell = 5
                elif geometry_data[y+(x*height)] == "0,9,3":
                    cell = 0
                elif geometry_data[y+(x*height)] == "3,1,3,6":
                    cell = 7
                elif geometry_data[y+(x*height)] == "0,3,11,6":
                    cell = 0
                elif geometry_data[y+(x*height)] == "4,3,1,6":
                    cell = 1
                elif geometry_data[y+(x*height)] == "1,3":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,6":
                    cell = 0
                elif geometry_data[y+(x*height)] == "0,1":
                    cell = 3
                elif geometry_data[y+(x*height)] == "3,6":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,2":
                    cell = 5
                elif geometry_data[y+(x*height)] == "2,6":
                    cell = 2
                elif geometry_data[y+(x*height)] == "1,10":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,7":
                    cell = 0
                elif geometry_data[y+(x*height)] == "0,3":
                    cell = 0
                elif geometry_data[y+(x*height)] == "2,1":
                    cell = 2
                elif geometry_data[y+(x*height)] == "3,1":
                    cell = 7
                elif geometry_data[y+(x*height)] == "4,3":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,8":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,11":
                    cell = 1
                elif geometry_data[y+(x*height)] == "3,2":
                    cell = 7
                elif geometry_data[y+(x*height)] == "2,2":
                    cell = 2
                elif geometry_data[y+(x*height)] == "2,3":
                    cell = 2
                elif geometry_data[y+(x*height)] == "4,3,2,6":
                    cell = 5
                elif geometry_data[y+(x*height)] == "4,3,1,3,6":
                    cell = 1
                elif geometry_data[y+(x*height)] == "4,3,3,6":
                    cell = 4
                elif geometry_data[y+(x*height)] == "0,11,1":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,1,11":
                    cell = 3
                elif geometry_data[y+(x*height)] == "4,3,1":
                    cell = 1
                elif geometry_data[y+(x*height)] == "4,6,1,3":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,6,1,2":
                    cell = 6
                elif geometry_data[y+(x*height)] == "2,6,1":
                    cell = 2
                elif geometry_data[y+(x*height)] == "0,7,1":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,8,1,6":
                    cell = 3
                elif geometry_data[y+(x*height)] == "0,1,8,6":
                    cell = 3
                elif geometry_data[y+(x*height)] == "0,2,8,6":
                    cell = 5
                elif geometry_data[y+(x*height)] == "4,3,2":
                    cell = 1
                elif geometry_data[y+(x*height)] == "4,3,2,1,6":
                    cell = 1
                elif geometry_data[y+(x*height)] == "0,7,3,6":
                    cell = 0
                elif geometry_data[y+(x*height)] == "0,6,11":
                    cell = 0
                elif geometry_data[y+(x*height)] == "0,3,2":
                    cell = 0
                elif geometry_data[y+(x*height)] == "13":
                    cell = 7
                elif geometry_data[y+(x*height)] == "11":
                    cell = 6
            if cell == -1:  
                list_error.append(geometry_data[y+(x*height)])
                print(geometry_data[y+(x*height)])

            if cell == 0:
                grid[y][x] = '.'  # air
            elif cell == 1:
                grid[y][x] = '#'  # wall
            elif cell == 2:
                grid[y][x] = '/' # slope
            elif cell == 3:
                grid[y][x] = '|'  # vertical pole
            elif cell == 4:
                grid[y][x] = '='  # pipe entry
            elif cell == 5:
                grid[y][x] = '-'  # horizontal pole
            elif cell == 6:
                grid[y][x] = '+'  # vertical pipe and horizontal pipe crossing
            elif cell == 7:
                grid[y][x] = 'H'  # half block
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

def string_to_dict(string):
    string_lines = string.strip().split("\n")
    string_dict = [[] for _ in range(len(string_lines))]
    for l in range(len(string_lines)):
        string_dict[l] = list(string_lines[l])
    return string_dict

def ascii_to_vector(width, height, ascii_art):
    points_list = []
    ascii = string_to_dict(ascii_art)
    for y in range(height):
        for x in range(width):
            borderx = None
            bordery = None
            if x == 0:
                borderx = "left"
            elif x == width-1:
                borderx = "right"    
            if y == 0:
                bordery = "top"
            elif y == height-1:
                bordery = "bottom"

            try:
                top = None 
                top_left = None 
                top_right = None 
                bottom = None 
                bottom_left = None 
                bottom_right = None 
                if bordery != "top":  
                    top = ascii[y-1][x]
                if bordery != "bottom":
                    bottom = ascii[y+1][x]
                right = None 
                left = None 
                if borderx != "right":
                    right = ascii[y][x+1]
                if borderx != "left":
                    left = ascii[y][x-1]
                    
                if left:
                    if top:
                        top_left = ascii[y-1][x-1]
                    if bottom:
                        bottom_left = ascii[y+1][x-1]
                if right:  
                    if top:
                        top_right = ascii[y-1][x+1]
                    if bottom:
                        bottom_right = ascii[y+1][x+1]

                #print(top, top_left, top_right, bottom, bottom_left, bottom_right, right, left)

                if ascii[y][x] == '#': # wall
                    # Check if the wall corner are points
                    if right == '#' and bottom == '#' and bottom_right == '.': 
                        points_list.append([x+1, y+1])# bottom right corner of the wall is a point
                    if right == '#' and top == '#' and top_right == '.': 
                        points_list.append([x+1, y])# top right corner of the wall is a point
                    if left == '#' and bottom == '#' and bottom_left == '.': 
                        points_list.append([x, y+1])# bottom left corner of the wall is a point
                    if left == '#' and top == '#' and top_left == '.': 
                        points_list.append([x, y])# top left corner of the wall is a point

                    if right == '.' and bottom == '.' and bottom_right == '.': 
                        points_list.append([x+1, y+1])# bottom right corner of the wall is a point
                    if right == '.' and top == '.' and top_right == '.': 
                        points_list.append([x+1, y])# top right corner of the wall is a point
                    if left == '.' and bottom == '.' and bottom_left == '.': 
                        points_list.append([x, y+1])# bottom left corner of the wall is a point
                    if left == '.' and top == '.' and top_left == '.': 
                        points_list.append([x, y])# top left corner of the wall is a point
                if ascii[y][x] == '/': # slope
                    # Chek if slope is in wall
                    if bottom == '#' and right == '#' and top == '#' and left == '#':
                        print("slope in wall")
                        pass
                    slope_orientation = None
                    # Check the slope orientation and if near other slope
                    if right == "#" and bottom == "#":
                        slope_orientation = "right"# slope is oriented to the right = /
                    elif left == "#" and bottom == "#":
                        slope_orientation = "left"# slope is oriented to the left = \
                    elif right == "#" and top == "#":
                        slope_orientation = "left"# slope is oriented to the left = \
                    elif left == "#" and top == "#":
                        slope_orientation = "right"# slope is oriented to the right = /
                    if slope_orientation == "left":
                        if bottom_right != "/":
                            points_list.append([x+1, y+1])
                        if top_left != "/":
                            points_list.append([x, y])
                    elif slope_orientation == "right":
                        if top_right != "/":
                            points_list.append([x+1, y])
                        if bottom_left != "/":
                            points_list.append([x, y+1])
            except:
                print("error in ascii to vector, cell = ", x, y, "and it contain : ", ascii[y][x], " width = ", width, " height = ", height)
    # try make it work if needed (multiple points have the same coordinates)
    #try:
    #    for i in range(len(points_list)):
    #        for j in range(len(points_list)):
    #            if points_list[i][0] == points_list[j][0] and points_list[i][1] == points_list[j][1]:
    #                points_list.pop(j)
    #except:
    #    print("error in points_list")
    print(points_list)
    return points_list

def run(root, file):
    spe_file_path = os.path.join(root, file)
    # Lecture et rendu de la pièce
    room_name, width, height, geometry_data = parse_room(spe_file_path)
    if room_name:
        ascii_art, list_error = render_ascii_art(width, height, geometry_data)

        # Affichage
        print(f"Pièce : {room_name}")
        print(f"taille : {width}x{height}")
        #print(list_error)
        #print(ascii_art)
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
    try:
        points_list = ascii_to_vector(width, height, ascii_art)
    except:
        print("ascii to vector error")

    try:
        relative_path = os.path.relpath(root, file_path)
        writing_file = os.path.join(file2_path, relative_path, file)
        open(writing_file, 'w').close()
        with open(writing_file, 'a') as f:
            f.write(f"Pièce : {room_name}\n")
            f.write(f"taille : {width}x{height}\n")
            f.write(ascii_art + "\n")
            try:
                for i in range(len(points_list)):
                    f.write(str(points_list[i][0]))
                    f.write(",")
                    f.write(str(points_list[i][1]))
                    f.write("|")
            except:
                print("error will writing points list")

    except:
        print("error will writing outputs files")

for root, dirs, files in os.walk(file_path):
    for file in files:
        if file.endswith(".txt") and file != "regions.txt":
            with open(os.path.join(root, file), 'r') as fp:
                for count, line in enumerate(fp):
                    pass
            if count == 4:
                try:
                    run(root, file)
                except:
                    print("something went wrong")
                    with open(error_file, 'a') as f:
                        f.write(os.path.join(root, file))
                        f.write("\n")
            