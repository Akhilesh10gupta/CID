class FlappyBird extends Phaser.Scene {
  constructor() {
    super('FlappyBird');
    this.pipeCount = 0;
    this.pipeLimit = 20;
  }

  preload() {
    this.load.image('player', 'assets/Player.png');
    this.load.image('pipe', 'assets/pipe.png');
    this.load.audio('flap', 'assets/flap.mp3');
    this.load.audio('crash', 'assets/crash.mp3');
    this.load.audio('bgmusic', 'assets/background_music.mp3');
    this.load.image('background', 'assets/background.png');
  }

  create() {
    this.add.image(400, 300, 'background').setDepth(-1);

    this.player = this.physics.add.sprite(100, 300, 'player').setOrigin(0.5);
    this.player.setScale(0.2);
    this.player.setGravityY(0);

    this.isStarted = false;
    this.isGameOver = false;

    this.bgMusic = this.sound.add('bgmusic', { loop: true, volume: 0.5 });

    this.startText = this.add.text(400, 300, 'Tap To Start', {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5).setDepth(20);

    this.gameOverText = this.add.text(400, 300, 'Game Over\nClick to Restart', {
      fontSize: '48px',
      fill: '#ff0000',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    this.input.on('pointerdown', () => {
      if (!this.isStarted) {
        this.startGame();
      } else if (this.isGameOver) {
        this.scene.restart();
      } else {
        this.flap();
      }
    });

    this.pipes = this.physics.add.group();

    this.score = 0;
    this.scoreText = this.add.text(20, 20, 'Obstacles Passed: 0', {
      fontSize: '24px',
      fill: '#fff',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 4,
    }).setDepth(10);
  }

  startGame() {
    this.isStarted = true;
    this.startText.setVisible(false);
    this.player.setGravityY(600);

    this.bgMusic.play();

    this.pipeTimer = this.time.addEvent({
      delay: 1500,
      callback: this.addPipes,
      callbackScope: this,
      loop: true,
    });
  }

  flap() {
    this.player.setVelocityY(-200);
    this.sound.play('flap', { volume: 0.1 });
  }

  addPipes() {
    if (this.pipeCount >= this.pipeLimit) {
      this.pipeTimer.remove(false);
      this.gameWin();
      return;
    }

    if (!this.isStarted) return;

    const pipeSpeed = -220;
    const gap = 220;
    const minGapTop = 50;
    const maxGapTop = 600 - gap - 50;
    const gapTopY = Phaser.Math.Between(minGapTop, maxGapTop);

    const pipeWidth = 80;

    const topPipe = this.pipes.create(800, 0, 'pipe')
      .setOrigin(0, 0)
      .setDisplaySize(pipeWidth, gapTopY)
      .setImmovable(true)
      .setVelocityX(pipeSpeed)
      .setDepth(2);

    const bottomPipeHeight = 600 - (gapTopY + gap);
    const bottomPipe = this.pipes.create(800, gapTopY + gap + bottomPipeHeight / 2, 'pipe')
      .setOrigin(0, 0.5)
      .setDisplaySize(pipeWidth, bottomPipeHeight)
      .setImmovable(true)
      .setVelocityX(pipeSpeed)
      .setDepth(2);

    this.pipeCount++;
  }

  update() {
    if (!this.isStarted || this.isGameOver) return;

    if (this.player.y > 600 || this.player.y < 0) {
      this.gameOver();
      return;
    }

    this.pipes.getChildren().forEach(pipe => {
      if (pipe.x < this.player.x && !pipe.scored) {
        pipe.scored = true;
        this.score += 0.5;
        this.scoreText.setText('Obstacles Passed: ' + Math.floor(this.score));
      }
      if (pipe.x < -pipe.displayWidth) {
        this.pipes.remove(pipe, true, true);
      }
    });

    this.physics.overlap(this.player, this.pipes, this.gameOver, null, this);
  }

  gameOver() {
    this.isGameOver = true;
    this.sound.play('crash');
    this.player.setTint(0xff0000);
    this.physics.pause();

    if (this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }

    this.gameOverText.setVisible(true);
  }

  gameWin() {
    this.isGameOver = true;
    this.physics.pause();

    if (this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }

    this.gameOverText.setText('You Win!');
    this.gameOverText.setFill('#00ff00');
    this.gameOverText.setVisible(true);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: FlappyBird,
  backgroundColor: '#71c5cf',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container', // optional div container in your HTML
    width: 800,
    height: 600,
  }
};

const game = new Phaser.Game(config);
