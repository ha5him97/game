// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

// Game state
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    gameRunning: true,
    paused: false
};

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 5,
    color: '#00ffff'
};

// Arrays for game objects
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];

// Input handling
const keys = {};

// Initialize stars for background
function initStars() {
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 2 + 1,
            opacity: Math.random()
        });
    }
}

// Create particle effect
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30,
            maxLife: 30,
            color: color,
            size: Math.random() * 3 + 1
        });
    }
}

// Player class
class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 60;
        this.width = 40;
        this.height = 40;
        this.speed = 5;
        this.color = '#00ffff';
        this.shootCooldown = 0;
    }

    update() {
        // Movement
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.x = Math.max(0, this.x - this.speed);
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.x = Math.min(canvas.width - this.width, this.x + this.speed);
        }
        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            this.y = Math.max(0, this.y - this.speed);
        }
        if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            this.y = Math.min(canvas.height - this.height, this.y + this.speed);
        }

        // Shooting
        if (keys[' '] && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 10;
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
    }

    shoot() {
        bullets.push({
            x: this.x + this.width / 2 - 2,
            y: this.y,
            width: 4,
            height: 10,
            speed: 8,
            color: '#00ffff'
        });
    }

    draw() {
        // Player ship with glow effect
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        
        // Main body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Ship details
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 5, this.y + 5, 30, 30);
        
        // Engine glow
        ctx.fillStyle = '#0080ff';
        ctx.fillRect(this.x + 15, this.y + 35, 10, 5);
        
        ctx.restore();
    }
}

// Enemy class
class Enemy {
    constructor() {
        this.x = Math.random() * (canvas.width - 30);
        this.y = -30;
        this.width = 30;
        this.height = 30;
        this.speed = Math.random() * 2 + 1;
        this.color = '#ff0040';
        this.health = 1;
        this.maxHealth = 1;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        // Enemy ship
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Enemy details
        ctx.fillStyle = '#ff4080';
        ctx.fillRect(this.x + 5, this.y + 5, 20, 20);
        
        ctx.restore();
    }
}

// Game instance
const gamePlayer = new Player();

// Game loop
function gameLoop() {
    if (!gameState.gameRunning || gameState.paused) return;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 17, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw animated background
    drawBackground();

    // Update and draw player
    gamePlayer.update();
    gamePlayer.draw();

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;
        
        // Remove bullets that are off screen
        if (bullet.y < 0) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Draw bullet
        ctx.save();
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.restore();
    }

    // Spawn enemies
    if (Math.random() < 0.02 + gameState.level * 0.005) {
        enemies.push(new Enemy());
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();
        enemy.draw();
        
        // Remove enemies that are off screen
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            gameState.lives--;
            updateUI();
            if (gameState.lives <= 0) {
                gameOver();
            }
            continue;
        }
        
        // Check collision with player
        if (checkCollision(gamePlayer, enemy)) {
            enemies.splice(i, 1);
            gameState.lives--;
            createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff0040', 15);
            updateUI();
            if (gameState.lives <= 0) {
                gameOver();
            }
        }
        
        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            if (checkCollision(bullet, enemy)) {
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                gameState.score += 10;
                createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#00ffff', 20);
                updateUI();
                break;
            }
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        // Draw particle
        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        ctx.restore();
    }

    // Level up
    if (gameState.score > 0 && gameState.score % 100 === 0) {
        gameState.level = Math.floor(gameState.score / 100) + 1;
        updateUI();
    }

    requestAnimationFrame(gameLoop);
}

// Draw animated background
function drawBackground() {
    // Draw moving stars
    for (let star of stars) {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        
        ctx.save();
        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(star.x, star.y, star.size, star.size);
        ctx.restore();
    }
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update UI
function updateUI() {
    scoreElement.textContent = gameState.score;
    livesElement.textContent = gameState.lives;
    levelElement.textContent = gameState.level;
}

// Game over
function gameOver() {
    gameState.gameRunning = false;
    finalScoreElement.textContent = gameState.score;
    gameOverElement.style.display = 'block';
}

// Restart game
function restartGame() {
    gameState = {
        score: 0,
        lives: 3,
        level: 1,
        gameRunning: true,
        paused: false
    };
    
    bullets = [];
    enemies = [];
    particles = [];
    
    gamePlayer.x = canvas.width / 2;
    gamePlayer.y = canvas.height - 60;
    
    gameOverElement.style.display = 'none';
    updateUI();
    gameLoop();
}

// Mobile touch controls
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const shootBtn = document.getElementById('shootBtn');
const pauseBtn = document.getElementById('pauseBtn');

// Touch event handlers
function addTouchListeners() {
    // Directional buttons
    upBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowUp'] = true;
    });
    upBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowUp'] = false;
    });

    downBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowDown'] = true;
    });
    downBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowDown'] = false;
    });

    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = true;
    });
    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = false;
    });

    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = true;
    });
    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = false;
    });

    // Action buttons
    shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[' '] = true;
    });
    shootBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[' '] = false;
    });

    pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.paused = !gameState.paused;
        if (gameState.gameRunning && !gameState.paused) {
            gameLoop();
        }
    });

    // Mouse events for desktop testing
    upBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys['ArrowUp'] = true;
    });
    upBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys['ArrowUp'] = false;
    });

    downBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys['ArrowDown'] = true;
    });
    downBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys['ArrowDown'] = false;
    });

    leftBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = true;
    });
    leftBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = false;
    });

    rightBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = true;
    });
    rightBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys['ArrowRight'] = false;
    });

    shootBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys[' '] = true;
    });
    shootBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys[' '] = false;
    });

    pauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        gameState.paused = !gameState.paused;
        if (gameState.gameRunning && !gameState.paused) {
            gameLoop();
        }
    });
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'p' || e.key === 'P') {
        gameState.paused = !gameState.paused;
        if (gameState.gameRunning && !gameState.paused) {
            gameLoop();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

restartBtn.addEventListener('click', restartGame);

// Prevent space bar from scrolling
window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
    }
});

// Initialize game
function init() {
    initStars();
    updateUI();
    addTouchListeners();
    gameLoop();
}

// Start game when page loads
window.addEventListener('load', init);

// Responsive canvas
function resizeCanvas() {
    const container = document.querySelector('.game-area');
    const containerWidth = container.clientWidth;
    const aspectRatio = 800 / 600;
    
    if (containerWidth < 800) {
        canvas.width = containerWidth - 6; // Account for border
        canvas.height = (containerWidth - 6) / aspectRatio;
    } else {
        canvas.width = 800;
        canvas.height = 600;
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
