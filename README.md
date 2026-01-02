# Phaser Breakout Game

A simple Breakout game built with the Phaser 3 game engine.

## How to Play

- Move the mouse left and right to control the paddle.
- Don't let the ball fall off the bottom of the screen.
- Break all the bricks to win!

## How to Run Locally

1.  Clone this repository to your local machine.
    ```sh
    git clone https://github.com/hyungmok/phaser-breakout-game.git
    ```
2.  Navigate to the project directory.
3.  Since this game is built with simple HTML and JavaScript and loads Phaser from a CDN, you don't need a complex setup. However, to avoid potential CORS issues with loading assets, it's best to serve the files from a local web server.

    If you have Python installed, you can easily start one:

    *Python 3:*
    ```sh
    python -m http.server
    ```

    *Python 2:*
    ```sh
    python -m SimpleHTTPServer
    ```

4.  Open your web browser and go to `http://localhost:8000` (or the address shown by your server).

Enjoy the game!