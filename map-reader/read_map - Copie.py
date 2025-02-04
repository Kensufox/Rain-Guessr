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

    # Mapping of specific geometry strings to cell values
    geometry_map = {
    "1,4,3": 1,
    "0,3,6": 0,
    "0,3,1,6": 3,
    "0,1,6": 3,
    "4,3,6": 4,
    "0,2,6": 5,
    "0,1,2": 6,
    "0,1,2,6": 6,
    "3,1,6": 7,
    "1,9,3": 1,
    "0,2,1": 6,
    "0,7,6": 0,
    "0,1,7,6": 3,
    "1,5,3": 1,
    "0,4,3,6": 0,
    "2,3,6": 2,
    "0,3,2,6": 5,
    "0,1,3,6": 3,
    "0,3,7,6": 0,
    "0,2,1,6": 6,
    "0,2,3,6": 5,
    "0,1,7": 3,
    "0,2,1,3,6": 6,
    "1,12,3": 1,
    "0,1,2,3,6": 6,
    "4,6,3": 1,
    "0,6,7": 0,
    "1,3,9": 1,
    "0,6,1": 3,
    "3,6,1": 7,
    "1,3,4": 1,
    "1,3,12": 1,
    "0,6,2": 5,
    "0,6,3": 0,
    "0,6,1,3": 3,
    "1,3,5": 1,
    "4,3,1,2,6": 4,
    "3,2,6": 7,
    "3,1,2,6": 7,
    "0,1,3": 3,
    "0,1,3,2,6": 6,
    "0,3,1,2,6": 6,
    "3,3,6": 7,
    "2,1,6": 2,
    "0,8,6": 0,
    "2,2,6": 2,
    "3,2,1,6": 7,
    "0,7,1,6": 3,
    "0,11,6": 0,
    "0,1,11,6": 3,
    "0,4,3": 0,
    "0,2,3": 5,
    "0,9,3": 0,
    "3,1,3,6": 7,
    "0,3,11,6": 0,
    "4,3,1,6": 1,
    "1,3": 1,
    "0,6": 0,
    "0,1": 3,
    "3,6": 1,
    "0,2": 5,
    "2,6": 2,
    "1,10": 1,
    "0,7": 0,
    "0,3": 0,
    "2,1": 2,
    "3,1": 7,
    "4,3": 1,
    "0,8": 1,
    "0,11": 1,
    "3,2": 7,
    "2,2": 2,
    "2,3": 2,
    "4,3,2,6": 5,
    "4,3,1,3,6": 1,
    "4,3,3,6": 4,
    "0,11,1": 1,
    "0,1,11": 3,
    "4,3,1": 1,
    "4,6,1,3": 1,
    "0,6,1,2": 6,
    "2,6,1": 2,
    "0,7,1": 1,
    "0,8,1,6": 3,
    "0,1,8,6": 3,
    "0,2,8,6": 5,
    "4,3,2": 1,
    "4,3,2,1,6": 1,
    "0,7,3,6": 0,
    "0,6,11": 0,
    "0,3,2": 0,
    "13": 7,
    "11": 6
        }

    # Looping through the geometry_data
    for y in range(height):
        for x in range(width):
            key = geometry_data[y + (x * height)]
        
            # If it's a single value, convert it to a float
            if len(key) == 1:
                cell = float(key.replace(",", "."))
            else:
                # Look up the cell value in the dictionary, default to -1 if not found
                cell = geometry_map.get(key, -1)
        
            # If the cell value is -1, log the error
            if cell == -1:
                list_error.append(key)
                print(key)


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

def check_AOB(width, height, ascii, x, y):
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
    except:
        print("error while trying to check AOB")

    return top, top_left, top_right, bottom, bottom_left, bottom_right, left, right, borderx, bordery


def ascii_to_vector_wall(width, height, ascii_art):
    points_list_w = []
    ascii = string_to_dict(ascii_art)
    for y in range(height):
        for x in range(width):

            try:
                top, top_left, top_right, bottom, bottom_left, bottom_right, left, right, borderx, bordery = check_AOB(width, height, ascii, x, y)

                if ascii[y][x] == '#': # wall
                    # Check if the wall corner are points inter angle
                    if {right, bottom} == {'#'} and bottom_right in {'.', '='}:
                        points_list_w.append([x+1, y+1])# bottom right corner of the wall is a point
                    if {right, top} == {'#'} and top_right in {'.', '='}:
                        points_list_w.append([x+1, y])# top right corner of the wall is a point
                    if {left, bottom} == {'#'} and bottom_left in {'.', '='}:
                        points_list_w.append([x, y+1])# bottom left corner of the wall is a point
                    if {left, top} == {'#'} and top_left in {'.', '='}:
                        points_list_w.append([x, y])# top left corner of the wall is a point
                    # Check if the wall corner are points outer angle
                    if {right, bottom, bottom_right} <= {'.', '='}:
                        points_list_w.append([x+1, y+1])# bottom right corner of the wall is a point
                    if {right, top, top_right} <= {'.', '='}:
                        points_list_w.append([x+1, y])# top right corner of the wall is a point
                    if {left, bottom, bottom_left} <= {'.', '='}:
                        points_list_w.append([x, y+1])# bottom left corner of the wall is a point
                    if {left, top, top_left} <= {'.', '='}:
                        points_list_w.append([x, y])# top left corner of the wall is a point
                    # Check for corner in map border
                    if borderx == "left" and bordery == None:
                        if top == ".":
                            points_list_w.append([x, y])
                        if bottom == ".": 
                            points_list_w.append([x, y+1])
                    elif borderx == "right" and bordery == None:
                        if top == ".": 
                            points_list_w.append([x+1, y])
                        if bottom == ".": 
                            points_list_w.append([x+1, y+1])

                    if bordery == "top" and borderx == None:
                        if left == ".":
                            points_list_w.append([x, y])
                        if right == ".": 
                            points_list_w.append([x+1, y])
                    elif bordery == "bottom" and borderx == None:
                        if left == ".": 
                            points_list_w.append([x, y+1])
                        if right == ".": 
                            points_list_w.append([x+1, y+1])
                    
                    if borderx == "left" and bordery == "top":
                        if right == ".":
                            points_list_w.append([x+1, y])
                        if bottom == ".": 
                            points_list_w.append([x, y+1])
                    elif borderx == "right" and bordery == "top":
                        if left == ".": 
                            points_list_w.append([x, y])
                        if bottom == ".": 
                            points_list_w.append([x+1, y+1])
                    elif borderx == "left" and bordery == "bottom":
                        if right == ".": 
                            points_list_w.append([x+1, y+1])
                        if top == ".": 
                            points_list_w.append([x, y])
                    elif borderx == "right" and bordery == "bottom":
                        if left == ".": 
                            points_list_w.append([x, y+1])
                        if top == ".": 
                            points_list_w.append([x+1, y])
            except:
                print("error in ascii to vector for the wall, cell = ", x, y, "and it contain : ", ascii[y][x], " width = ", width, " height = ", height)
    try:
        points_list_w = list(set(map(tuple, points_list_w)))
    except:
        print("error in points_list_w")
    try:
        points_list_w.sort()
    except:
        print("error sorting points_list_w")
    return points_list_w

def ascii_to_vector_slope(width, height, ascii_art):
    points_list_sl = []
    points_list_sr = []
    ascii = string_to_dict(ascii_art)
    for y in range(height):
        for x in range(width):
                
            try:
                top, top_left, top_right, bottom, bottom_left, bottom_right, left, right, borderx, bordery = check_AOB(width, height, ascii, x, y)

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
                            points_list_sl.append([x+1, y+1])
                        if top_left != "/":
                            points_list_sl.append([x, y])
                    elif slope_orientation == "right":
                        if top_right != "/":
                            points_list_sr.append([x+1, y])
                        if bottom_left != "/":
                            points_list_sr.append([x, y+1])
            except:
                print("error in ascii to vector for the slope, cell = ", x, y, "and it contain : ", ascii[y][x], " width = ", width, " height = ", height)
    try:
        points_list_sl = list(set(map(tuple, points_list_sl)))
    except:
        print("error in points_list_sl")
    try:
        points_list_sl.sort()
    except:
        print("error sorting points_list_sl")
    try:
        points_list_sr = list(set(map(tuple, points_list_sr)))
    except:
        print("error in points_list_sr")
    try:
        points_list_sr.sort()
    except:
        print("error sorting points_list_sr")
    return points_list_sl, points_list_sr


def invert_list_in_list(points_list_w):
    return [(y, x) for x, y in points_list_w]

def points_to_vector(points_list_w):
    v_vector_list = []
    for i in range(0,len(points_list_w)-1,2):
        v_vector_list.append([points_list_w[i], points_list_w[i+1]])
    points_list_w = invert_list_in_list(points_list_w)
    points_list_w.sort()
    h_vector_list = []
    for i in range(0,len(points_list_w)-1,2):
        h_vector_list.append([(points_list_w[i][1], points_list_w[i][0]), (points_list_w[i+1][1], points_list_w[i+1][0])])
    return v_vector_list, h_vector_list


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
        points_list_w = ascii_to_vector_wall(width, height, ascii_art)
    except:
        print("ascii to vector error")

    try:
        v_vector_list, h_vector_list = points_to_vector(points_list_w)
    except:
        print("points to vector error")

    try:
        relative_path = os.path.relpath(root, file_path)
        writing_file = os.path.join(file2_path, relative_path, file)
        with open(writing_file, 'w') as f:
            f.write(f"Pièce : {room_name}\n")
            f.write(f"taille : {width}x{height}\n")
            f.write(ascii_art + "\n")
            try:
                for i in range(len(v_vector_list)):
                    f.write("(" + str(v_vector_list[i][0][0]) + "," + str(v_vector_list[i][0][1]) + "),(" + str(v_vector_list[i][1][0]) + "," + str(v_vector_list[i][1][1]) + ")|")
                f.write("\n")
            except:
                print("error will writing v vector list")
            try:
                for i in range(len(h_vector_list)):
                    f.write("(" + str(h_vector_list[i][0][0]) + "," + str(h_vector_list[i][0][1]) + "),(" + str(h_vector_list[i][1][0]) + "," + str(h_vector_list[i][1][1]) + ")|")
            except:
                print("error will writing h vector list")

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
            
