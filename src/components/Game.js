// Pirate Game with Directional Firing and Enemy Attacks
import { useEffect } from "react";
import Phaser from "phaser";

function Game() {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      backgroundColor: "#87CEEB",
      scene: [StartScene, MainScene],
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false }
      }
    };

    new Phaser.Game(config);

    function StartScene() {
      Phaser.Scene.call(this, { key: "StartScene" });
    }
    StartScene.prototype = Object.create(Phaser.Scene.prototype);
    StartScene.prototype.constructor = StartScene;

    StartScene.prototype.preload = function () {
      this.load.image("water", "/assets/water-loop.png");
      this.load.audio("bgmusic", "/assets/bg-music.mp3");
    };

    StartScene.prototype.create = function () {
      this.add.tileSprite(0, 0, 800, 600, "water").setOrigin(0, 0);
      this.add.text(400, 100, "Pirate Ship Game", {
        fontSize: "48px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 6
      }).setOrigin(0.5);

      this.add.text(400, 200, "Arrow keys to move", {
        fontSize: "20px",
        fill: "#fff"
      }).setOrigin(0.5);
      this.add.text(400, 230, "Space = Shoot", {
        fontSize: "20px",
        fill: "#fff"
      }).setOrigin(0.5);
      this.add.text(400, 260, "Q = Flip Up/Down | E = Flip Left/Right", {
        fontSize: "18px",
        fill: "#ffff99"
      }).setOrigin(0.5);

      const startBtn = this.add.text(400, 350, "Start Game", {
        fontSize: "28px",
        fill: "#ffffff",
        backgroundColor: "#000000aa",
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive();

      startBtn.on("pointerover", () => startBtn.setStyle({ fill: "#ffff99" }));
      startBtn.on("pointerout", () => startBtn.setStyle({ fill: "#ffffff" }));
      startBtn.on("pointerdown", () => this.scene.start("MainScene"));
    };

    function MainScene() {
      Phaser.Scene.call(this, { key: "MainScene" });
    }
    MainScene.prototype = Object.create(Phaser.Scene.prototype);
    MainScene.prototype.constructor = MainScene;

    let boat, cannonballs, bombs, enemyShips, enemyCannonballs;
    let cursors, spaceKey, keyQ, keyE;
    let score = 0, scoreText, highScoreText;
    let water, music;
    let gameOverFlag = false;
    let tryAgainText, gameOverText;
    let fireDirection = "right";

    MainScene.prototype.preload = function () {
      this.load.image("boat", "/assets/boat.png");
      this.load.image("cannonball", "/assets/cannonball.png");
      this.load.image("bomb", "/assets/bomb.png");
      this.load.image("water", "/assets/water-loop.png");
      this.load.image("explosion", "/assets/explosion.png");
      this.load.image("enemy1", "/assets/enemy1.png");
      this.load.image("enemy2", "/assets/enemy2.png");
      this.load.audio("bgmusic", "/assets/bg-music.mp3");
    };

    MainScene.prototype.create = function () {
      water = this.add.tileSprite(0, 0, 800, 600, "water").setOrigin(0, 0);

      boat = this.physics.add.sprite(100, 300, "boat").setScale(0.2);
      boat.setCollideWorldBounds(true);
      boat.body.setSize(boat.width * 0.8, boat.height * 0.8);
      boat.setOffset(10, 10);

      cannonballs = this.physics.add.group();
      bombs = this.physics.add.group();
      enemyShips = this.physics.add.group();
      enemyCannonballs = this.physics.add.group();

      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

      scoreText = this.add.text(16, 16, "Score: 0", {
        fontSize: "20px",
        fill: "#fff"
      });

      const savedHigh = localStorage.getItem("pirateHighscore") || 0;
      highScoreText = this.add.text(16, 40, `Highscore: ${savedHigh}`, {
        fontSize: "18px",
        fill: "#ffff99"
      });

      gameOverText = this.add.text(400, 200, "Game Over", {
        fontSize: "48px",
        fill: "#ff4444",
        stroke: "#000",
        strokeThickness: 6
      }).setOrigin(0.5).setVisible(false);

      tryAgainText = this.add.text(400, 300, "Try Again", {
        fontSize: "28px",
        fill: "#ffffff",
        backgroundColor: "#000000aa",
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive().setVisible(false);

      tryAgainText.on("pointerover", () => tryAgainText.setStyle({ fill: "#ffff99", backgroundColor: "#333" }));
      tryAgainText.on("pointerout", () => tryAgainText.setStyle({ fill: "#ffffff", backgroundColor: "#000000aa" }));
      tryAgainText.on("pointerdown", () => restartGame.call(this));

      music = this.sound.add("bgmusic", { loop: true, volume: 0.4 });
      music.play();

      this.time.addEvent({ delay: 2000, callback: spawnBomb, callbackScope: this, loop: true });
      this.time.addEvent({ delay: 4000, callback: spawnEnemy, callbackScope: this, loop: true });

      this.physics.add.collider(cannonballs, bombs, destroyBomb, null, this);
      this.physics.add.collider(bombs, boat, gameOver, null, this);
      this.physics.add.collider(enemyCannonballs, boat, gameOver, null, this);
      this.physics.add.collider(cannonballs, enemyCannonballs, destroyBothBullets, null, this);
    };

    MainScene.prototype.update = function () {
      if (gameOverFlag) {
        if (Phaser.Input.Keyboard.JustDown(spaceKey)) restartGame.call(this);
        return;
      }

      water.tilePositionX += 0.5;
      boat.setVelocity(0);

      if (cursors.left.isDown) boat.setVelocityX(-200);
      else if (cursors.right.isDown) boat.setVelocityX(200);
      if (cursors.up.isDown) boat.setVelocityY(-200);
      else if (cursors.down.isDown) boat.setVelocityY(200);

      if (Phaser.Input.Keyboard.JustDown(keyE)) {
        fireDirection = fireDirection === "right" ? "left" : "right";
      }
      if (Phaser.Input.Keyboard.JustDown(keyQ)) {
        fireDirection = fireDirection === "up" ? "down" : "up";
      }

      if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        const cannonball = cannonballs.create(boat.x, boat.y, "cannonball").setScale(0.1);
        if (fireDirection === "right") cannonball.setVelocityX(400);
        else if (fireDirection === "left") cannonball.setVelocityX(-400);
        else if (fireDirection === "up") cannonball.setVelocityY(-400);
        else if (fireDirection === "down") cannonball.setVelocityY(400);
      }

      score += 1;
      scoreText.setText("Score: " + Math.floor(score / 10));
    };

    function spawnBomb() {
      const bomb = bombs.create(800, Phaser.Math.Between(100, 550), "bomb").setScale(0.08);
      bomb.body.setCircle(20);
      bomb.setVelocityX(-200);
    }

    function spawnEnemy() {
      const side = Phaser.Math.Between(0, 2);
      let x, y, vx, vy;
      const texture = Phaser.Math.Between(0, 1) === 0 ? "enemy1" : "enemy2";

      if (side === 0) { x = 850; y = Phaser.Math.Between(100, 500); vx = -150; vy = 0; }
      else if (side === 1) { x = -50; y = Phaser.Math.Between(100, 500); vx = 150; vy = 0; }
      else { x = Phaser.Math.Between(100, 700); y = -50; vx = 0; vy = 150; }

      const enemy = enemyShips.create(x, y, texture).setScale(0.2);
      enemy.setVelocity(vx, vy);

      this.time.delayedCall(1000, () => {
        if (!enemy.active) return;
        const bullet = enemyCannonballs.create(enemy.x, enemy.y, "cannonball").setScale(0.1);
        this.physics.moveToObject(bullet, boat, 200);
      }, [], this);
    }

    function destroyBomb(cannonball, bomb) {
      cannonball.destroy();
      bomb.destroy();
    }

    function destroyBothBullets(playerBall, enemyBall) {
      playerBall.destroy();
      enemyBall.destroy();
    }

    function gameOver() {
      this.physics.pause();
      boat.setTint(0xff0000);
      gameOverFlag = true;

      const finalScore = Math.floor(score / 10);
      const currentHigh = parseInt(localStorage.getItem("pirateHighscore") || 0);
      if (finalScore > currentHigh) {
        localStorage.setItem("pirateHighscore", finalScore);
        highScoreText.setText(`Highscore: ${finalScore}`);
      }

      scoreText.setText(`Score: ${finalScore}`);
      gameOverText.setVisible(true);
      tryAgainText.setVisible(true);
      this.add.image(boat.x, boat.y, "explosion").setScale(0.3);
      this.cameras.main.shake(500, 0.01);

      if (music && music.isPlaying) music.stop();
    }

    function restartGame() {
      this.scene.restart();
      score = 0;
      gameOverFlag = false;
    }
  }, []);

  return <div id="game-container" />;
}

export default Game;
