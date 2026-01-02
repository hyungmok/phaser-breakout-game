class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // No external assets to load, we'll create graphics dynamically.
    }

    create() {
        // --- GAME STATE INITIALIZATION ---
        this.score = 0;
        this.lives = 3;
        this.gameStarted = false;

        // --- CREATE PADDLE ---
        // A Rectangle GameObject is simpler than generating a texture.
        this.paddle = this.add.rectangle(400, 550, 100, 20, 0xffffff);
        this.physics.add.existing(this.paddle);
        this.paddle.body.setImmovable(true);
        this.paddle.body.setCollideWorldBounds(true);

        // --- CREATE BALL ---
        // We'll generate a circular texture for the ball as it's cleaner.
        if (!this.textures.exists('ball')) {
            let ballGraphics = this.make.graphics();
            ballGraphics.fillStyle(0xffffff);
            ballGraphics.fillCircle(10, 10, 10);
            ballGraphics.generateTexture('ball', 20, 20);
            ballGraphics.destroy();
        }
        this.ball = this.physics.add.image(400, 500, 'ball');
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(1);
        this.ball.body.stop(); // Stop the ball initially

        // --- CREATE BRICKS ---
        this.bricks = this.physics.add.group();
        if (!this.textures.exists('brick')) {
            let brickGraphics = this.make.graphics();
            brickGraphics.fillStyle(0x00ff00); // Green bricks
            brickGraphics.fillRect(0, 0, 75, 30);
            brickGraphics.generateTexture('brick', 75, 30);
            brickGraphics.destroy();
        }

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 10; j++) {
                let brick = this.bricks.create(85 + j * 70, 60 + i * 40, 'brick');
                brick.setImmovable(true);
            }
        }

        // --- UI TEXT ---
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFF' });
        this.livesText = this.add.text(650, 16, 'Lives: 3', { fontSize: '32px', fill: '#FFF' });
        
        this.startText = this.add.text(400, 400, 'Click to Start', { fontSize: '48px', fill: '#FFF' }).setOrigin(0.5);

        // --- COLLIDERS ---
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);

        // --- INPUT HANDLING ---
        this.input.on('pointerdown', () => {
            if (!this.gameStarted) {
                this.startGame();
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.gameStarted) {
                this.paddle.x = Phaser.Math.Clamp(pointer.x, 50, 750);
            }
        });
    }

    update() {
        // Check if ball falls off the screen
        if (this.ball.y > 600) {
            this.loseLife();
        }
        
        // Keep the ball on top of the paddle if game hasn't started
        if (!this.gameStarted) {
            this.ball.setPosition(this.paddle.x, 500);
        }
    }

    startGame() {
        this.gameStarted = true;
        this.startText.setVisible(false);
        this.ball.setVelocity(-75, -300);
    }

    hitPaddle(ball, paddle) {
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

    hitBrick(ball, brick) {
        brick.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if (this.bricks.countActive() === 0) {
            this.winGame();
        }
    }

    loseLife() {
        if (!this.gameStarted) return; // Prevent losing multiple lives if ball is already out

        this.lives--;
        this.livesText.setText('Lives: ' + this.lives);

        if (this.lives === 0) {
            this.endGame();
        } else {
            this.resetLevel();
        }
    }
    
    resetLevel() {
        this.gameStarted = false;
        this.startText.setText('Click to Continue');
        this.startText.setVisible(true);
        this.paddle.setPosition(400, 550);
        this.ball.setPosition(400, 500);
        this.ball.setVelocity(0, 0);
    }

    endGame(isWin = false) {
        this.physics.pause();
        this.ball.setVisible(false);
        this.paddle.setVisible(false);

        let message = isWin ? 'You Win!' : 'Game Over';
        let color = isWin ? '#0F0' : '#F00';

        this.add.text(400, 300, message, { fontSize: '64px', fill: color }).setOrigin(0.5);
        this.add.text(400, 400, 'Click to Restart', { fontSize: '32px', fill: '#FFF' }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    winGame() {
        this.endGame(true);
    }
}

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
    scene: [GameScene] // Use the new scene class
};

const game = new Phaser.Game(config);