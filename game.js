/**
 * @author Maya, Game Developer
 * @description A complete rewrite of a Breakout/Arkanoid style game in Phaser 3.
 * 
 * --- 🚨 중요: 게임 실행 방법 (CORS 에러 해결) ---
 * 현재 CORS 정책 에러가 발생하는 이유는 `index.html` 파일을 브라우저에서 직접 열었기 때문입니다.
 * 보안상의 이유로, 브라우저는 로컬 파일 시스템(`file:///`)에서 다른 파일(사운드, 이미지 등)을 불러오는 것을 차단합니다.
 * 
 * 이 문제를 해결하려면, 반드시 로컬 웹 서버를 통해 게임을 실행해야 합니다.
 * 
 * 가장 간단한 두 가지 방법:
 * 
 * 1. Python을 사용하는 방법 (Python이 설치되어 있다면):
 *    - 터미널이나 명령 프롬프트를 열고 이 게임 프로젝트 폴더로 이동합니다.
 *    - `python -m http.server` (Python 3) 또는 `python -m SimpleHTTPServer` (Python 2) 명령어를 실행합니다.
 *    - 브라우저를 열고 `http://localhost:8000` 주소로 접속합니다.
 * 
 * 2. VS Code의 'Live Server' 확장 프로그램 사용:
 *    - Visual Studio Code에서 "Live Server" 확장 프로그램을 설치합니다.
 *    - VS Code 파일 탐색기에서 `index.html` 파일을 마우스 오른쪽 버튼으로 클릭합니다.
 *    - "Open with Live Server"를 선택하면 자동으로 브라우저에서 게임이 열립니다.
 * 
 * --- IMPORTANT NOTE ON RUNNING THE GAME (FIXING CORS ERROR) ---
 * You are seeing a CORS error because you are opening the index.html file directly.
 * For security reasons, browsers block loading game assets (like sounds and images) from the local file system (`file:///`).
 * 
 * To fix this, you MUST run the game from a local web server.
 * 
 * Here are two simple ways to do that:
 * 
 * 1. Using Python (if you have Python installed):
 *    - Open a terminal or command prompt in your game's project folder.
 *    - Run the command: `python -m http.server` (for Python 3) or `python -m SimpleHTTPServer` (for Python 2).
 *    - Open your browser and go to: http://localhost:8000
 * 
 * 2. Using VS Code Live Server extension:
 *    - Install the "Live Server" extension in Visual Studio Code.
 *    - Right-click on your `index.html` file in the VS Code explorer.
 *    - Select "Open with Live Server". This will automatically open the game in your browser.
 * -----------------------------------------
 * 
 * This version focuses on stability, clean code, and core gameplay mechanics.
 * This version is updated to scale and fit the entire browser window and fixes rendering issues.
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

// Sound variables
let brickHitSound;
let paddleHitSound;
let winSound;

// --- Scene Functions ---

function preload() {
    // Generate a white rectangle texture for paddle and bricks
    let graphics = this.make.graphics({ fillStyle: { color: 0xffffff }, add: false });
    graphics.fillRect(0, 0, 1, 1);
    graphics.generateTexture('pixel', 1, 1);
    
    // Generate a white circle texture for the ball
    graphics = this.make.graphics({ fillStyle: { color: 0xffffff }, add: false });
    graphics.fillCircle(12, 12, 12);
    graphics.generateTexture('ball_texture', 24, 24);

    // Load sounds
    this.load.audio('brick_hit', 'assets/brick_hit.wav');
    this.load.audio('paddle_hit', 'assets/paddle_hit.wav');
    this.load.audio('win_sound', 'assets/win_sound.wav');
}

function create() {
    this.physics.world.setBoundsCollision(true, true, true, false);

    createBricks.call(this);
    createPaddle.call(this);
    createBall.call(this);
    createUI.call(this);

    // Initialize sounds
    brickHitSound = this.sound.add('brick_hit');
    paddleHitSound = this.sound.add('paddle_hit');
    winSound = this.sound.add('win_sound');

    this.physics.add.collider(ball, bricks, hitBrick, null, this);
    this.physics.add.collider(ball, paddle, hitPaddle, null, this);

    this.input.on('pointermove', function (pointer) {
        const halfPaddleWidth = paddle.displayWidth / 2;
        paddle.x = Phaser.Math.Clamp(pointer.x, halfPaddleWidth, this.scale.width - halfPaddleWidth);
    }, this);

    this.input.on('pointerdown', releaseBall, this);
}

function update() {
    if (ballIsOnPaddle) {
        ball.x = paddle.x;
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
            const x = startX + j * (brickWidth + brickPadding);
            const y = startY + i * (brickHeight + brickPadding);
            const brick = bricks.create(x, y, 'pixel');
            brick.setOrigin(0,0);
            brick.displayWidth = brickWidth;
            brick.displayHeight = brickHeight;
            brick.setTint(brickColors[i]);
            brick.body.setAllowGravity(false);
        }
    }
}

function createPaddle() {
    const paddleWidth = 100;
    const paddleHeight = 20;
    paddle = this.physics.add.image(this.scale.width / 2, this.scale.height - 50, 'pixel')
        .setImmovable();
    paddle.setOrigin(0.5, 0.5);
    paddle.displayWidth = paddleWidth;
    paddle.displayHeight = paddleHeight;
    paddle.body.setAllowGravity(false);
    paddle.setCollideWorldBounds(true);
    paddle.body.onWorldBounds = true;
}

function createBall() {
    ball = this.physics.add.image(this.scale.width / 2, paddle.y - (paddle.displayHeight / 2) - 12, 'ball_texture');
    ball.setCircle(12);
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    ball.body.onWorldBounds = true;
    ball.body.setAllowGravity(false);
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
    brickHitSound.play();

    if (bricks.countActive(true) === 0) {
        winGame.call(this);
    }
}

function hitPaddle(ball, paddle) {
    paddleHitSound.play();
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
    ball.setPosition(paddle.x, paddle.y - (paddle.displayHeight / 2) - 12);
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
    winSound.play();
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
    
    // Reset paddle position to center
    paddle.x = this.scale.width / 2;

    resetBall.call(this);
    ball.enableBody(true, paddle.x, paddle.y - (paddle.displayHeight / 2) - 12, true, true);
    
    bricks.children.each((brick) => {
        brick.enableBody(true, brick.x, brick.y, true, true);
    });
}
// --- END OF FILE ---
