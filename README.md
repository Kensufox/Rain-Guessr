Geo Guesser for Rain World

This is a project to make a Geo Guesser style game for Rain World

It will work by taking a random part of a random screenshot of a room, and you will then need to find which room it comes from. (the closer, the more points, more about this below)

The map will be shown in one layer (not like in Rain World), but it will probably be an option to switch to the classic 3 layer map

## Online version

https://kensufox.github.io/Rain-Guessr/

## Game instructions

Going on the site, you will have a menu very similar to the main menu of rain world, It has multiple buttons: Play, Account, Settings, Credits, Help
- The play button leads you to the selection page. It allows you to choose the game mode (more about it below), and the difficulty
- The account button will allow you to login/disconnect/create an account and see data linked to it
- The settings page allows you to make some changes, like choosing the type of map (like said before, 1 or 3 layer)
- The credits are credits (yes I know very complicated)
- The help button will lead you to a page to send a message to an admin (by email)

The game modes:
- classic (like described above)
- art-amateur (similar to classic, but only with screenshots containing wall graffiti)

Game loop:
For classic, when you launch a game, you will be given a random part of a random screenshot, a timer will start, you can place a point by right clicking, moving around with left click and zoom with mouse-wheel. When a point is placed, you can press enter to validate your selection. Then your points will be calculated by how far you were to the real location (point calculation takes into account time taken, correct region, correct room, and distance in room from real location).
When a game is finished, a small menu will pop up, with two buttons: Play Again and Main Menu.

## Offline/Self-Hosted version
To launch the local server with Python, run this command at the root of the project:
```
python -m http.server 8000
```
then go to `http://localhost:8000/` on your browser.
