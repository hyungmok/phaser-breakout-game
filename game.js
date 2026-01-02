/**
 * @author Maya, Game Developer
 * @description A complete rewrite of a Breakout/Arkanoid style game in Phaser 3.
 * 
 * --- 🚨 중요: 게임 실행 방법 (CORS 에러 해결) ---
 * 웹서버를 실행하지 않고 `index.html` 파일을 직접 브라우저에서 열면, CORS 보안 정책 때문에 사운드 같은 외부 파일을 불러올 수 없습니다.
 * 이것은 브라우저의 정상적인 보안 동작이며, 코드를 수정해서 해결할 수 있는 문제가 아닙니다.
 * 
 * 반드시 아래 방법 중 하나를 사용해 로컬 웹 서버를 실행해야 합니다.
 * 
 * 1. Python을 사용하는 방법 (가장 간단):
 *    - 터미널(CMD)을 열고 이 게임 프로젝트 폴더로 이동합니다.
 *    - `python -m http.server` 라고 입력하고 엔터를 칩니다.
 *    - 웹 브라우저 주소창에 `http://localhost:8000` 을 입력해 접속합니다.
 * 
 * 2. VS Code의 'Live Server' 확장 프로그램 사용:
 *    - VS Code 마켓플레이스에서 "Live Server"를 검색해 설치합니다.
 *    - `index.html` 파일을 마우스 오른쪽 버튼으로 클릭하고 "Open with Live Server"를 선택합니다.
 * 
 * --- IMPORTANT: HOW TO RUN THE GAME (FIXING CORS ERROR) ---
 * If you open the `index.html` file directly in your browser without a web server, you will get a CORS security error.
 * This is a standard browser security feature and cannot be fixed by changing the game code.
 * 
 * You MUST run the game using a local web server. Here are two easy ways:
 * 
 * 1. Using Python (easiest method):
 *    - Open a terminal (CMD) in this project folder.
 *    - Type `python -m http.server` and press Enter.
 *    - In your web browser, go to `http://localhost:8000`.
 * 
 * 2. Using VS Code 'Live Server' Extension:
 *    - Install the "Live Server" extension from the VS Code Marketplace.
 *    - Right-click the `index.html` file and choose "Open with Live Server".
 * -----------------------------------------
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
    // --- CORS Error Prevention ---
    // Check if the game is running via file:// protocol.
    if (window.location.protocol === 'file:') {
        // Display a clear error message on the screen after the loader finishes its (empty) queue.
        this.load.on('complete', () => {
            const errorStyle = { 
                fontSize: '24px', 
                fill: '#ffdddd', 
                fontFamily: 'Arial', 
                align: 'center',
                wordWrap: { width: this.scale.width - 40, useAdvancedWrap: true }
            };
            const errorText = `ERROR: Cannot load game assets.\n\nThis game MUST be run on a web server.\nPlease see instructions in the game.js file.`;
            this.add.text(this.scale.width / 2, this.scale.height / 2, errorText, errorStyle).setOrigin(0.5);
        });
        return; // Stop adding any assets to the load queue.
    }

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
    // --- CORS Error Prevention: Final Safeguard ---
    // If preload was stopped due to file:// protocol, this halts create() from running and crashing.
    if (window.location.protocol === 'file:') {
        return; // Halt execution immediately.
    }

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
        if (!paddle) return;
        const halfPaddleWidth = paddle.displayWidth / 2;
        paddle.x = Phaser.Math.Clamp(pointer.x, halfPaddleWidth, this.scale.width - halfPaddleWidth);
    }, this);

    this.input.on('pointerdown', releaseBall, this);
}

function update() {
    if (ballIsOnPaddle) {
        if (ball && paddle) {
           ball.x = paddle.x;
        }
    }

    if (ball && ball.y > this.scale.height) {
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
    ball = this.physics.add.image(paddle.x, paddle.y - (paddle.displayHeight / 2) - 12, 'ball_texture');
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