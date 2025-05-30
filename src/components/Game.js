import { useEffect } from "react";
import Phaser from "phaser";

function Game() {
  useEffect(() => {
    let boat;
    let cannonballs;
    let bombs;
    let cursors;
    let spaceKey;
    let score = 0;
    let scoreText;
    let water;

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 600 }, debug: false }
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
    }

    function create() {
      // Bakgrunnsvann med tile-effekt
      water = this.add.tileSprite(0, 0, 800, 600, "water").setOrigin(0, 0);

      // Båt
      boat = this.physics.add.sprite(100, 450, "boat").setScale(0.5);
      boat.setCollideWorldBounds(true);

      // Grupper
      cannonballs = this.physics.add.group();
      bombs = this.physics.add.group();

      // Input
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      // Score
      scoreText = this.add.text(16, 16, "Score: 0", {
        fontSize: "20px",
        fill: "#fff"
      });

      // Bombe-spawner
      this.time.addEvent({
        delay: 2000,
        callback: spawnBomb,
        callbackScope: this,
        loop: true
      });

      // Kollisjoner
      this.physics.add.collider(cannonballs, bombs, destroyBomb, null, this);
      this.physics.add.collider(bombs, boat, gameOver, null, this);
    }

    function update(time) {
      // Scroll vannet horisontalt for animasjon
      water.tilePositionX += 0.5;

      // Flyte opp og ned med sinuskurve
      const floatSpeed = 0.005;
      const floatAmplitude = 10;
      boat.y = 450 + Math.sin(time * floatSpeed) * floatAmplitude;

      // Bevegelse venstre/høyre
      if (cursors.left.isDown) {
        boat.setVelocityX(-200);
      } else if (cursors.right.isDown) {
        boat.setVelocityX(200);
      } else {
        boat.setVelocityX(0);
      }

      // Hopp
      if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
        boat.setVelocityY(-300);
      }

      // Skyt
      if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        const cannonball = cannonballs.create(boat.x + 40, boat.y, "cannonball");
        cannonball.setVelocityX(400);
      }

      // Score
      score += 1;
      scoreText.setText("Score: " + Math.floor(score / 10));
    }

    function spawnBomb() {
      const bomb = bombs.create(800, 520, "bomb").setScale(0.5);
      bomb.setVelocityX(-200);
    }

    function destroyBomb(cannonball, bomb) {
      cannonball.destroy();
      bomb.destroy();
    }

    function gameOver() {
      this.physics.pause();
      boat.setTint(0xff0000);
      scoreText.setText("Game Over! Score: " + Math.floor(score / 10));
    }

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="game-container" />;
}

export default Game;
