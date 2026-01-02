class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.score = 0;
        this.lives = 3;
        this.gameStarted = false;

        // Brick configuration
        this.brickInfo = {
            width: 75,
            height: 30,
            count: {
                row: 5,
                col: 10
            },
            offset: {
                top: 50,
                left: 60
            },
            padding: 10
        };
    }

    preload() {
        // Dynamically create ball and brick textures
        this.createBallTexture('ball', 0xffffff, 10); // Create a white ball with radius 10
        this.createBrickTexture('brick_blue', 0x0000ff);
        this.createBrickTexture('brick_green', 0x00ff00);
        this.createBrickTexture('brick_red', 0xff0000);
        this.createBrickTexture('brick_yellow', 0xffff00);
        this.createBrickTexture('brick_purple', 0x800080);

        // Load sound assets
        this.load.audio('ballHitPaddle', 'https://cdn.glitch.global/c9c1c385-a7dc-4927-80f0-282137c603f2/paddle_hit.mp3?v=1719972323714');
        this.load.audio('ballHitBrick', 'https://cdn.glitch.global/c9c1c385-a7dc-4927-80f0-282137c603f2/brick_hit.mp3?v=1719972322312');
        this.load.audio('loseLife', 'https://cdn.glitch.global/c9c1c385-a7dc-4927-80f0-282137c603f2/lose_life.mp3?v=1719972325377');
    }
    
    createBallTexture(name, color, radius) {
        if (!this.textures.exists(name)) {
            let graphics = this.make.graphics();
            graphics.fillStyle(color);
            graphics.fillCircle(radius, radius, radius);
            graphics.generateTexture(name, radius * 2, radius * 2);
            graphics.destroy();
        }
    }

    createBrickTexture(name, color) {
        if (!this.textures.exists(name)) {
            let graphics = this.make.graphics();
            graphics.fillStyle(color);
            graphics.fillRect(0, 0, this.brickInfo.width, this.brickInfo.height);
            graphics.generateTexture(name, this.brickInfo.width, this.brickInfo.height);
            graphics.destroy();
        }
    }

    create() {
        this.score = 0;
        this.lives = 3;
        this.gameStarted = false;

        // --- World Physics Setup ---
        // Allow ball to pass through the bottom of the screen for the lose-life condition
        this.physics.world.checkCollision.down = false;

        // --- Create Paddle ---
        this.paddle = this.physics.add.sprite(400, 550, null).setDisplaySize(100, 20);
        this.paddle.setTint(0xffffff); // Make it white
        this.paddle.setImmovable(true);
        this.paddle.setCollideWorldBounds(true);

        // --- Create Ball ---
        this.ball = this.physics.add.image(400, 530, 'ball');
        // *** FIX: Refine physics properties to prevent sticking ***
        // Set the physics body to be a circle
        this.ball.setCircle(this.ball.width / 2);
        // Set perfect bounce, no energy loss on collision
        this.ball.setBounce(1, 1);
        // Remove all friction
        this.ball.setFriction(0, 0);
        // Ensure it collides with the world boundaries (top, left, right)
        this.ball.setCollideWorldBounds(true);


        // --- Create Bricks with different colors per row ---
        this.bricks = this.physics.add.staticGroup(); // Use staticGroup for immovable bricks
        const brickColors = ['brick_red', 'brick_yellow', 'brick_green', 'brick_blue', 'brick_purple'];

        for (let r = 0; r < this.brickInfo.count.row; r++) {
            for (let c = 0; c < this.brickInfo.count.col; c++) {
                const brickX = this.brickInfo.offset.left + c * (this.brickInfo.width + this.brickInfo.padding);
                const brickY = this.brickInfo.offset.top + r * (this.brickInfo.height + this.brickInfo.padding);
                const colorKey = brickColors[r % brickColors.length];
                
                let brick = this.bricks.create(brickX, brickY, colorKey);
                // For staticGroup, you don't need setImmovable(true), but you need to refresh the body
                brick.setOrigin(0, 0).refreshBody();
            }
        }

        // --- UI Text ---
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFF' });
        this.livesText = this.add.text(this.sys.game.config.width - 16, 16, 'Lives: 3', { fontSize: '32px', fill: '#FFF' }).setOrigin(1, 0);
        this.startText = this.add.text(this.physics.world.bounds.width / 2, 400, 'Click to Start', { fontSize: '48px', fill: '#FFF' }).setOrigin(0.5);

        // --- Colliders ---
        this.physics.add.collider(this.ball, this.paddle, this.ballHitPaddle, null, this);
        this.physics.add.collider(this.ball, this.bricks, this.ballHitBrick, null, this);

        // --- Input Handling ---
        this.input.on('pointerdown', () => {
            if (!this.gameStarted) {
                this.startGame();
            }
        }, this);

        this.input.on('pointermove', (pointer) => {
            if (this.gameStarted) {
                this.paddle.x = Phaser.Math.Clamp(pointer.x, this.paddle.width / 2, this.physics.world.bounds.width - this.paddle.width / 2);
            }
        }, this);
    }

    update() {
        if (!this.gameStarted) {
            this.ball.setPosition(this.paddle.x, this.paddle.y - (this.paddle.height / 2) - this.ball.height / 2);
        }

        // Check if ball falls below the world bounds
        if (this.ball.y > this.physics.world.bounds.height + this.ball.height) {
            this.loseLife();
        }
    }

    startGame() {
        this.gameStarted = true;
        this.startText.setVisible(false);
        this.ball.setVelocity(-200, -300); // Increased initial velocity slightly for better feel
    }

    ballHitPaddle(ball, paddle) {
        this.sound.play('ballHitPaddle');
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

    ballHitBrick(ball, brick) {
        this.sound.play('ballHitBrick');
        brick.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        // Make sure ball velocity doesn't drop too low after multiple hits
        const minSpeed = 300;
        const currentSpeed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
        if (currentSpeed < minSpeed) {
            ball.body.velocity.scale(minSpeed / currentSpeed);
        }

        if (this.bricks.countActive() === 0) {
            this.winGame();
        }
    }

    loseLife() {
        // Prevent this from running multiple times if the ball is already off-screen
        if (!this.gameStarted) return;

        this.sound.play('loseLife');
        this.lives--;
        this.livesText.setText('Lives: ' + this.lives);

        if (this.lives === 0) {
            this.gameOver();
        } else {
            this.resetLevel();
        }
    }
    
    resetLevel() {
        this.gameStarted = false;
        // Also stop the ball and reset its position immediately
        this.ball.setVelocity(0, 0);
        this.paddle.setPosition(400, 550);
        this.ball.setPosition(this.paddle.x, this.paddle.y - (this.paddle.height / 2) - this.ball.height / 2);

        this.startText.setText('Click to Continue').setVisible(true);
    }

    gameOver() {
        this.physics.pause();
        this.add.text(this.physics.world.bounds.width / 2, 300, 'Game Over', { fontSize: '64px', fill: '#F00' }).setOrigin(0.5);
        this.add.text(this.physics.world.bounds.width / 2, 400, 'Click to Restart', { fontSize: '32px', fill: '#FFF' }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    winGame() {
        this.physics.pause();
        this.add.text(this.physics.world.bounds.width / 2, 300, 'You Win!', { fontSize: '64px', fill: '#0F0' }).setOrigin(0.5);
        this.add.text(this.physics.world.bounds.width / 2, 400, 'Click to Restart', { fontSize: '32px', fill: '#FFF' }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
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
    scene: [GameScene]
};

const game = new Phaser.Game(config);