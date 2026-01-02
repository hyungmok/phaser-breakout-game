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

const brickInfo = {
    width: 64,
    height: 32,
    count: {
        rows: 5,
        cols: 10
    },
    offset: {
        top: 100,
        left: 60
    },
    padding: 10
};

function preload() {}

function create() {
    let graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 16, 16);
    graphics.generateTexture('ball', 16, 16);

    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 128, 16);
    graphics.generateTexture('paddle', 128, 16);

    const colors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6];
    colors.forEach((color, index) => {
        graphics.clear();
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, brickInfo.width, brickInfo.height);
        graphics.generateTexture('brick' + index, brickInfo.width, brickInfo.height);
    });
    graphics.destroy();

    const border = this.add.graphics();
    border.lineStyle(4, 0xecf0f1, 1);
    border.strokeRect(2, 2, 796, 596);

    paddle = this.physics.add.sprite(400, 550, 'paddle');
    paddle.setImmovable(true);
    paddle.setCollideWorldBounds(true);
    paddle.body.setSize(128, 16);

    ball = this.physics.add.sprite(400, 520, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);
    ball.disableBody(true, true);

    bricks = this.physics.add.staticGroup();
    for (let r = 0; r < brickInfo.count.rows; r++) {
        for (let c = 0; c < brickInfo.count.cols; c++) {
            const brickX = (c * (brickInfo.width + brickInfo.padding)) + brickInfo.offset.left;
            const brickY = (r * (brickInfo.height + brickInfo.padding)) + brickInfo.offset.top;
            const brick = bricks.create(brickX, brickY, 'brick' + r);
            brick.setOrigin(0,0);
        }
    }

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#ecf0f1', fontStyle: 'bold' });
    livesText = this.add.text(680, 16, 'Lives: 3', { fontSize: '24px', fill: '#ecf0f1', fontStyle: 'bold' });
    startText = this.add.text(400, 350, 'Click to Start', { fontSize: '40px', fill: '#ecf0f1', fontStyle: 'bold' });
    startText.setOrigin(0.5);

    this.physics.add.collider(ball, paddle, hitPaddle, null, this);
    this.physics.add.collider(ball, bricks, hitBrick, null, this);

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
    ball.enableBody(true, paddle.x, paddle.y - 30, true, true);
    ball.setVelocity(-75, -400);
    gameOver = false;
}

function hitPaddle(ball, paddle) {
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

function hitBrick(ball, brick) {
    brick.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

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