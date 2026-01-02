/**
 * @author Maya, Game Developer
 * @description A complete rewrite of a Breakout/Arkanoid style game in Phaser 3.
 * This version focuses on stability, clean code, and core gameplay mechanics.
 * All assets are generated dynamically, including sound effects.
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

// Global object to hold our sound instances
let sounds = {};

// --- Scene Functions ---

function preload() {
    // --- Stable Dynamic Sound Generation --- 
    // This new approach creates audio data and adds it directly to Phaser's cache,
    // ensuring sounds are ready before the game starts.
    const createProceduralSound = (key, freq, type = 'sine', duration = 0.1) => {
        const audioContext = this.sound.context;
        const sampleRate = audioContext.sampleRate;
        const numFrames = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, numFrames, sampleRate);
        const channelData = buffer.getChannelData(0);

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, 0);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination); // Required for offline context

        for (let i = 0; i < numFrames; i++) {
            const time = i / sampleRate;
            // A simple way to simulate an ADSR envelope for a 'blip' sound
            const amplitude = Math.max(0, 1.0 - (time / duration));
            channelData[i] = Math.sin(2 * Math.PI * freq * time) * amplitude * 0.5;
            if (type === 'square') {
                channelData[i] = Math.sign(channelData[i]) * amplitude * 0.3;
            } else if (type === 'sawtooth') {
                 channelData[i] = ((time * freq) % 1.0) * 2.0 - 1.0 * amplitude * 0.5;
            }
        }

        // Directly add the generated audio buffer to Phaser's audio cache.
        this.cache.audio.add(key, buffer);
    };

    // Generate all the sounds we need
    createProceduralSound('brick', 800, 'square', 0.05);
    createProceduralSound('paddle', 400, 'sine', 0.08);
    createProceduralSound('wall', 200, 'sine', 0.08);
    createProceduralSound('loseLife', 150, 'sawtooth', 0.3); // Lower and longer sound
}

function create() {
    // Now that sounds are guaranteed to be in the cache, we can create sound instances.
    sounds.brick = this.sound.add('brick');
    sounds.paddle = this.sound.add('paddle');
    sounds.wall = this.sound.add('wall');
    sounds.loseLife = this.sound.add('loseLife');

    // Enable world bounds, but disable the bottom one for losing.
    this.physics.world.setBoundsCollision(true, true, true, false);

    createBricks.call(this);
    createPaddle.call(this);
    createBall.call(this);
    createUI.call(this);

    // Setup collision handlers
    this.physics.add.collider(ball, bricks, hitBrick, null, this);
    this.physics.add.collider(ball, paddle, hitPaddle, null, this);

    // Add a listener for the ball hitting the world bounds (walls)
    this.physics.world.on('worldbounds', (body, up, down, left, right) => {
        if (body.gameObject === ball) {
            sounds.wall.play();
        }
    });

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
        loseLife.call(this);
    }
}

// --- Game Logic Functions ---

function createBricks() {
    const brickGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    brickGraphics.fillStyle(0xffffff);
    brickGraphics.fillRect(0, 0, 64, 32);
    brickGraphics.generateTexture('brick_white', 64, 32);
    brickGraphics.destroy();

    bricks = this.physics.add.group({ immovable: true });

    const brickColors = [0xcc2222, 0x22cc22, 0x2222cc, 0xcccc22, 0xcc22cc, 0x22cccc];
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 10; j++) {
            const brick = bricks.create(80 + j * 68, 100 + i * 36, 'brick_white');
            brick.setTint(brickColors[i]);
            brick.body.setBounce(1, 1);
        }
    }
}

function createPaddle() {
    const paddleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    paddleGraphics.fillStyle(0xeeeeee);
    paddleGraphics.fillRect(0, 0, 100, 20);
    paddleGraphics.generateTexture('paddle', 100, 20);
    paddleGraphics.destroy();

    paddle = this.physics.add.image(400, 550, 'paddle').setImmovable();
}

function createBall() {
    const ballGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    ballGraphics.fillStyle(0xffffff);
    ballGraphics.fillCircle(12, 12, 12);
    ballGraphics.generateTexture('ball', 24, 24);
    ballGraphics.destroy();

    ball = this.physics.add.image(400, 526, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    ball.body.onWorldBounds = true;
}

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
    ball.setPosition(paddle.x, 526);
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
    
    ball.enableBody(true, paddle.x, 526, true, true);
    ball.setVelocity(0, 0);

    bricks.children.each(function (brick) {
        brick.enableBody(true, brick.x, brick.y, true, true);
    });
}