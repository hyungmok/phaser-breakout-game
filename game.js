const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
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

const game = new Phaser.Game(config);

function preload() {
    this.load.image('sky', 'https://labs.phaser.io/assets/skies/space3.png');
    this.load.image('logo', 'https://labs.phaser.io/assets/sprites/phaser3-logo.png');
    this.load.image('paddle', 'https://labs.phaser.io/assets/sprites/platform.png');
    this.load.image('brick', 'https://labs.phaser.io/assets/sprites/crate.png');
    this.load.image('ball', 'https://labs.phaser.io/assets/sprites/shinyball.png');
    // All audio is commented out to prevent loading errors on file:// protocol
    // this.load.audio('music', 'assets/audio/music.mp3');
    // this.load.audio('brickSound', 'assets-audio/brick.mp3');
    // this.load.audio('paddleSound', 'assets/audio/paddle.mp3');
}

function create() {
    this.add.image(400, 300, 'sky');

    this.physics.world.setBoundsCollision(true, true, true, false);

    this.bricks = this.physics.add.staticGroup({
        key: 'brick',
        frameQuantity: 80,
        gridAlign: { width: 10, height: 8, cellWidth: 70, cellHeight: 30, x: 105, y: 100 }
    });

    this.paddle = this.physics.add.sprite(400, 550, 'paddle').setImmovable(true);
    this.paddle.body.allowGravity = false;
    this.paddle.setCollideWorldBounds(true);

    this.ball = this.physics.add.sprite(400, 525, 'ball');
    this.ball.setBounce(1);
    this.ball.setCollideWorldBounds(true);

    this.physics.add.collider(this.ball, this.bricks, ballHitsBrick, null, this);
    this.physics.add.collider(this.ball, this.paddle, hitPaddle, null, this);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.score = 0;
    this.lives = 3;
    this.gameOver = false;

    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
    this.livesText = this.add.text(620, 16, 'Lives: 3', { fontSize: '32px', fill: '#fff' });

    // Initial setup to place the ball on the paddle and wait for launch
    readyToServe.call(this);
}

function update() {
    if (this.gameOver) {
        return;
    }

    if (this.cursors.left.isDown) {
        this.paddle.setVelocityX(-500);
    } else if (this.cursors.right.isDown) {
        this.paddle.setVelocityX(500);
    } else {
        this.paddle.setVelocityX(0);
    }

    if (this.ball.getData('onPaddle')) {
        this.ball.x = this.paddle.x;
    }

    if (this.ball.y > 600) {
        resetBall.call(this);
    }
}

// This function now correctly sets up a one-time listener for launch
function readyToServe() {
    this.paddle.setPosition(400, 550);
    this.ball.setPosition(this.paddle.x, 525);
    this.ball.setData('onPaddle', true);
    this.ball.setVelocity(0, 0); // Ensure velocity is reset
    
    // This listener is specific, temporary, and will self-destruct after one use
    this.input.once('pointerdown', releaseBall, this);
}

function releaseBall() {
    if (this.ball.getData('onPaddle')) {
        this.ball.setData('onPaddle', false);
        this.ball.setVelocity(-75, -600);
    }
}

function resetBall() {
    this.lives--;
    this.livesText.setText('Lives: ' + this.lives);

    if (this.lives === 0) {
        this.gameOver = true;
        this.physics.pause();
        this.ball.destroy();
        this.add.text(400, 300, 'GAME OVER', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5);
        this.add.text(400, 350, 'Click to Restart', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
        
        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    } else {
        // Instead of duplicating logic, just call the setup function.
        // This is the core of the fix.
        readyToServe.call(this);
    }
}

function ballHitsBrick(ball, brick) {
    brick.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);

    if (this.bricks.countActive(true) === 0) {
        resetLevel.call(this);
    }
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

function resetLevel() {
    this.lives++;
    this.livesText.setText('Lives: ' + this.lives);
    
    // Reset ball and paddle
    readyToServe.call(this);
    
    // Respawn bricks
    this.bricks.children.iterate(function (child) {
        child.enableBody(true, child.x, child.y, true, true);
    });
}