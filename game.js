let game;
let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            checkCollision: {
                up: false,
                down: false,
            }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    backgroundColor: '#eee'
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
let gameStarted = false; // <-- FIX: New state variable

function preload() {
    this.load.image('ball', 'assets/ball.png');
    this.load.image('paddle', 'assets/paddle.png');
    this.load.image('brick', 'assets/brick.png');
}

function create() {
    ball = this.physics.add.sprite(400, 500, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);
    ball.disableBody(true, true);

    paddle = this.physics.add.sprite(400, 550, 'paddle');
    paddle.setImmovable(true);
    paddle.setCollideWorldBounds(true);

    bricks = this.physics.add.group({
        key: 'brick',
        repeat: 9,
        setXY: { x: 80, y: 50, stepX: 70 }
    });
    bricks.children.iterate(function (child) {
        child.setImmovable(true);
    });

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
    livesText = this.add.text(680, 16, 'Lives: 3', { fontSize: '32px', fill: '#000' });
    startText = this.add.text(400, 300, 'Click to Start', { fontSize: '32px', fill: '#000' });
    startText.setOrigin(0.5);

    this.physics.add.collider(ball, paddle);
    this.physics.add.collider(ball, bricks, ballHitBrick, null, this);

    this.input.on('pointerdown', function () {
        if (gameOver) {
            restartGame.call(this);
        } else if (!gameStarted) { // <-- FIX: Check if game has started
            startGame.call(this);
        }
    }, this);

    this.physics.world.on('worldbounds', function(body) {
        if (body.gameObject === ball && body.blocked.down) {
            loseLife.call(this);
        }
    }, this);
}

function update() {
    if (gameStarted) {
        paddle.x = this.input.x;

        if (paddle.x < 40) {
            paddle.x = 40;
        }
        if (paddle.x > 760) {
            paddle.x = 760;
        }
    }
}

function ballHitBrick(ball, brick) {
    brick.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);
    if (bricks.countActive() === 0) {
        this.physics.pause();
        startText.setText('You Win! Click to Restart');
        startText.setVisible(true);
        gameOver = true;
        gameStarted = false;
    }
}

function startGame() {
    gameStarted = true; // <-- FIX: Set game as started
    startText.setVisible(false);
    ball.enableBody(true, 400, 500, true, true);
    ball.setVelocity(-75, -300);
    gameOver = false;
}

function loseLife() {
    lives--;
    livesText.setText('Lives: ' + lives);
    if (lives === 0) {
        this.physics.pause();
        gameOver = true;
        gameStarted = false; // <-- FIX: Reset on game over
        startText.setText('Game Over! Click to Restart');
        startText.setVisible(true);
    } else {
        gameStarted = false; // <-- FIX: Reset when a life is lost
        ball.disableBody(true, true);
        paddle.setPosition(400, 550);
        startText.setVisible(true);
    }
}

function restartGame() {
    lives = 3;
    score = 0;
    gameOver = false;
    gameStarted = false; // <-- FIX: Reset on restart
    livesText.setText('Lives: ' + lives);
    scoreText.setText('Score: ' + score);
    startText.setVisible(false);

    this.physics.resume();
    ball.disableBody(true, true);
    paddle.setPosition(400, 550);

    bricks.children.iterate(function (child) {
        child.enableBody(true, child.x, child.y, true, true);
    });
}

game = new Phaser.Game(config);