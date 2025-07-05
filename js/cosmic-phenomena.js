// js/cosmic-phenomena.js

/**
 * Manages advanced cosmic phenomena like moving black holes and higher-dimensional topological shapes.
 * This script will interact with the main galaxy-background.js to apply forces.
 */

class CosmicPhenomena {
    constructor(canvas, ctx, width, height, noise2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.noise2D = noise2D; // Perlin noise instance

        // Moving Black Hole Properties
        this.blackHole = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 45, // Slightly larger black hole
            pullStrength: 0.9, // Stronger pull
            vx: 0.5, // Initial velocity for horizontal movement
            vy: 0.3, // Initial velocity for vertical movement
            coronaParticles: [],
            coronaParticlesNum: 250, // More corona particles
            coronaParticleSize: { min: 0.6, max: 2.2 },
            coronaLightSpeed: 0.04,
            initialLightIntensity: 0.15,
            rainbowHueOffset: 0
        };
        this.createCoronaParticles();

        // Higher-Dimensional Topological Shape Properties
        this.topologicalShape = {
            center: { x: this.width * 0.7, y: this.height * 0.3 }, // Initial position
            numVertices: 8, // Number of points defining the shape
            baseRadius: 100, // Base size of the shape
            distortionStrength: 60, // How much Perlin noise distorts the shape
            rotationSpeed: 0.005, // Speed of shape rotation
            vx: -0.2, // Movement velocity for the topological shape
            vy: 0.2,
            lineColor: '#FFD700', // Gold color for the shape
            lineWidth: 1.5,
            fillColor: 'rgba(255, 215, 0, 0.05)', // Faint fill for depth
            offset: Math.random() * 1000 // Unique offset for noise
        };
    }

    /**
     * Resizes the internal dimensions and repositions elements relative to new canvas size.
     * @param {number} width - New canvas width.
     * @param {number} height - New canvas height.
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        // Adjust black hole and topological shape positions proportionally
        this.blackHole.x = width / 2 + (this.blackHole.x - this.width / 2) * (width / this.width);
        this.blackHole.y = height / 2 + (this.blackHole.y - this.height / 2) * (height / this.height);
        this.topologicalShape.center.x = width * 0.7;
        this.topologicalShape.center.y = height * 0.3;
        this.createCoronaParticles(); // Recreate corona particles for new black hole size/position
    }

    /**
     * Creates particles for the black hole's corona.
     * @private
     */
    createCoronaParticles() {
        this.blackHole.coronaParticles = [];
        for (let i = 0; i < this.blackHole.coronaParticlesNum; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = this.getRandom(this.blackHole.radius * 0.8, this.blackHole.radius * 2.5);
            this.blackHole.coronaParticles.push({
                x: this.blackHole.x + dist * Math.cos(angle),
                y: this.blackHole.y + dist * Math.sin(angle),
                radius: this.getRandom(this.blackHole.coronaParticleSize.min, this.blackHole.coronaParticleSize.max),
                alpha: this.getRandom(0.2, 0.7),
                angle: angle,
                distance: dist,
                speed: this.getRandom(0.005, 0.05),
                life: this.getRandom(50, 150)
            });
        }
    }

    /**
     * Draws the black hole and its accretion disk/corona.
     */
    drawBlackHole() {
        const ctx = this.ctx;
        const bh = this.blackHole;

        ctx.save();
        ctx.translate(bh.x, bh.y); // Translate to black hole's current position

        // 1. Draw black hole event horizon (shadow and blur)
        ctx.beginPath();
        ctx.arc(0, 0, bh.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Deeper black for ultimate void
        ctx.shadowBlur = 50; // Increased blur for stronger gravitational lensing effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.fill();
        ctx.shadowBlur = 0;

        // 2. Draw central rainbow cosmic light (inner accretion disk halo)
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bh.radius * 1.6); // Slightly larger halo
        bh.rainbowHueOffset = (bh.rainbowHueOffset + 0.5) % 360; // Faster color shift
        for (let i = 0; i <= 10; i++) {
            const hue = (bh.rainbowHueOffset + i * 36) % 360;
            gradient.addColorStop(i / 10, `hsla(${hue}, 100%, 75%, ${0.15 + 0.7 * (1 - i / 10) * bh.coronaLightIntensity})`); // Brighter and more intense
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, bh.radius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // 3. Draw flickering accretion disk particles
        bh.coronaParticles.forEach(p => {
            p.angle += p.speed;
            p.x = p.distance * Math.cos(p.angle);
            p.y = p.distance * Math.sin(p.angle);

            p.alpha += p.speed * 12; // Faster flickering
            if (p.alpha <= 0.1 || p.alpha >= 1) {
                p.speed = -p.speed;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * bh.coronaLightIntensity, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * bh.coronaLightIntensity})`;
            ctx.fill();

            if (p.life-- <= 0) {
                 // Rebirth particles within a slightly wider range around the black hole
                 const angle = Math.random() * Math.PI * 2;
                 const dist = this.getRandom(bh.radius * 0.8, bh.radius * 2.5);
                 p.x = dist * Math.cos(angle);
                 p.y = dist * Math.sin(angle);
                 p.life = this.getRandom(50, 150);
                 p.alpha = this.getRandom(0.2, 0.7);
                 p.speed = this.getRandom(0.005, 0.05);
                 p.distance = dist;
                 p.angle = angle;
            }
        });
        ctx.restore();

        // Update black hole's light intensity
        bh.coronaLightIntensity += bh.coronaLightSpeed;
        if (bh.coronaLightIntensity <= 0.15 || bh.coronaLightIntensity >= 0.85) { // Adjusted range
            bh.coronaLightSpeed = -bh.coronaLightSpeed;
        }
    }

    /**
     * Updates the black hole's position and velocity.
     */
    updateBlackHole() {
        const bh = this.blackHole;
        bh.x += bh.vx;
        bh.y += bh.vy;

        // Simple bounce off edges, but with some damping
        if (bh.x < bh.radius || bh.x > this.width - bh.radius) {
            bh.vx *= -0.9; // Lose some speed on bounce
            if (bh.x < bh.radius) bh.x = bh.radius;
            if (bh.x > this.width - bh.radius) bh.x = this.width - bh.radius;
        }
        if (bh.y < bh.radius || bh.y > this.height - bh.radius) {
            bh.vy *= -0.9;
            if (bh.y < bh.radius) bh.y = bh.radius;
            if (bh.y > this.height - bh.radius) bh.y = this.height - bh.radius;
        }

        // Apply a subtle Perlin noise to black hole's movement for more organic drift
        const noiseScale = 0.0001; // Very fine scale for subtle drift
        const noiseStrength = 0.05; // Very low strength
        bh.vx += this.noise2D(bh.x * noiseScale, bh.y * noiseScale) * noiseStrength;
        bh.vy += this.noise2D(bh.y * noiseScale, bh.x * noiseScale) * noiseStrength;

        // Ensure velocity doesn't get too high
        const maxVel = 2;
        bh.vx = Math.max(-maxVel, Math.min(maxVel, bh.vx));
        bh.vy = Math.max(-maxVel, Math.min(maxVel, bh.vy));
    }

    /**
     * Draws the higher-dimensional topological shape.
     */
    drawTopologicalShape() {
        const ctx = this.ctx;
        const shape = this.topologicalShape;

        ctx.save();
        ctx.translate(shape.center.x, shape.center.y);
        ctx.rotate(performance.now() * shape.rotationSpeed); // Continuous rotation

        ctx.beginPath();
        for (let i = 0; i < shape.numVertices; i++) {
            const angle = (i / shape.numVertices) * Math.PI * 2;
            // Use Perlin noise to displace vertices, creating a "higher-dimensional" effect
            const noiseFactor = this.noise2D(
                Math.cos(angle) * 0.01 + performance.now() * 0.0001 + shape.offset,
                Math.sin(angle) * 0.01 + performance.now() * 0.0001 + shape.offset
            );
            const r = shape.baseRadius + noiseFactor * shape.distortionStrength;

            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();

        ctx.strokeStyle = shape.lineColor;
        ctx.lineWidth = shape.lineWidth;
        ctx.stroke();

        ctx.fillStyle = shape.fillColor;
        ctx.fill();

        ctx.restore();
    }

    /**
     * Updates the higher-dimensional topological shape's position.
     */
    updateTopologicalShape() {
        const shape = this.topologicalShape;
        shape.center.x += shape.vx;
        shape.center.y += shape.vy;

        // Bounce off canvas edges
        if (shape.center.x < shape.baseRadius || shape.center.x > this.width - shape.baseRadius) {
            shape.vx *= -1;
        }
        if (shape.center.y < shape.baseRadius || shape.center.y > this.height - shape.baseRadius) {
            shape.vy *= -1;
        }

        // Apply a subtle Perlin noise to the shape's overall movement
        const noiseScale = 0.0002;
        const noiseStrength = 0.1;
        shape.vx += this.noise2D(shape.center.x * noiseScale, shape.center.y * noiseScale + shape.offset) * noiseStrength;
        shape.vy += this.noise2D(shape.center.y * noiseScale, shape.center.x * noiseScale + shape.offset) * noiseStrength;
    }

    /**
     * Main update method for all cosmic phenomena.
     */
    update() {
        this.updateBlackHole();
        this.updateTopologicalShape();
    }

    /**
     * Main draw method for all cosmic phenomena.
     */
    draw() {
        this.drawTopologicalShape(); // Draw topological shape first (can be behind black hole)
        this.drawBlackHole(); // Draw black hole on top (should be prominent)
    }

    /**
     * Helper to get a random number within a range.
     * @private
     */
    getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }
}

// Global instance to be used by galaxy-background.js or main.js
let cosmicPhenomenaInstance;

// Listen for DOMContentLoaded to ensure canvas and noise2D are ready
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('galaxy-canvas');
    const ctx = canvas.getContext('2d');
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Ensure noise2D from SimplexNoise is available (already handled in galaxy-background.js)
    // We'll assume it's set globally or passed from main.js/galaxy-background.js
    // For simplicity, directly access it if it's a global var, or pass it from where it's initialized.
    // If noise2D is truly global in galaxy-background.js's scope after DOMContentLoaded, we can use it.
    // Or, better, main.js should orchestrate passing noise2D to both.
    // For now, let's assume it's accessible or re-initialize a new one here if needed (less efficient).
    // For this example, let's pass it from a "main orchestration" function or assume a global `noise2D`
    // which `galaxy-background.js` also initializes and exposes.

    // A safer way would be to have a single `init` function in `main.js` that creates noise2D
    // and passes it to both galaxyBackgroundInstance and cosmicPhenomenaInstance.
    // For the current structure, let's slightly adjust galaxy-background.js to expose `noise2D` or
    // simply create a new SimplexNoise instance here (less ideal but works for demo).
    let localNoise2D;
    if (typeof SimplexNoise !== 'undefined') {
        localNoise2D = new SimplexNoise().noise2D;
    } else {
        console.error("SimplexNoise library not found in cosmic-phenomena.js! Topological shapes will not work as intended.");
        localNoise2D = (x, y) => Math.sin(x * 0.1) * Math.cos(y * 0.1); // Fallback
    }

    cosmicPhenomenaInstance = new CosmicPhenomena(canvas, ctx, width, height, localNoise2D);
});
