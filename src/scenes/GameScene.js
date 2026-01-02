import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null;
        this.ball = null;
        this.bricks = null;
        this.cursors = null;
        this.score = 0;
        this.scoreText = null;
        this.lives = 3;
        this.livesText = null;
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('paddle', 'assets/paddle.png');
        this.load.image('ball', 'assets/ball.png');
        this.load.image('brick', 'assets/brick.png');
    }

    create() {
        this.add.image(400, 300, 'background');

        // 플레이어 (패들) 설정
        this.player = this.physics.add.sprite(400, 550, 'paddle');
        this.player.setImmovable(true);
        this.player.setCollideWorldBounds(true);

        // 공 설정
        this.ball = this.physics.add.sprite(400, 530, 'ball');
        
        // --- 🐞 버그 수정: 공을 동그랗게 만들고 월드 경계와 충돌 설정 ---
        this.ball.setCircle(this.ball.width / 2); // 물리적 형태를 원으로 설정
        this.ball.setCollideWorldBounds(true);    // 월드 경계와 충돌 활성화
        this.ball.setBounce(1);                   // 100% 탄성으로 튕기도록 설정
        // -----------------------------------------------------------------

        // 벽돌 그룹 설정
        this.bricks = this.physics.add.staticGroup({
            key: 'brick',
            frameQuantity: 50,
            gridAlign: { width: 10, height: 5, cellWidth: 70, cellHeight: 30, x: 85, y: 100 }
        });

        // 충돌 설정
        this.physics.add.collider(this.ball, this.player, this.hitPlayer, null, this);
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        
        // --- 🐞 버그 수정: 위, 왼쪽, 오른쪽 벽은 튕기고 아래는 통과하도록 설정 ---
        this.physics.world.setBoundsCollision(true, true, true, false);
        // ----------------------------------------------------------------------

        // 키보드 입력 설정
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // 공 발사 로직 (스페이스바)
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.ball.body.velocity.y === 0) { // 공이 멈춰있을 때만 발사
                this.ball.setVelocity(-75, -300);
            }
        });
    }

    update() {
        // 플레이어 이동
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-500);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(500);
        } else {
            this.player.setVelocityX(0);
        }

        // 공이 패들 위에 있을 때 따라다니도록
        if (this.ball.body.velocity.y === 0) {
            this.ball.setX(this.player.x);
        }
    }
    
    hitPlayer(ball, player) {
        // 패들과 공이 부딪혔을 때의 로직
        let diff = 0;
        if (ball.x < player.x) {
            diff = player.x - ball.x;
            ball.setVelocityX(-10 * diff);
        } else if (ball.x > player.x) {
            diff = ball.x - player.x;
            ball.setVelocityX(10 * diff);
        } else {
            ball.setVelocityX(2 + Math.random() * 8);
        }
    }

    hitBrick(ball, brick) {
        // 벽돌과 공이 부딪혔을 때의 로직
        brick.disableBody(true, true);
        
        // 여기에 점수 증가 로직 추가 예정
    }
}
