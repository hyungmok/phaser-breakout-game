const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    backgroundColor: '#1a1a1a'
};

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

// Sound variables
let paddleHitSound;
let brickHitSound;
let wallHitSound;
let loseLifeSound;

// Ball speed settings
const initialBallSpeed = 400;
const speedIncrement = 15;
const maxBallSpeed = 700;


const brickInfo = {
    width: 64,
    height: 32,
    count: {
        rows: 5,
        cols: 10
    },
    offset: {
        top: 100,
        left: 0 // Will be calculated dynamically
    },
    padding: 10
};

function preload() {
    // Load audio files
    this.load.audio('paddleHit', 'assets/paddleHit.mp3');
    this.load.audio('brickHit', 'assets/brickHit.mp3');
    this.load.audio('wallHit', 'assets/wallHit.mp3');
    this.load.audio('loseLife', 'assets/loseLife.mp3');
}

function create() {
    // --- Graphics Generation ---
    let graphics = this.add.graphics();

    // Create a circular texture for the ball
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('ball', 16, 16);
    graphics.destroy(); // Clean up graphics object

    // Create paddle texture (re-using old graphics obj memory)
    graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 128, 16);
    graphics.generateTexture('paddle', 128, 16);
    graphics.destroy();

    // Create brick textures
    const colors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6];
    colors.forEach((color, index) => {
        graphics = this.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, brickInfo.width, brickInfo.height);
        graphics.generateTexture('brick' + index, brickInfo.width, brickInfo.height);
        graphics.destroy();
    });

    // --- Sound Setup ---
    paddleHitSound = this.sound.add('paddleHit');
    brickHitSound = this.sound.add('brickHit');
    wallHitSound = this.sound.add('wallHit');
    loseLifeSound = this.sound.add('loseLife');

    // --- Layout and Game Objects ---
    const border = this.add.graphics();
    border.lineStyle(4, 0xecf0f1, 1);
    border.strokeRect(2, 2, 796, 596);

    paddle = this.physics.add.sprite(400, 550, 'paddle');
    paddle.setImmovable(true);
    paddle.setCollideWorldBounds(true);

    ball = this.physics.add.sprite(400, 520, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);
    ball.body.setCircle(8); // Set the physics body to be a circle
    ball.disableBody(true, true);


    // Dynamically center the bricks
    const brickFieldWidth = (brickInfo.count.cols * brickInfo.width) + ((brickInfo.count.cols - 1) * brickInfo.padding);
    brickInfo.offset.left = (this.physics.world.bounds.width - brickFieldWidth) / 2;

    bricks = this.physics.add.staticGroup();
    for (let r = 0; r < brickInfo.count.rows; r++) {
        for (let c = 0; c < brickInfo.count.cols; c++) {
            const brickX = (c * (brickInfo.width + brickInfo.padding)) + brickInfo.offset.left;
            const brickY = (r * (brickInfo.height + brickInfo.padding)) + brickInfo.offset.top;
            const brick = bricks.create(brickX, brickY, 'brick' + r);
            brick.setOrigin(0,0);
        }
    }

    // --- UI Text ---
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#ecf0f1', fontStyle: 'bold' });
    livesText = this.add.text(config.width - 16, 16, 'Lives: 3', { fontSize: '24px', fill: '#ecf0f1', fontStyle: 'bold' }).setOrigin(1, 0);
    startText = this.add.text(400, 350, 'Click to Start', { fontSize: '40px', fill: '#ecf0f1', fontStyle: 'bold' });
    startText.setOrigin(0.5);

    // --- Colliders and Events ---
    this.physics.add.collider(ball, paddle, hitPaddle, null, this);
    this.physics.add.collider(ball, bricks, hitBrick, null, this);
    
    // Play sound on world boundary collision
    this.physics.world.on('worldbounds', (body, up, down, left, right) => {
        if (body.gameObject === ball && (up || left || right)) {
            wallHitSound.play();
        }
    });


    this.input.on('pointerdown', () => {
        if (gameOver) {
            restartGame.call(this);
        } else if (!gameStarted) {
            startGame.call(this);
        }
    });

    this.input.on('pointermove', (pointer) => {
        if (gameStarted) {
            paddle.x = Phaser.Math.Clamp(pointer.x, paddle.width / 2, this.physics.world.bounds.width - (paddle.width / 2));
        }
    });

    this.physics.world.checkCollision.down = false;
}

function update() {
    if (ball.y > this.physics.world.bounds.height) {
        if (!gameOver) {
            loseLife.call(this);
        }
    }
}

function startGame() {
    gameStarted = true;
    startText.setVisible(false);
    ball.enableBody(true, paddle.x, paddle.y - 20, true, true);
    
    // Set initial velocity
    const initialVelocity = new Phaser.Math.Vector2(-75, -initialBallSpeed).normalize().scale(initialBallSpeed);
    ball.setVelocity(initialVelocity.x, initialVelocity.y);
    
    gameOver = false;
}

function hitPaddle(ball, paddle) {
    paddleHitSound.play();
    
    // Increase ball speed
    const currentSpeed = ball.body.velocity.length();
    const newSpeed = Phaser.Math.Clamp(currentSpeed + speedIncrement, initialBallSpeed, maxBallSpeed);

    // Calculate bounce angle based on hit position
    let diff = 0;
    if (ball.x < paddle.x) {
        // Ball is on the left of the paddle
        diff = paddle.x - ball.x;
        const maxDiff = paddle.width / 2;
        const angle = Phaser.Math.DegToRad(180 - (120 * (diff / maxDiff))); // Angle between 180 and 60
        ball.body.velocity.setToPolar(angle, newSpeed);

    } else if (ball.x > paddle.x) {
        // Ball is on the right of the paddle
        diff = ball.x - paddle.x;
        const maxDiff = paddle.width / 2;
        const angle = Phaser.Math.DegToRad(0 + (120 * (diff / maxDiff))); // Angle between 0 and 120
        ball.body.velocity.setToPolar(angle, newSpeed);
        
    } else {
        // Ball hits the center, bounce straight up
        ball.setVelocityY(-newSpeed);
    }
}


function hitBrick(ball, brick) {
    brickHitSound.play();
    brick.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    // Increase speed slightly on brick hit as well
    const currentSpeed = ball.body.velocity.length();
    const newSpeed = Phaser.Math.Clamp(currentSpeed + 2, initialBallSpeed, maxBallSpeed);
    ball.body.velocity.normalize().scale(newSpeed);

    if (bricks.countActive(true) === 0) {
        this.physics.pause();
        startText.setText('You Win!\nClick to Restart');
        startText.setVisible(true);
        gameOver = true;
        gameStarted = false;
        ball.disableBody(true, true);
    }
}

function loseLife() {
    loseLifeSound.play();
    lives--;
    livesText.setText('Lives: ' + lives);

    if (lives === 0) {
        this.physics.pause();
        gameOver = true;
        gameStarted = false;
        startText.setText('Game Over!\nClick to Restart');
        startText.setVisible(true);
        ball.disableBody(true, true);
    } else {
        gameStarted = false;
        ball.disableBody(true, true);
        paddle.setPosition(400, 550);
        startText.setText('Click to Continue');
        startText.setVisible(true);
    }
}

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
    paddle.setPosition(400, 550);

    bricks.children.each(brick => {
        brick.enableBody(true, brick.x, brick.y, true, true);
    });
}

const game = new Phaser.Game(config);
