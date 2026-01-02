let game;

// Configuration object for the Phaser game
let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            // Removed problematic checkCollision block which was likely causing the freeze
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    backgroundColor: '#2c3e50' // Changed background for better contrast
};

// Game variables
let ball;
let paddle;
let bricks;
let score = 0;
let lives = 3;
let scoreText;
let livesText;
let startText;
let gameOver = false;
let gameStarted = false;

// Preload assets for the game
function preload() {
    this.load.image('ball', 'assets/ball.png');
    this.load.image('paddle', 'assets/paddle.png');
    this.load.image('brick', 'assets/brick.png');
}

// Create game objects and set up the scene
function create() {
    // --- FIX: Add a visual boundary for the game area ---
    const graphics = this.add.graphics();
    graphics.lineStyle(4, 0xecf0f1, 1); // 4px light gray border
    graphics.strokeRect(2, 2, 796, 596); // Draw rectangle just inside the canvas

    // Create the ball
    ball = this.physics.add.sprite(400, 500, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);
    ball.disableBody(true, true); // Initially hidden and inactive

    // Create the paddle
    paddle = this.physics.add.sprite(400, 550, 'paddle');
    paddle.setImmovable(true);
    paddle.setCollideWorldBounds(true);

    // Create a group of bricks
    bricks = this.physics.add.staticGroup({
        key: 'brick',
        repeat: 9,
        setXY: { x: 80, y: 80, stepX: 70 }
    });

    // UI Text elements
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#ecf0f1' });
    livesText = this.add.text(680, 16, 'Lives: 3', { fontSize: '24px', fill: '#ecf0f1' });
    startText = this.add.text(400, 300, 'Click to Start', { fontSize: '32px', fill: '#ecf0f1' });
    startText.setOrigin(0.5);

    // Set up colliders
    this.physics.add.collider(ball, paddle, () => {
        // Optional: Add logic for hitting the paddle, e.g., changing ball angle
    });
    this.physics.add.collider(ball, bricks, ballHitBrick, null, this);

    // Start the game on pointer down
    this.input.on('pointerdown', function () {
        if (gameOver) {
            restartGame.call(this);
        } else if (!gameStarted) {
            startGame.call(this);
        }
    }, this);

    // Check for ball hitting the bottom of the world
    this.physics.world.on('worldbounds', function(body, up, down, left, right) {
        if (body.gameObject === ball && down) {
            loseLife.call(this);
        }
    }, this);
}

// Game loop
function update() {
    if (!gameStarted) {
        return; // Don't move paddle if game hasn't started
    }

    // Move paddle with mouse/pointer
    paddle.x = this.input.x;

    // Keep paddle within the game boundaries
    if (paddle.x < paddle.width / 2) {
        paddle.x = paddle.width / 2;
    }
    if (paddle.x > this.physics.world.bounds.width - (paddle.width / 2)) {
        paddle.x = this.physics.world.bounds.width - (paddle.width / 2);
    }
}

// Called when the ball collides with a brick
function ballHitBrick(ball, brick) {
    brick.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    // Check for win condition
    if (bricks.countActive(true) === 0) {
        this.physics.pause();
        startText.setText('You Win! Click to Restart');
        startText.setVisible(true);
        gameOver = true;
        gameStarted = false;
    }
}

// Starts the main game logic
function startGame() {
    gameStarted = true;
    startText.setVisible(false);
    ball.enableBody(true, paddle.x, paddle.y - 30, true, true);
    ball.setVelocity(-150, -400);
    gameOver = false;
}

// Called when the player loses a life
function loseLife() {
    lives--;
    livesText.setText('Lives: ' + lives);

    if (lives === 0) {
        this.physics.pause();
        gameOver = true;
        gameStarted = false;
        startText.setText('Game Over! Click to Restart');
        startText.setVisible(true);
    } else {
        gameStarted = false;
        ball.disableBody(true, true);
        paddle.setPosition(400, 550);
        startText.setText('Click to continue');
        startText.setVisible(true);
    }
}

// Resets the game to its initial state
function restartGame() {
    lives = 3;
    score = 0;
    gameOver = false;
    gameStarted = false;
    livesText.setText('Lives: ' + lives);
    scoreText.setText('Score: ' + score);
    startText.setText('Click to Start');
    startText.setVisible(true);

    this.physics.resume();
    ball.disableBody(true, true);
    paddle.setPosition(400, 550);

    // Re-enable all bricks
    bricks.children.iterate(function (child) {
        child.enableBody(true, child.x, 80, true, true); // Reset position too
    });
}

// Initialize the game
game = new Phaser.Game(config);
