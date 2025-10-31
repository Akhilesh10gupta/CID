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
    this.add.image(this.scale.width / 2, this.scale.height / 2, 'background')
      .setDepth(-1)
      .setDisplaySize(this.scale.width, this.scale.height);

    this.player = this.physics.add.sprite(100, this.scale.height / 2, 'player').setOrigin(0.5);
    this.player.setScale(0.2);
    this.player.setGravityY(0);

    // Mobile-specific settings
    this.pipeSpeed = isMobile() ? -150 : -220;
    this.pipeGap = isMobile() ? 280 : 220;
    this.playerGravity = isMobile() ? 450 : 600;
    this.flapVelocity = isMobile() ? -150 : -200;

    this.isStarted = false;
    this.isGameOver = false;
    this.hasWon = false;

    this.bgMusic = this.sound.add('bgmusic', { loop: true, volume: 0.5 });

    this.startText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Tap To Start', {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5).setDepth(20);

    this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Game Over\nClick to Restart', {
      fontSize: '40px',
      fill: '#ff0000',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    this.input.on('pointerdown', () => {
      if (!this.isStarted) {
        this.startGame();
      } else if (this.isGameOver || this.hasWon) {
        this.scene.restart();
      } else {
        this.flap();
      }
    });

    this.pipes = this.physics.add.group();
    this.score = 0;
    this.scoreText = this.add.text(20, 20, 'Obstacle Passed: 0', {
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
    this.player.setGravityY(this.playerGravity);
    this.bgMusic.play();

    this.pipeTimer = this.time.addEvent({
      delay: 1500,
      callback: this.addPipes,
      callbackScope: this,
      loop: true,
    });
  }

  flap() {
    this.player.setVelocityY(this.flapVelocity);
    this.sound.play('flap', { volume: 0.1 });
  }

  addPipes() {
    if (this.pipeCount >= this.pipeLimit && !this.hasWon && !this.isGameOver) {
      this.pipeTimer.remove(false);
      this.gameWin();
      return;
    }
    if (!this.isStarted || this.isGameOver || this.hasWon) return;

    const gap = this.pipeGap;
    const minGapTop = 50;
    const maxGapTop = this.scale.height - gap - 50;
    const gapTopY = Phaser.Math.Between(minGapTop, maxGapTop);
    const pipeWidth = 80;
    const spawnX = this.scale.width + 50; // spawn just beyond visible area

    const topPipe = this.pipes.create(spawnX, 0, 'pipe')
      .setOrigin(0, 0)
      .setDisplaySize(pipeWidth, gapTopY)
      .setImmovable(true)
      .setVelocityX(this.pipeSpeed)
      .setDepth(2);

    const bottomPipeHeight = this.scale.height - (gapTopY + gap);
    const bottomPipe = this.pipes.create(spawnX, gapTopY + gap + bottomPipeHeight / 2, 'pipe')
      .setOrigin(0, 0.5)
      .setDisplaySize(pipeWidth, bottomPipeHeight)
      .setImmovable(true)
      .setVelocityX(this.pipeSpeed)
      .setDepth(2);

    this.pipeCount++;
  }

  update() {
    if (!this.isStarted || this.isGameOver || this.hasWon) return;

    if (this.player.y > this.scale.height || this.player.y < 0) {
      this.gameOver();
      return;
    }

    this.pipes.getChildren().forEach(pipe => {
      if (pipe.x < this.player.x && !pipe.scored) {
        pipe.scored = true;
        this.score += 0.5;
        this.scoreText.setText('Obstacle Passed: ' + Math.floor(this.score));
      }
      if (pipe.x < -pipe.displayWidth) {
        this.pipes.remove(pipe, true, true);
      }
    });

    this.physics.overlap(this.player, this.pipes, this.gameOver, null, this);
  }

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.sound.play('crash');
    this.player.setTint(0xff0000);
    this.physics.pause();
    if (this.bgMusic.isPlaying) this.bgMusic.stop();
    this.gameOverText.setVisible(true);
  }

  gameWin() {
    if (this.hasWon) return;
    this.hasWon = true;
    this.physics.pause();
    if (this.bgMusic.isPlaying) this.bgMusic.stop();
    this.gameOverText.setText('You Win!');
    this.gameOverText.setFill('#00ff00');
    this.gameOverText.setVisible(true);
  }
}

// Utility for device detection
function isMobile() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iphone|ipad|ipod|iemobile|blackberry|opera mini/i.test(ua.toLowerCase());
}

// Phaser game configuration with scale mode
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#71c5cf',
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: FlappyBird,
  scale: {
    mode: isMobile() ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  }
};

const game = new Phaser.Game(config);
