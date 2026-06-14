const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const LOVE_PASSWORD = "5201314";
const LOVE_MESSAGE = "我爱你，杨芳";
const LOVE_PHOTOS = Array.from({ length: 20 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return `assets/love-photos/love-photo-${number}.jpg`;
});

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
    this.createAnimations();
    this.scene.start("GameScene");
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
}

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.score = 0;
    this.activeHearts = new Set();
    this.passwordPanel = null;
  }

  create() {
    this.score = 0;
    this.activeHearts.clear();
    this.createBackdrop();
    this.createHud();
    this.createLoveLock();
    this.spawnDecorSparkles();
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.scheduleNextHeart(250);
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

  createLoveLock() {
    const lock = this.add
      .text(GAME_WIDTH - 54, 36, "♡", {
        fontFamily: "Georgia, serif",
        fontSize: "36px",
        color: "#b31346",
        stroke: "#ffffff",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(30);

    const domLockButton = document.createElement("button");
    domLockButton.type = "button";
    domLockButton.setAttribute("aria-label", "打开隐藏告白模式");
    Object.assign(domLockButton.style, {
      position: "fixed",
      top: "4px",
      right: "14px",
      width: "84px",
      height: "84px",
      border: "0",
      padding: "0",
      margin: "0",
      background: "transparent",
      cursor: "pointer",
      zIndex: "20",
    });
    domLockButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.showPasswordPanel();
    });
    document.body.appendChild(domLockButton);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => domLockButton.remove());

    const lockHitArea = this.add
      .rectangle(GAME_WIDTH - 54, 36, 84, 84, 0xffffff, 0.001)
      .setDepth(31)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: lock,
      scale: { from: 1, to: 1.12 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    lockHitArea.on("pointerdown", (pointer) => {
      pointer.event?.stopPropagation?.();
      this.showPasswordPanel();
    });
  }

  showPasswordPanel() {
    if (this.passwordPanel) {
      return;
    }

    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x2a0614, 0.46).setOrigin(0).setDepth(80);
    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(81);
    const box = this.add
      .rectangle(0, 0, 430, 430, 0xffffff, 0.94)
      .setStrokeStyle(2, 0xff9fbd, 0.9);
    const title = this.add
      .text(0, -166, "输入爱的密码", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "30px",
        fontStyle: "700",
        color: "#b31346",
      })
      .setOrigin(0.5);
    const hint = this.add
      .text(0, -126, "解锁隐藏告白动画", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "18px",
        color: "#875165",
      })
      .setOrigin(0.5);
    const inputBg = this.add
      .rectangle(0, -78, 250, 50, 0xffedf4, 1)
      .setStrokeStyle(2, 0xffb5c9, 1);
    const valueText = this.add
      .text(0, -78, "", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "26px",
        fontStyle: "700",
        color: "#b31346",
      })
      .setOrigin(0.5);
    const errorText = this.add
      .text(0, -35, "", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "16px",
        color: "#e33f6b",
      })
      .setOrigin(0.5);
    const closeButton = this.add
      .text(178, -174, "X", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "20px",
        fontStyle: "700",
        color: "#8b3854",
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    panel.add([box, title, hint, inputBg, valueText, errorText, closeButton]);
    this.passwordPanel = { overlay, panel, valueText, errorText, password: "" };

    const refresh = () => {
      valueText.setText("•".repeat(this.passwordPanel.password.length));
    };
    const fail = () => {
      errorText.setText("密码不对，再试一次");
      this.passwordPanel.password = "";
      refresh();
      this.tweens.add({
        targets: panel,
        x: { from: GAME_WIDTH / 2 - 10, to: GAME_WIDTH / 2 + 10 },
        duration: 45,
        yoyo: true,
        repeat: 4,
        ease: "Sine.inOut",
        onComplete: () => panel.setX(GAME_WIDTH / 2),
      });
    };
    const submit = () => {
      if (this.passwordPanel.password === LOVE_PASSWORD) {
        this.closePasswordPanel();
        this.scene.start("LoveScene");
      } else {
        fail();
      }
    };
    const appendDigit = (digit) => {
      if (this.passwordPanel.password.length >= 12) {
        return;
      }
      this.passwordPanel.password += digit;
      errorText.setText("");
      refresh();
    };
    const keypad = [];
    const addKey = (x, y, label, action, primary = false) => {
      const key = this.add
        .text(x, y, label, {
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: label.length > 1 ? "20px" : "24px",
          fontStyle: "700",
          color: primary ? "#ffffff" : "#b31346",
          backgroundColor: primary ? "#c91f55" : "#ffe4ee",
          padding: { x: label.length > 1 ? 18 : 25, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      key.on("pointerdown", action);
      keypad.push(key);
    };

    [
      ["1", -96, 18],
      ["2", 0, 18],
      ["3", 96, 18],
      ["4", -96, 70],
      ["5", 0, 70],
      ["6", 96, 70],
      ["7", -96, 122],
      ["8", 0, 122],
      ["9", 96, 122],
    ].forEach(([label, x, y]) => addKey(x, y, label, () => appendDigit(label)));
    addKey(-96, 174, "退格", () => {
      this.passwordPanel.password = this.passwordPanel.password.slice(0, -1);
      refresh();
    });
    addKey(0, 174, "0", () => appendDigit("0"));
    addKey(96, 174, "进入", submit, true);
    panel.add(keypad);

    this.passwordKeyHandler = (event) => {
      if (!this.passwordPanel) {
        return;
      }
      if (/^\d$/.test(event.key) && this.passwordPanel.password.length < 12) {
        appendDigit(event.key);
      } else if (event.key === "Backspace") {
        this.passwordPanel.password = this.passwordPanel.password.slice(0, -1);
        refresh();
      } else if (event.key === "Enter") {
        submit();
      } else if (event.key === "Escape") {
        this.closePasswordPanel();
      }
    };

    window.addEventListener("keydown", this.passwordKeyHandler);
    closeButton.on("pointerdown", () => this.closePasswordPanel());
    overlay.setInteractive().on("pointerdown", () => this.closePasswordPanel());
  }

  closePasswordPanel() {
    if (!this.passwordPanel) {
      return;
    }
    if (this.passwordKeyHandler) {
      window.removeEventListener("keydown", this.passwordKeyHandler);
      this.passwordKeyHandler = null;
    }
    this.passwordPanel.overlay.destroy();
    this.passwordPanel.panel.destroy();
    this.passwordPanel = null;
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

    const heart = this.add.sprite(x, y, "heart-idle").setScale(scale).setDepth(5).play("heart_idle");
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
    if (this.passwordPanel) {
      return;
    }

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

class LoveScene extends Phaser.Scene {
  constructor() {
    super("LoveScene");
    this.photoIndex = 0;
    this.heartTimer = null;
  }

  preload() {
    LOVE_PHOTOS.forEach((path, index) => {
      const key = `love-photo-${index + 1}`;
      if (!this.textures.exists(key)) {
        this.load.image(key, path);
      }
    });
  }

  create() {
    this.photoIndex = 0;
    this.createRomanticBackdrop();
    this.createFloatingHeartStream();
    this.showPhoto(0);
  }

  createRomanticBackdrop() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x250018, 0x4b0b31, 0x7e1f4e, 0x160012, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const glows = [
      [180, 110, 180, 0xff79a8],
      [750, 120, 220, 0xa56cff],
      [490, 430, 260, 0xffc2d7],
    ];
    glows.forEach(([x, y, radius, color], index) => {
      const glow = this.add.circle(x, y, radius, color, 0.08 + index * 0.018).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: glow,
        scale: { from: 0.86, to: 1.14 },
        alpha: { from: 0.06, to: 0.13 },
        duration: 2200 + index * 420,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    });

    for (let i = 0; i < 28; i += 1) {
      const star = this.add
        .sprite(Phaser.Math.Between(36, GAME_WIDTH - 36), Phaser.Math.Between(28, GAME_HEIGHT - 80), "sparkle-loop")
        .setScale(Phaser.Math.FloatBetween(0.18, 0.45))
        .setAlpha(Phaser.Math.FloatBetween(0.15, 0.55))
        .setBlendMode(Phaser.BlendModes.ADD)
        .play("sparkle_loop");
      star.anims.setProgress((i % 4) / 4);
    }
  }

  createFloatingHeartStream() {
    this.heartTimer = this.time.addEvent({
      delay: 210,
      loop: true,
      callback: () => this.spawnFloatingHeart(),
    });
  }

  spawnFloatingHeart() {
    const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
    const heart = this.add
      .sprite(x, GAME_HEIGHT + 42, "heart-idle")
      .setScale(Phaser.Math.FloatBetween(0.18, 0.48))
      .setAlpha(Phaser.Math.FloatBetween(0.34, 0.78))
      .setDepth(20)
      .setTint(Phaser.Utils.Array.GetRandom([0xffffff, 0xff8bb7, 0xffcf6e, 0xd68cff, 0x7ce7ff]))
      .play("heart_idle");

    this.tweens.add({
      targets: heart,
      x: x + Phaser.Math.Between(-70, 70),
      y: Phaser.Math.Between(-90, -30),
      angle: Phaser.Math.Between(-35, 35),
      alpha: 0,
      duration: Phaser.Math.Between(4300, 6800),
      ease: "Sine.out",
      onComplete: () => heart.destroy(),
    });
  }

  showPhoto(index) {
    if (index >= LOVE_PHOTOS.length) {
      this.finishLoveShow();
      return;
    }

    const key = `love-photo-${index + 1}`;
    const texture = this.textures.get(key).getSourceImage();
    const scale = Math.min(690 / texture.width, 390 / texture.height);
    const bgScale = Math.max(GAME_WIDTH / texture.width, GAME_HEIGHT / texture.height);

    const blurredBg = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key)
      .setDisplaySize(texture.width * bgScale, texture.height * bgScale)
      .setAlpha(0)
      .setDepth(1)
      .setTint(0xffcad8);

    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x250018, 0.48).setOrigin(0).setDepth(2).setAlpha(0);
    const shadow = this.add
      .rectangle(GAME_WIDTH / 2 + 18, GAME_HEIGHT / 2 + 28, texture.width * scale + 26, texture.height * scale + 26, 0x000000, 0.22)
      .setDepth(4)
      .setAlpha(0);
    const border = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, texture.width * scale + 20, texture.height * scale + 20, 0xffffff, 0.18)
      .setDepth(5)
      .setAlpha(0);
    const photo = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key)
      .setDisplaySize(texture.width * scale, texture.height * scale)
      .setDepth(6)
      .setAlpha(0);

    const caption = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 38, `${index + 1} / ${LOVE_PHOTOS.length}`, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "18px",
        color: "#ffeaf2",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);

    const tilt = index % 2 === 0 ? -2.6 : 2.6;
    photo.setAngle(-tilt * 0.7);
    border.setAngle(-tilt * 0.7);
    shadow.setAngle(-tilt * 0.7);
    const bgStartScaleX = blurredBg.scaleX;
    const bgStartScaleY = blurredBg.scaleY;
    const photoStartScaleX = photo.scaleX;
    const photoStartScaleY = photo.scaleY;

    this.tweens.add({
      targets: [blurredBg, shade, shadow, border, photo, caption],
      alpha: { from: 0, to: 1 },
      duration: 680,
      ease: "Sine.out",
    });
    this.tweens.add({
      targets: [photo, border, shadow],
      angle: tilt,
      scaleX: (target) => (target === photo ? photoStartScaleX * 1.035 : 1.035),
      scaleY: (target) => (target === photo ? photoStartScaleY * 1.035 : 1.035),
      duration: 3200,
      ease: "Sine.inOut",
    });
    this.tweens.add({
      targets: blurredBg,
      scaleX: bgStartScaleX * 1.06,
      scaleY: bgStartScaleY * 1.06,
      duration: 3900,
      ease: "Sine.inOut",
    });

    this.time.delayedCall(3220, () => {
      this.tweens.add({
        targets: [blurredBg, shade, shadow, border, photo, caption],
        alpha: 0,
        duration: 620,
        ease: "Sine.in",
        onComplete: () => {
          blurredBg.destroy();
          shade.destroy();
          shadow.destroy();
          border.destroy();
          photo.destroy();
          caption.destroy();
          this.showPhoto(index + 1);
        },
      });
    });
  }

  finishLoveShow() {
    if (this.heartTimer) {
      this.heartTimer.delay = 120;
    }

    const finalGlow = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 80, 0xff6fa3, 0.18).setDepth(35).setBlendMode(Phaser.BlendModes.ADD);
    const bigHeart = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, "heart-idle").setScale(0.4).setDepth(40).setAlpha(0).play("heart_idle");

    this.tweens.add({
      targets: finalGlow,
      scale: { from: 0.8, to: 5.3 },
      alpha: { from: 0.12, to: 0.28 },
      duration: 1500,
      ease: "Sine.out",
    });
    this.tweens.add({
      targets: bigHeart,
      alpha: 1,
      scale: { from: 0.4, to: 3.0 },
      duration: 1600,
      ease: "Back.out",
      onComplete: () => this.burstFinalHeart(bigHeart),
    });
  }

  burstFinalHeart(bigHeart) {
    this.tweens.add({
      targets: bigHeart,
      scale: 3.35,
      duration: 260,
      yoyo: true,
      ease: "Sine.inOut",
      onComplete: () => {
        bigHeart.destroy();
        this.spawnColorHeartBurst();
        this.showLoveMessage();
      },
    });
  }

  spawnColorHeartBurst() {
    const colors = [0xff4f8b, 0xffc857, 0x7bdff2, 0xb388ff, 0xff8fab, 0xffffff, 0x8cffc1];
    for (let i = 0; i < 96; i += 1) {
      const angle = (Math.PI * 2 * i) / 96 + Phaser.Math.FloatBetween(-0.1, 0.1);
      const distance = Phaser.Math.Between(120, 460);
      const heart = this.add
        .sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, "heart-idle")
        .setScale(Phaser.Math.FloatBetween(0.12, 0.32))
        .setDepth(50)
        .setTint(colors[i % colors.length])
        .play("heart_idle");

      this.tweens.add({
        targets: heart,
        x: GAME_WIDTH / 2 + Math.cos(angle) * distance,
        y: GAME_HEIGHT / 2 + Math.sin(angle) * distance,
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: Phaser.Math.Between(1800, 3100),
        ease: "Cubic.out",
        onComplete: () => heart.destroy(),
      });
    }
  }

  showLoveMessage() {
    const text = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, LOVE_MESSAGE, {
        fontFamily: "KaiTi, STKaiti, serif",
        fontSize: "58px",
        fontStyle: "700",
        color: "#fff7fb",
        stroke: "#d91f65",
        strokeThickness: 8,
        shadow: { color: "#ff8fb9", blur: 18, fill: true },
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0)
      .setScale(0.76);

    this.tweens.add({
      targets: text,
      alpha: 1,
      scale: 1,
      duration: 1100,
      ease: "Back.out",
    });
    this.tweens.add({
      targets: text,
      y: GAME_HEIGHT / 2 - 8,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
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
  scene: [PreloadScene, GameScene, LoveScene],
};

new Phaser.Game(config);
