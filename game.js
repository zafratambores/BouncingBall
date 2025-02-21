class ParticleSystem {
    constructor(canvas, color) {
        this.particles = [];
        this.canvas = canvas;
        this.color = color;
    }

    emit(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1
            });
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            return p.life > 0;
        });
    }

    draw(ctx) {
        ctx.save();
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.shapes = [];
        this.balls = [];
        this.generateBtn = document.getElementById('generateShapes');
        this.addBallBtn = document.getElementById('addBall');
        this.backgroundImage = null;
        this.backgroundInput = document.getElementById('backgroundImage');
        this.generateBtn.addEventListener('click', () => this.generateRandomShapes());
        this.addBallBtn.addEventListener('click', () => this.addRandomBall());
        this.backgroundInput.addEventListener('change', (e) => this.handleBackgroundImage(e));

        // Set canvas size for 9:16 ratio
        this.canvas.width = 450;
        this.canvas.height = 800;

        // Initialize with one ball
        this.addRandomBall();

        // Particle system
        this.particles = new ParticleSystem(this.canvas, '#00ff88');

        // Mouse control
        this.mouseX = this.canvas.width / 2;
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });

        // Touch control
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
        });

        // Start game loop
        this.gameLoop();
    }

    addRandomBall() {
        const randomColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
        const randomAngle = Math.random() * Math.PI * 2;
        const speed = 10;
        const ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 15,
            speedX: speed * Math.cos(randomAngle),
            speedY: speed * Math.sin(randomAngle),
            color: randomColor
        };
        this.balls.push(ball);
    }

    update() {
        const MIN_SPEED = 5;
        const MAX_SPEED = 15;

        for (const ball of this.balls) {
            // Update ball position
            ball.x += ball.speedX;
            ball.y += ball.speedY;

            // Ball follows mouse on X axis with smooth movement
            const targetX = this.mouseX;
            ball.x += (targetX - ball.x) * 0.05; // Reduced from 0.1 to 0.05 for less interference with natural movement

            // Calculate current speed
            const currentSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);

            // If speed is too low, increase it
            if (currentSpeed < MIN_SPEED) {
                const scale = MIN_SPEED / currentSpeed;
                ball.speedX *= scale;
                ball.speedY *= scale;
            }

            // Bounce off walls with controlled random direction
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvas.width) {
                // Generate random angle between -60 and 60 degrees from the opposite direction
                const baseAngle = ball.x - ball.radius < 0 ? 0 : Math.PI;
                const randomAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 1.5;
                const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
                
                ball.speedX = speed * Math.cos(randomAngle);
                ball.speedY = speed * Math.sin(randomAngle);
                this.particles.emit(ball.x, ball.y, 15);
            }

            // Bounce off top/bottom with controlled random direction
            if (ball.y - ball.radius < 0 || ball.y + ball.radius > this.canvas.height) {
                // Generate random angle between -60 and 60 degrees from the opposite direction
                const baseAngle = ball.y - ball.radius < 0 ? Math.PI / 2 : -Math.PI / 2;
                const randomAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 1.5;
                const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
                
                ball.speedX = speed * Math.cos(randomAngle);
                ball.speedY = speed * Math.sin(randomAngle);
                this.particles.emit(ball.x, ball.y, 15);
            }

            // Check collision with shapes
            this.checkShapeCollision(ball);
        }

        // Update particle system
        this.particles.update();
    }

    generateRandomShapes() {
        this.shapes = [];
        const numShapes = Math.floor(Math.random() * 5) + 3; // Generate 3-7 shapes
        
        for (let i = 0; i < numShapes; i++) {
            const type = Math.random() < 0.5 ? 'rectangle' : 'triangle';
            const shape = {
                type,
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                angle: Math.random() * Math.PI * 2,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
            };
            this.shapes.push(shape);
        }
    }

    checkShapeCollision(ball) {
        const MIN_SPEED = 5;
        const MAX_SPEED = 15;

        for (const shape of this.shapes) {
            if (shape.type === 'rectangle') {
                // Simplified rectangle collision
                const dx = Math.abs(ball.x - (shape.x + shape.width/2));
                const dy = Math.abs(ball.y - (shape.y + shape.height/2));
                
                if (dx < (shape.width/2 + ball.radius) && dy < (shape.height/2 + ball.radius)) {
                    // Calculate reflection angle based on collision point
                    const collisionAngle = Math.atan2(ball.y - (shape.y + shape.height/2), ball.x - (shape.x + shape.width/2));
                    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
                    
                    ball.speedX = speed * Math.cos(collisionAngle);
                    ball.speedY = speed * Math.sin(collisionAngle);
                    
                    this.particles.emit(ball.x, ball.y, 15);
                }
            } else if (shape.type === 'triangle') {
                // Enhanced triangle collision
                const dx = ball.x - shape.x;
                const dy = ball.y - shape.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < ball.radius + shape.width/2) {
                    // Calculate reflection angle based on collision point
                    const collisionAngle = Math.atan2(dy, dx);
                    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
                    
                    ball.speedX = speed * Math.cos(collisionAngle);
                    ball.speedY = speed * Math.sin(collisionAngle);
                    
                    this.particles.emit(ball.x, ball.y, 20);
                }
            }
        }
    }

    handleBackgroundImage(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    this.backgroundImage = img;
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    draw() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background image if exists
        if (this.backgroundImage) {
            this.ctx.globalAlpha = 0.3;
            const scale = Math.max(this.canvas.width / this.backgroundImage.width, this.canvas.height / this.backgroundImage.height);
            const x = (this.canvas.width - this.backgroundImage.width * scale) / 2;
            const y = (this.canvas.height - this.backgroundImage.height * scale) / 2;
            this.ctx.drawImage(this.backgroundImage, x, y, this.backgroundImage.width * scale, this.backgroundImage.height * scale);
            this.ctx.globalAlpha = 1.0;
        }

        // Draw shapes
        for (const shape of this.shapes) {
            this.ctx.save();
            this.ctx.translate(shape.x + shape.width/2, shape.y + shape.height/2);
            this.ctx.rotate(shape.angle);
            
            // Create gradient
            const gradient = this.ctx.createLinearGradient(-shape.width/2, -shape.height/2, shape.width/2, shape.height/2);
            gradient.addColorStop(0, shape.color);
            gradient.addColorStop(1, '#fff');
            
            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = shape.color;
            this.ctx.shadowBlur = 15;
            
            if (shape.type === 'rectangle') {
                this.ctx.fillRect(-shape.width/2, -shape.height/2, shape.width, shape.height);
            } else if (shape.type === 'triangle') {
                this.ctx.beginPath();
                this.ctx.moveTo(-shape.width/2, shape.height/2);
                this.ctx.lineTo(shape.width/2, shape.height/2);
                this.ctx.lineTo(0, -shape.height/2);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }

        // Draw particles
        this.particles.draw(this.ctx);

        // Draw balls with gradient
        for (const ball of this.balls) {
            const gradient = this.ctx.createRadialGradient(
                ball.x - ball.radius/3,
                ball.y - ball.radius/3,
                0,
                ball.x,
                ball.y,
                ball.radius
            );
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, ball.color);

            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Add glow effect
            this.ctx.shadowColor = ball.color;
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});