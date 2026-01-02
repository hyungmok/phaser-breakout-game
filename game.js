// Basic Game Config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Game Variables
let paddle;
let ball;
let bricks;
let scoreText;
let livesText;
let startButton;
let gameOverText;
let winText;

let score = 0;
let lives = 3;
let gameStarted = false;

const game = new Phaser.Game(config);

function preload() {
    // No assets to load for this simple version
}

function create() {
    // Create Paddle
    paddle = this.physics.add.image(400, 550, 'paddle').setImmovable();
    paddle.setCollideWorldBounds(true);
    // We create a texture for the paddle since we don't have an image
    let paddleGraphics = this.make.graphics();
    paddleGraphics.fillStyle(0xffffff);
    paddleGraphics.fillRect(0, 0, 100, 20);
    paddleGraphics.generateTexture('paddle', 100, 20);
    paddleGraphics.destroy();
    paddle.setTexture('paddle');


    // Create Ball
    ball = this.physics.add.image(400, 500, 'ball');
    let ballGraphics = this.make.graphics();
    ballGraphics.fillStyle(0xffffff);
    ballGraphics.fillCircle(10, 10, 10);
    ballGraphics.generateTexture('ball', 20, 20);
    ballGraphics.destroy();
    ball.setTexture('ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);


    // Create Bricks
    bricks = this.physics.add.group();
    let brickGraphics = this.make.graphics();
    brickGraphics.fillStyle(0x00ff00); // Green bricks
    brickGraphics.fillRect(0, 0, 75, 30);
    brickGraphics.generateTexture('brick', 75, 30);
    brickGraphics.destroy();

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 10; j++) {
            let brick = bricks.create(80 + j * 70, 50 + i * 40, 'brick');
            brick.setImmovable(true);
        }
    }

    // UI Text
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFF' });
    livesText = this.add.text(650, 16, 'Lives: 3', { fontSize: '32px', fill: '#FFF' });
    
    // Game Over and Win Text (initially invisible)
    gameOverText = this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#F00' }).setOrigin(0.5).setVisible(false);
    winText = this.add.text(400, 300, 'You Win!', { fontSize: '64px', fill: '#0F0' }).setOrigin(0.5).setVisible(false);


    // Start Button
    startButton = this.add.text(400, 400, 'Click to Start', { fontSize: '48px', fill: '#FFF' }).setOrigin(0.5).setInteractive();
    
    this.input.on('pointerdown', () => {
        if (!gameStarted) {
            startGame();
            startButton.destroy();
        }
    });

    // Physics Collisions
    this.physics.add.collider(ball, paddle, hitPaddle, null, this);
    this.physics.add.collider(ball, bricks, hitBrick, null, this);

    // Mouse control for paddle
    this.input.on('pointermove', function (pointer) {
        if(gameStarted) {
            paddle.x = Phaser.Math.Clamp(pointer.x, 50, 750);
        }
    }, this);
}

function update() {
    if (ball.y > 600) {
        loseLife.call(this);
    }
}

function startGame() {
    gameStarted = true;
    ball.setVelocity(-75, -300);
}

function hitPaddle(ball, paddle) {
    let diff = 0;
    if (ball.x < paddle.x) {
        // Ball is on the left-hand side of the paddle
        diff = paddle.x - ball.x;
        ball.setVelocityX(-10 * diff);
    } else if (ball.x > paddle.x) {
        // Ball is on the right-hand side of the paddle
        diff = ball.x - paddle.x;
        ball.setVelocityX(10 * diff);
    } else {
        // Ball is perfectly in the middle
        ball.setVelocityX(2 + Math.random() * 8);
    }
}

function hitBrick(ball, brick) {
    brick.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    if (bricks.countActive() === 0) {
        winGame.call(this);
    }
}

function loseLife() {
    lives--;
    livesText.setText('Lives: ' + lives);

    if (lives === 0) {
        endGame.call(this);
    } else {
        resetBall.call(this);
    }
}

function resetBall() {
    ball.setPosition(400, 500);
    ball.setVelocity(0, 0);
    gameStarted = false;
    
    // Show start prompt again
    let restartPrompt = this.add.text(400, 400, 'Click to Continue', { fontSize: '48px', fill: '#FFF' }).setOrigin(0.5).setInteractive();
    this.input.once('pointerdown', () => {
        gameStarted = true;
        ball.setVelocity(-75, -300);
        restartPrompt.destroy();
    });
}

function endGame() {
    this.physics.pause();
    ball.setVisible(false);
    paddle.setVisible(false);
    gameOverText.setVisible(true);
}

function winGame() {
    this.physics.pause();
    ball.setVisible(false);
    paddle.setVisible(false);
    winText.setVisible(true);
}