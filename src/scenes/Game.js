import { SwingPhysics } from '../lib/SwingPhysics.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x87CEEB);
        this.add.image(512, 384, 'background').setAlpha(0.5);

        this.score = 0;
        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '32px', fill: '#FFF' });
        this.debugText = this.add.text(20, 60, '', { fontSize: '16px', fill: '#FFF' });
        this.deathZone = 700;

        this.physics = new SwingPhysics({
            gravity: 0.6,
            webShootRange: 400,
            maxPullForce: 20,
            pullDuration: 300
        });

        this.webLine = null;
        this.player = this.add.image(512, 384, 'ball').setScale(0.5);
        this.player.velocity = { x: 2, y: 0 };
        this.player.radius = this.player.width / 2;
        this.player.setDepth(10);

        this.anchors = [];
        this.createAnchors();
        this.rangeIndicator = this.add.circle(
            this.player.x,
            this.player.y,
            this.physics.webShootRange,
            0xffffff,
            0.1
        ).setVisible(true);

        this.input.on('pointerdown', this.shootWeb, this);
        this.input.on('pointerup', this.releaseWeb, this);
    }

    createAnchors() {
        const numAnchors = 6;
        const spacing = 1024 / (numAnchors + 1); // +1 for better edge spacing

        for (let i = 0; i < numAnchors; i++) {
            const x = spacing * (i + 1) + Phaser.Math.Between(-20, 20);
            const y = Phaser.Math.Between(150, 250);

            this.createAnchor(x, y);
        }
    }

    createAnchor(x, y) {
        const radius = 15;
        const anchor = this.add.circle(x, y, radius, 0x34495e)
            .setStrokeStyle(2, 0x2c3e50);

        anchor.radius = radius;
        this.anchors.push(anchor);
        return anchor;
    }

    shootWeb(pointer) {
        if (this.physics.isWebAttached) return;

        let closestAnchor = null;
        let closestDistance = Number.MAX_VALUE;

        this.anchors.forEach(anchor => {
            const distance = this.physics.calculateDistance(this.player, anchor);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestAnchor = anchor;
            }
        });

        if (closestAnchor && closestDistance <= this.physics.webShootRange) {
            this.webLine = this.add.line(
                0, 0, this.player.x, this.player.y,
                closestAnchor.x, closestAnchor.y, 0xFFFFFF
            ).setLineWidth(2).setOrigin(0, 0);

            const initialVelocity = this.physics.attachWeb(this.player, closestAnchor);

            if (initialVelocity) {
                this.player.velocity = initialVelocity;
                this.score += 10;
                this.scoreText.setText('Score: ' + this.score);
                this.rangeIndicator.setVisible(false);
            }
        }
    }

    releaseWeb() {
        if (!this.physics.isWebAttached) return;

        if (this.webLine) {
            this.webLine.destroy();
            this.webLine = null;
        }

        this.physics.releaseWeb();
        this.rangeIndicator.setVisible(true);
    }

    update(time, delta) {
        const normalizedDelta = delta / 16.666;

        if (this.physics.isWebAttached) {
            const swingUpdate = this.physics.updateSwinging(this.player, normalizedDelta, delta);

            if (swingUpdate) {
                this.player.x = swingUpdate.position.x;
                this.player.y = swingUpdate.position.y;
                this.player.velocity = swingUpdate.velocity;

                if (this.webLine) {
                    this.webLine.setTo(
                        this.player.x, this.player.y,
                        this.physics.currentAnchor.x, this.physics.currentAnchor.y
                    );
                }
            }
        } else {
            const fallUpdate = this.physics.updateFreeFalling(this.player, normalizedDelta);

            this.player.x = fallUpdate.x;
            this.player.y = fallUpdate.y;
            this.player.velocity = fallUpdate.velocity;
        }

        this.updateRangeIndicator();

        this.handleWorldBoundaries(normalizedDelta);

        if (this.player.y > this.deathZone) {
            this.restart();
        }

        const debugInfo = this.physics.getDebugInfo();
        if (this.physics.isWebAttached) {
            this.debugText.setText(
                `Web Length: ${debugInfo.webLength}\n` +
                `Angular Vel: ${debugInfo.angularVelocity}\n`
            );
        } else {
            this.debugText.setText(
                `Velocity X: ${this.player.velocity.x.toFixed(2)}\n` +
                `Velocity Y: ${this.player.velocity.y.toFixed(2)}\n`
            );
        }
    }

    updateRangeIndicator() {
        if (!this.physics.isWebAttached && this.rangeIndicator.visible) {
            this.rangeIndicator.setPosition(this.player.x, this.player.y);
        }
    }

    handleWorldBoundaries(normalizedDelta) {
        const playerRadius = this.player.displayWidth / 2;

        // Left boundary
        if (this.player.x < playerRadius) {
            this.player.x = playerRadius;
            this.player.velocity.x *= -0.5;
            if (this.physics.isWebAttached) this.releaseWeb();
        }

        // Right boundary
        if (this.player.x > 1024 - playerRadius) {
            this.player.x = 1024 - playerRadius;
            this.player.velocity.x *= -0.5;
            if (this.physics.isWebAttached) this.releaseWeb();
        }
    }

    restart() {
        this.releaseWeb();
        this.scene.restart();
    }
}
