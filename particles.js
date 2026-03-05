/**
 * particles.js — Interactive particle network background
 * Particles float gently and connect with lines when close.
 * Mouse interaction: particles near the cursor get attracted/repelled.
 * Responds to theme changes (dark/light) automatically.
 * Fully responsive — adjusts particle count on resize.
 */
(function () {
    'use strict';

    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // ---- Configuration ----
    const CONFIG = {
        // Particle density: 1 particle per N square pixels
        densityDesktop: 12000,
        densityMobile: 20000,
        maxParticles: 80,
        minParticles: 20,
        // Connection
        connectionDistance: 130,
        // Mouse interaction radius
        mouseRadius: 160,
        // Particle properties
        minRadius: 1.2,
        maxRadius: 2.8,
        minSpeed: 0.15,
        maxSpeed: 0.45,
        // Visual
        particleOpacity: 0.5,
        lineOpacity: 0.15,
        // FPS limiter (60fps)
        fpsInterval: 1000 / 60,
    };

    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let width, height;
    let animationId;
    let lastFrameTime = 0;
    let prefersReducedMotion = false;

    // ---- Detect reduced motion ----
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion = motionQuery.matches;
    motionQuery.addEventListener('change', (e) => {
        prefersReducedMotion = e.matches;
        if (prefersReducedMotion) {
            cancelAnimationFrame(animationId);
            ctx.clearRect(0, 0, width, height);
        } else {
            animate(0);
        }
    });

    // ---- Get theme color ----
    function getColor() {
        const isDark = document.documentElement.classList.contains('dark');
        // Use primary color variable, fallback to green
        const style = getComputedStyle(document.documentElement);
        const primary = style.getPropertyValue('--color-primary').trim();
        if (primary) {
            return {
                particle: isDark
                    ? `rgba(${primary}, ${CONFIG.particleOpacity * 0.7})`
                    : `rgba(${primary}, ${CONFIG.particleOpacity})`,
                line: isDark
                    ? `rgba(${primary}, ${CONFIG.lineOpacity * 0.6})`
                    : `rgba(${primary}, ${CONFIG.lineOpacity})`,
            };
        }
        // Fallback
        return {
            particle: isDark ? 'rgba(88, 204, 2, 0.35)' : 'rgba(88, 204, 2, 0.5)',
            line: isDark ? 'rgba(88, 204, 2, 0.09)' : 'rgba(88, 204, 2, 0.15)',
        };
    }

    // ---- Particle class ----
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.radius = CONFIG.minRadius + Math.random() * (CONFIG.maxRadius - CONFIG.minRadius);
            const speed = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }

        update() {
            // Mouse attraction/repulsion
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.mouseRadius && dist > 0) {
                // Gentle attraction
                const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius;
                this.vx += (dx / dist) * force * 0.02;
                this.vy += (dy / dist) * force * 0.02;
            }

            // Dampen speed to prevent runaway particles
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > CONFIG.maxSpeed * 2) {
                this.vx *= 0.98;
                this.vy *= 0.98;
            }

            this.x += this.vx;
            this.y += this.vy;

            // Wrap around edges with padding
            const pad = 10;
            if (this.x < -pad) this.x = width + pad;
            if (this.x > width + pad) this.x = -pad;
            if (this.y < -pad) this.y = height + pad;
            if (this.y > height + pad) this.y = -pad;
        }

        draw(color) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    // ---- Calculate particle count based on screen ----
    function getParticleCount() {
        const area = width * height;
        const isMobile = width < 768;
        const density = isMobile ? CONFIG.densityMobile : CONFIG.densityDesktop;
        const count = Math.floor(area / density);
        return Math.max(CONFIG.minParticles, Math.min(CONFIG.maxParticles, count));
    }

    // ---- Resize handler ----
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        // Adjust particle count
        const targetCount = getParticleCount();
        while (particles.length < targetCount) {
            particles.push(new Particle());
        }
        while (particles.length > targetCount) {
            particles.pop();
        }
    }

    // ---- Draw connections between nearby particles ----
    function drawConnections(colors) {
        const maxDist = CONFIG.connectionDistance;
        const maxDistSq = maxDist * maxDist;

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distSq = dx * dx + dy * dy;

                if (distSq < maxDistSq) {
                    const dist = Math.sqrt(distSq);
                    const opacity = 1 - dist / maxDist;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = colors.line.replace(
                        /[\d.]+\)$/,
                        (parseFloat(colors.line.match(/[\d.]+\)$/)[0]) * opacity).toFixed(3) + ')'
                    );
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }

            // Also draw lines from particles to mouse cursor
            const dx = particles[i].x - mouse.x;
            const dy = particles[i].y - mouse.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxDistSq) {
                const dist = Math.sqrt(distSq);
                const opacity = 1 - dist / maxDist;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = colors.line.replace(
                    /[\d.]+\)$/,
                    (parseFloat(colors.line.match(/[\d.]+\)$/)[0]) * opacity * 1.5).toFixed(3) + ')'
                );
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
    }

    // ---- Animation loop ----
    function animate(timestamp) {
        if (prefersReducedMotion) return;

        animationId = requestAnimationFrame(animate);

        // FPS limiter
        const elapsed = timestamp - lastFrameTime;
        if (elapsed < CONFIG.fpsInterval) return;
        lastFrameTime = timestamp - (elapsed % CONFIG.fpsInterval);

        ctx.clearRect(0, 0, width, height);

        const colors = getColor();

        // Update and draw particles
        for (const p of particles) {
            p.update();
            p.draw(colors.particle);
        }

        // Draw connections
        drawConnections(colors);
    }

    // ---- Event listeners ----
    // Mouse
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    // Touch (mobile) — use first touch point
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    }, { passive: true });

    // Resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 150);
    });

    // ---- Init ----
    resize();
    if (!prefersReducedMotion) {
        animate(0);
    }
})();
