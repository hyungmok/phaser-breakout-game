/**
 * @author Maya, Game Developer
 * @description A complete rewrite of a Breakout/Arkanoid style game in Phaser 3.
 * This version focuses on stability, clean code, and core gameplay mechanics.
 * All assets are generated dynamically.
 */

// --- Game Configuration ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    backgroundColor: '#000020',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            checkCollision: {
                up: true,
                down: true,
                left: true,
                right: true
            }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// --- Game Variables ---
let game = new Phaser.Game(config);
let paddle;
let ball;
let bricks;
let scoreText;
let livesText;
let startText;

let score = 0;
let lives = 3;
let gameStarted = false;
let ballIsOnPaddle = true;

// --- Scene Functions ---

function preload() {
    // No assets to load, everything is generated dynamically.
}

function create() {
    // Enable world bounds, but disable the bottom one for losing.
    this.physics.world.setBoundsCollision(true, true, true, false);

    createBricks.call(this);
    createPaddle.call(this);
    createBall.call(this);
    createUI.call(this);

    // Setup collision handlers
    this.physics.add.collider(ball, bricks, hitBrick, null, this);
    this.physics.add.collider(ball, paddle, hitPaddle, null, this);

    // Input handler to start the game
    this.input.on('pointerdown', releaseBall, this);
}

function update() {
    if (!gameStarted) {
        return; // Do nothing if the game hasn't started
    }

    // Move paddle with mouse/touch
    paddle.x = Phaser.Math.Clamp(this.input.x, 50, 750);

    if (ballIsOnPaddle) {
        // Keep the ball stuck to the paddle
        ball.body.x = paddle.x - 12;
    }

    // Check for ball falling out of bounds
    if (ball.y > 600) {
        loseLife.call(this); // FIX: Pass the scene context
    }
}

// --- Game Logic Functions ---

/**
 * Creates the grid of bricks.
 * Uses dynamic textures for colors.
 */
function createBricks() {
    // Create a graphics object to draw the brick texture
    const brickGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    brickGraphics.fillStyle(0xffffff);
    brickGraphics.fillRect(0, 0, 64, 32);
    brickGraphics.generateTexture('brick_white', 64, 32);
    brickGraphics.destroy();

    bricks = this.physics.add.group({
        immovable: true
    });

    const brickColors = [0xcc2222, 0x22cc22, 0x2222cc, 0xcccc22, 0xcc22cc, 0x22cccc];
    for (let i = 0; i < 6; i++) { // Rows
        for (let j = 0; j < 10; j++) { // Columns
            const brick = bricks.create(80 + j * 68, 100 + i * 36, 'brick_white');
            brick.setTint(brickColors[i]);
            brick.body.setBounce(1, 1);
        }
    }
}

/**
 * Creates the player's paddle.
 */
function createPaddle() {
    // Create a dynamic texture for the paddle
    const paddleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    paddleGraphics.fillStyle(0xeeeeee);
    paddleGraphics.fillRect(0, 0, 100, 20);
    paddleGraphics.generateTexture('paddle', 100, 20);
    paddleGraphics.destroy();

    paddle = this.physics.add.image(400, 550, 'paddle').setImmovable();
}

/**
 * Creates the ball.
 */
function createBall() {
    // Create a dynamic texture for the ball
    const ballGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    ballGraphics.fillStyle(0xffffff);
    ballGraphics.fillCircle(12, 12, 12);
    ballGraphics.generateTexture('ball', 24, 24);
    ballGraphics.destroy();

    ball = this.physics.add.image(400, 526, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    ball.body.onWorldBounds = true; // Enable world bounds collision event
}

/**
 * Creates the UI elements (score, lives, start message).
 */
function createUI() {
    const style = { fontSize: '24px', fill: '#fff', fontFamily: 'Arial' };
    scoreText = this.add.text(16, 16, 'Score: 0', style);
    livesText = this.add.text(680, 16, 'Lives: 3', style);

    startText = this.add.text(400, 300, 'Click to Start', {
        fontSize: '48px',
        fill: '#fff',
        fontFamily: 'Arial'
    }).setOrigin(0.5);
}

/**
 * Releases the ball from the paddle when the player clicks.
 */
function releaseBall() {
    if (ballIsOnPaddle) {
        gameStarted = true;
        ballIsOnPaddle = false;
        ball.setVelocity(-75, -300);
        startText.setVisible(false);
    }
}

/**
 * Handles the collision between the ball and a brick.
 * @param {Phaser.GameObjects.Image} ball - The ball object.
 * @param {Phaser.GameObjects.Image} brick - The brick object that was hit.
 */
function hitBrick(ball, brick) {
    brick.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    // Check for win condition
    if (bricks.countActive(true) === 0) {
        winGame.call(this); // FIX: Pass the scene context
    }
}

/**
 * Handles the collision between the ball and the paddle.
 * This implements Arkanoid-style variable bounce angles.
 * @param {Phaser.GameObjects.Image} ball - The ball object.
 * @param {Phaser.GameObjects.Image} paddle - The paddle object.
 */
function hitPaddle(ball, paddle) {
    let diff = 0;

    // Ball is on the left-hand side of the paddle
    if (ball.x < paddle.x) {
        diff = paddle.x - ball.x;
        ball.setVelocityX(-10 * diff);
    } 
    // Ball is on the right-hand side of the paddle
    else if (ball.x > paddle.x) {
        diff = ball.x - paddle.x;
        ball.setVelocityX(10 * diff);
    } 
    // Ball is perfectly in the middle
    else {
        ball.setVelocityX(2 + Math.random() * 8);
    }
}

/**
 * Handles the player losing a life.
 */
function loseLife() {
    lives--;
    livesText.setText('Lives: ' + lives);

    if (lives === 0) {
        gameOver.call(this); // FIX: Pass the scene context
    } else {
        resetBall.call(this); // Also ensure context for consistency
    }
}

/**
 * Resets the ball to the paddle after losing a life.
 */
function resetBall() {
    ballIsOnPaddle = true;
    ball.setVelocity(0, 0);
    ball.setPosition(paddle.x, 526);
}

/**
 * Handles the game over state.
 */
function gameOver() {
    ball.disableBody(true, true);
    startText.setText('Game Over! Click to Restart');
    startText.setVisible(true);
    
    // Add a one-time event listener to restart the game on the next click
    this.input.once('pointerdown', () => {
        restartGame.call(this); // Pass the scene context for robustness
    }, this);
}

/**
 * Handles the win state.
 */
function winGame() {
    ball.disableBody(true, true);
    startText.setText('You Win! Click to Restart');
    startText.setVisible(true);

    // Add a one-time event listener to restart the game on the next click
    this.input.once('pointerdown', () => {
        restartGame.call(this); // Pass the scene context for robustness
    }, this);
}

/**
 * Restarts the entire game from the beginning.
 */
function restartGame() {
    // Reset stats
    score = 0;
    lives = 3;
    gameStarted = false;
    ballIsOnPaddle = true;

    // Reset UI
    scoreText.setText('Score: ' + score);
    livesText.setText('Lives: ' + lives);
    
    // Make sure the restart text is the initial 'Click to Start'
    startText.setText('Click to Start');
    startText.setVisible(true);
    
    // Reset ball position and state
    ball.enableBody(true, paddle.x, 526, true, true);
    ball.setVelocity(0, 0);

    // Reset all bricks
    bricks.children.each(function (brick) {
        brick.enableBody(true, brick.x, brick.y, true, true);
    });
}