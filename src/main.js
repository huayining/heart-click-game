const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.spritesheet("heart-idle", "assets/sprites/heart-idle.png", {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet("heart-pop", "assets/sprites/heart-pop.png", {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet("sparkle-loop", "assets/sprites/sparkle-loop.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("score-pop", "assets/sprites/score-pop.png", {
      frameWidth: 96,
      frameHeight: 48,
    });
  }

  create() {
    this.scene.start("GameScene");
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.score = 0;
    this.activeHearts = new Set();
  }

  create() {
    this.score = 0;
    this.activeHearts.clear();
    this.createAnimations();
    this.createBackdrop();
    this.createHud();
    this.spawnDecorSparkles();
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.scheduleNextHeart(250);
  }

  createAnimations() {
    this.anims.create({
      key: "heart_idle",
      frames: this.anims.generateFrameNumbers("heart-idle", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "heart_pop",
      frames: this.anims.generateFrameNumbers("heart-pop", { start: 0, end: 3 }),
      frameRate: 14,
      repeat: 0,
    });
    this.anims.create({
      key: "sparkle_loop",
      frames: this.anims.generateFrameNumbers("sparkle-loop", { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: "score_pop",
      frames: this.anims.generateFrameNumbers("score-pop", { start: 0, end: 3 }),
      frameRate: 12,
      repeat: 0,
    });
  }

  createBackdrop() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfff7fb, 0xfff7fb, 0xffe5ef, 0xfff1d6, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < 9; i += 1) {
      const x = 80 + i * 105;
      const y = 72 + ((i * 47) % 360);
      const ring = this.add.circle(x, y, 18 + (i % 3) * 10, 0xffffff, 0.28);
      this.tweens.add({
        targets: ring,
        scale: { from: 0.7, to: 1.35 },
        alpha: { from: 0.08, to: 0.36 },
        duration: 1800 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
  }

  createHud() {
    this.scoreText = this.add
      .text(34, 28, "SCORE 0", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "32px",
        fontStyle: "700",
        color: "#b31346",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setDepth(10);

    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1, to: 1.035 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  spawnDecorSparkles() {
    const points = [
      [168, 108],
      [768, 82],
      [836, 394],
      [228, 422],
      [486, 112],
      [590, 456],
    ];

    points.forEach(([x, y], index) => {
      const sparkle = this.add
        .sprite(x, y, "sparkle-loop")
        .setAlpha(0.72)
        .setScale(0.58 + (index % 2) * 0.16)
        .play("sparkle_loop");

      sparkle.anims.setProgress((index % 4) / 4);
      this.tweens.add({
        targets: sparkle,
        angle: index % 2 === 0 ? 9 : -9,
        duration: 1600 + index * 90,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    });
  }

  scheduleNextHeart(delay = this.nextSpawnDelay()) {
    this.time.delayedCall(delay, () => {
      this.spawnHeart();
      this.scheduleNextHeart();
    });
  }

  nextSpawnDelay() {
    return Phaser.Math.Clamp(900 - this.score * 18, 430, 900);
  }

  spawnHeart() {
    const x = Phaser.Math.Between(96, GAME_WIDTH - 96);
    const y = Phaser.Math.Between(104, GAME_HEIGHT - 82);
    const scale = Phaser.Math.FloatBetween(0.72, 1.08);

    const heart = this.add
      .sprite(x, y, "heart-idle")
      .setScale(scale)
      .setDepth(5)
      .setInteractive(new Phaser.Geom.Circle(64, 64, 58), Phaser.Geom.Circle.Contains)
      .play("heart_idle");

    heart.setData("alive", true);
    this.activeHearts.add(heart);

    this.tweens.add({
      targets: heart,
      y: y - 10,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this.time.delayedCall(1800, () => {
      if (!heart.active || !heart.getData("alive")) {
        return;
      }
      heart.setData("alive", false);
      this.activeHearts.delete(heart);
      this.tweens.add({
        targets: heart,
        alpha: 0,
        scale: scale * 0.72,
        duration: 210,
        ease: "Sine.in",
        onComplete: () => heart.destroy(),
      });
    });
  }

  handlePointerDown(pointer) {
    const target = [...this.activeHearts]
      .filter((heart) => heart.active && heart.getData("alive"))
      .map((heart) => ({
        heart,
        distance: Phaser.Math.Distance.Between(pointer.x, pointer.y, heart.x, heart.y),
        radius: Math.max(118, 128 * heart.scale),
      }))
      .filter(({ distance, radius }) => distance <= radius)
      .sort((a, b) => a.distance - b.distance)[0];

    if (target) {
      this.popHeart(target.heart);
    }
  }

  popHeart(heart) {
    if (!heart.active || !heart.getData("alive")) {
      return;
    }

    const { x, y, scale } = heart;
    heart.setData("alive", false);
    this.activeHearts.delete(heart);
    heart.disableInteractive();
    heart.destroy();

    this.score += 1;
    this.scoreText.setText(`SCORE ${this.score}`);
    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.18, to: 1.03 },
      duration: 230,
      ease: "Back.out",
    });

    const pop = this.add.sprite(x, y, "heart-pop").setScale(scale * 1.08).setDepth(7);
    pop.play("heart_pop");
    pop.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => pop.destroy());

    const scorePop = this.add.sprite(x, y - 72, "score-pop").setScale(0.9).setDepth(8);
    scorePop.play("score_pop");
    this.tweens.add({
      targets: scorePop,
      y: y - 106,
      alpha: { from: 1, to: 0.2 },
      duration: 420,
      ease: "Cubic.out",
      onComplete: () => scorePop.destroy(),
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#fff3f8",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  scene: [PreloadScene, GameScene],
};

new Phaser.Game(config);
