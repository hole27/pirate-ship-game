import { useEffect } from "react";
import Phaser from "phaser";

function Game() {
  useEffect(() => {
    let boat, cannonballs, bombs, cursors, spaceKey;
    let score = 0;
    let scoreText, highScoreText;
    let water, music;
    let gameOverFlag = false;
    let tryAgainText, gameOverText;

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      backgroundColor: "#87CEEB",
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false }
      },
      scene: {
        preload,
        create,
        update
      }
    };

    const game = new Phaser.Game(config);

    function preload() {
      this.load.image("boat", "/assets/boat.png");
      this.load.image("cannonball", "/assets/cannonball.png");
      this.load.image("bomb", "/assets/bomb.png");
      this.load.image("water", "/assets/water-loop.png");

      // 🎵 Lyd
      this.load.audio("bgmusic", "/assets/bg-music.mp3");

    }

    function create() {
      water = this.add.tileSprite(0, 0, 800, 600, "water").setOrigin(0, 0);

      boat = this.physics.add.sprite(100, 300, "boat").setScale(0.3);
      boat.setCollideWorldBounds(true);

      cannonballs = this.physics.add.group();
      bombs = this.physics.add.group();

      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      scoreText = this.add.text(16, 16, "Score: 0", {
        fontSize: "20px",
        fill: "#fff"
      });

      // 🏆 Highscore fra localStorage
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

      tryAgainText.on("pointerover", () => {
        tryAgainText.setStyle({ fill: "#ffff99", backgroundColor: "#333" });
      });

      tryAgainText.on("pointerout", () => {
        tryAgainText.setStyle({ fill: "#ffffff", backgroundColor: "#000000aa" });
      });

      tryAgainText.on("pointerdown", restartGame);

      this.time.addEvent({
        delay: 2000,
        callback: spawnBomb,
        callbackScope: this,
        loop: true
      });

      this.physics.add.collider(cannonballs, bombs, destroyBomb, null, this);
      this.physics.add.collider(bombs, boat, gameOver, null, this);

      // 🎵 Spill musikk
      music = this.sound.add("bgmusic", { loop: true, volume: 0.4 });
      music.play();
    }

    function update() {
      if (gameOverFlag) {
        if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
          restartGame();
        }
        return;
      }

      water.tilePositionX += 0.5;
      boat.setVelocity(0);

      if (cursors.left.isDown) boat.setVelocityX(-200);
      else if (cursors.right.isDown) boat.setVelocityX(200);

      if (cursors.up.isDown) boat.setVelocityY(-200);
      else if (cursors.down.isDown) boat.setVelocityY(200);

      if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        const cannonball = cannonballs.create(boat.x + 40, boat.y, "cannonball").setScale(0.1);
        cannonball.setVelocityX(400);
      }

      score += 1;
      scoreText.setText("Score: " + Math.floor(score / 10));
    }

    function spawnBomb() {
      const bomb = bombs.create(800, Phaser.Math.Between(100, 550), "bomb").setScale(0.1);
      bomb.setVelocityX(-200);
    }

    function destroyBomb(cannonball, bomb) {
      cannonball.destroy();
      bomb.destroy();
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

      // 🔇 Stopp musikken
      music.stop();
    }

    function restartGame() {
      game.destroy(true);
      window.location.reload();
    }

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="game-container" />;
}

export default Game;
