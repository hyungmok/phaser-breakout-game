/**
 * @author Maya, Game Developer
 * @description A complete rewrite of a Breakout/Arkanoid style game in Phaser 3.
 * This version focuses on stability, clean code, and core gameplay mechanics.
 * This version is updated to scale and fit the entire browser window.
 */

// --- Game Configuration ---
const config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    backgroundColor: '#000020',
    scale: {
        mode: Phaser.Scale.FIT, // Fit to window while maintaining aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
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

// Global object to hold our sound instances
let sounds = {};

// --- Scene Functions ---

function preload() {
    // --- Stable Dynamic Sound Generation --- 
    const createProceduralSound = (key, freq, type = 'sine', duration = 0.1) => {
        const audioContext = this.sound.context;
        const sampleRate = audioContext.sampleRate;
        const numFrames = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, numFrames, sampleRate);
        const channelData = buffer.getChannelData(0);

        for (let i = 0; i < numFrames; i++) {
            const time = i / sampleRate;
            const amplitude = Math.max(0, 1.0 - (time / duration));
            let sample = Math.sin(2 * Math.PI * freq * time) * amplitude * 0.5;
            if (type === 'square') {
                sample = Math.sign(sample) * amplitude * 0.3;
            } else if (type === 'sawtooth') {
                 sample = ((time * freq) % 1.0) * 2.0 - 1.0 * amplitude * 0.5;
            }
            channelData[i] = sample;
        }

        this.cache.audio.add(key, buffer);
    };

    // Generate all the sounds we need
    createProceduralSound('brick', 800, 'square', 0.05);
    createProceduralSound('paddle', 400, 'sine', 0.08);
    createProceduralSound('wall', 200, 'sine', 0.08);
    createProceduralSound('loseLife', 150, 'sawtooth', 0.3);
}

function create() {
    sounds.brick = this.sound.add('brick');
    sounds.paddle = this.sound.add('paddle');
    sounds.wall = this.sound.add('wall');
    sounds.loseLife = this.sound.add('loseLife');

    this.physics.world.setBoundsCollision(true, true, true, false);

    createBricks.call(this);
    createPaddle.call(this);
    createBall.call(this);
    createUI.call(this);

    this.physics.add.collider(ball, bricks, hitBrick, null, this);
    this.physics.add.collider(ball, paddle, hitPaddle, null, this);

    this.physics.world.on('worldbounds', (body) => {
        if (body.gameObject === ball) {
            sounds.wall.play();
        }
    });

    // --- MODIFICATION START ---
    // Listen to the global pointermove event and make paddle follow.
    this.input.on('pointermove', function (pointer) {
        // Clamp paddle position to stay within the game's visible width.
        const halfPaddleWidth = paddle.width / 2;
        paddle.x = Phaser.Math.Clamp(pointer.x, halfPaddleWidth, this.scale.width - halfPaddleWidth);
    }, this);
    // --- MODIFICATION END ---

    this.input.on('pointerdown', releaseBall, this);
}

function update() {
    if (ballIsOnPaddle) {
        ball.body.x = paddle.x - (ball.width / 2);
    }

    // Check for ball falling out of bounds
    if (ball.y > this.scale.height) {
        loseLife.call(this);
    }
}

// --- Game Logic Functions ---

function createBricks() {
    bricks = this.physics.add.group({ immovable: true });
    const brickWidth = 64;
    const brickHeight = 32;
    const brickPadding = 4;
    const numCols = 10;
    const numRows = 6;
    const startX = (this.scale.width - (numCols * (brickWidth + brickPadding))) / 2;
    const startY = 100;

    const brickColors = [0xcc2222, 0x22cc22, 0x2222cc, 0xcccc22, 0xcc22cc, 0x22cccc];
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
            const x = startX + j * (brickWidth + brickPadding) + (brickWidth / 2);
            const y = startY + i * (brickHeight + brickPadding) + (brickHeight / 2);
            const brick = bricks.create(x, y, null);
            brick.body.setSize(brickWidth, brickHeight).setAllowGravity(false);
            brick.setTint(brickColors[i]);
            brick.setBounce(1,1);
        }
    }
}

function createPaddle() {
    const paddleWidth = 100;
    const paddleHeight = 20;
    paddle = this.physics.add.image(this.scale.width / 2, this.scale.height - 50, null)
        .setImmovable();
    paddle.body.setSize(paddleWidth, paddleHeight).setAllowGravity(false);
}

function createBall() {
    const ballRadius = 12;
    ball = this.physics.add.image(this.scale.width / 2, this.scale.height - 76, null);
    ball.body.setCircle(ballRadius).setAllowGravity(false);
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    ball.body.onWorldBounds = true;
}

function createUI() {
    const style = { fontSize: '24px', fill: '#fff', fontFamily: 'Arial' };
    scoreText = this.add.text(16, 16, 'Score: 0', style);
    livesText = this.add.text(this.scale.width - 16, 16, 'Lives: 3', style).setOrigin(1, 0);

    startText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Click to Start', {
        fontSize: '48px',
        fill: '#fff',
        fontFamily: 'Arial'
    }).setOrigin(0.5);
}

function releaseBall() {
    if (ballIsOnPaddle) {
        gameStarted = true;
        ballIsOnPaddle = false;
        ball.setVelocity(-75, -300);
        startText.setVisible(false);
    }
}

function hitBrick(ball, brick) {
    brick.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);
    sounds.brick.play();

    if (bricks.countActive(true) === 0) {
        winGame.call(this);
    }
}

function hitPaddle(ball, paddle) {
    sounds.paddle.play();
    let diff = 0;

    if (ball.x < paddle.x) {
        diff = paddle.x - ball.x;
        ball.setVelocityX(-10 * diff);
    } else if (ball.x > paddle.x) {
        diff = ball.x - paddle.x;
        ball.setVelocityX(10 * diff);
    } else {
        ball.setVelocityX(2 + Math.random() * 8);
    }
}

function loseLife() {
    sounds.loseLife.play();
    lives--;
    livesText.setText('Lives: ' + lives);

    if (lives === 0) {
        gameOver.call(this);
    } else {
        resetBall.call(this);
    }
}

function resetBall() {
    ballIsOnPaddle = true;
    ball.setVelocity(0, 0);
    ball.setPosition(paddle.x, this.scale.height - 76);
}

function gameOver() {
    ball.disableBody(true, true);
    startText.setText('Game Over! Click to Restart');
    startText.setVisible(true);
    
    this.input.once('pointerdown', () => {
        restartGame.call(this);
    }, this);
}

function winGame() {
    ball.disableBody(true, true);
    startText.setText('You Win! Click to Restart');
    startText.setVisible(true);

    this.input.once('pointerdown', () => {
        restartGame.call(this);
    }, this);
}

function restartGame() {
    score = 0;
    lives = 3;
    gameStarted = false;
    ballIsOnPaddle = true;

    scoreText.setText('Score: ' + score);
    livesText.setText('Lives: ' + lives);
    
    startText.setText('Click to Start');
    startText.setVisible(true);
    
    resetBall.call(this);
    ball.enableBody(true, paddle.x, this.scale.height - 76, true, true);
    
    bricks.children.each(function (brick) {
        brick.enableBody(true, brick.x, brick.y, true, true);
        brick.setTint(brick.tintTopLeft);
    });
}
