// Game state management
const GameStates = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameover',
    SCORES: 'scores'
};

class FallingFoodGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = GameStates.MENU;
        
        // Detect version based on URL
        this.version = this.detectVersion();
        console.log(`🎮 Game version detected: ${this.version}`);
        
        // Set proper canvas dimensions first
        this.initializeCanvas();
        
        // Game variables
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameSpeed = 0.7; // Start slower
        this.lastTime = 0;
        
        // Player (created after canvas is sized)
        this.player = {
            x: this.canvas.width / 2 - 75, // Adjusted for 3x size
            y: this.canvas.height - 200, // Adjusted for taller canvas
            width: 150, // 3x the original 50
            height: 150, // 3x the original 50
            speed: 8,
            color: '#4CAF50',
            state: 'idle', // idle, walking, eating
            animationFrame: 0,
            animationTimer: 0,
            animationSpeed: 200, // milliseconds per frame (default for idle/eating)
            walkingAnimationSpeed: 100, // faster animation for walking
            facingRight: true, // Track which direction player is facing
            eatingStartTime: 0 // Track when eating animation started
        };
        
        // Load sprites
        this.sprites = {
            idle: [],
            walking: [],
            eat: [],
            hit: []
        };
        this.spritesLoaded = {
            idle: false,
            walking: false,
            eat: false,
            hit: false
        };
        this.loadSprites();
        
        // Falling objects
        this.fallingObjects = [];
        this.objectSpawnRate = 0.004; // Even less food spawning
        this.badFoodChance = 0.2; // 20% chance for bad food initially
        
        // Food images
        this.goodFoodImages = [];
        this.badFoodImages = [];
        this.foodImagesLoaded = false;
        this.loadFoodImages();
        
        // Background texture
        this.backgroundTexture = null;
        this.loadBackgroundTexture();
        
        // Input handling
        this.keys = {};
        this.setupEventListeners();
        this.setupUI();
        
        // High scores
        this.highScores = this.loadHighScores();
        this.updateHighScoresDisplay();
    }
    
    detectVersion() {
        // Check URL path for version
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        
        console.log('Full URL:', window.location.href);
        console.log('Pathname:', path);
        console.log('Search:', search);
        console.log('Hash:', hash);
        
        // Check multiple ways the version might be specified
        if (path.includes('rhen') || search.includes('rhen') || hash.includes('rhen')) {
            console.log('Detected RHEN version');
            return 'rhen';
        } else if (path.includes('sofia') || search.includes('sofia') || hash.includes('sofia')) {
            console.log('Detected SOFIA version');
            return 'sofia';
        } else {
            // Default to sofia for root or other paths
            console.log('Using default SOFIA version');
            return 'sofia';
        }
    }
    
    initializeCanvas() {
        // Check if we're on mobile
        const isMobile = window.innerWidth <= 767;
        
        if (isMobile) {
            // Mobile: Use full viewport dimensions
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 140; // Account for UI (60px) + controls (80px)
        } else {
            // Desktop: Use fixed size
            this.canvas.width = 800;
            this.canvas.height = 700;
        }
        
        console.log('Canvas initialized:', this.canvas.width, 'x', this.canvas.height, isMobile ? '(mobile)' : '(desktop)');
    }
    
    loadSprites() {
        // Get version-specific folder names
        const idleFolder = this.version === 'rhen' ? 'rhenidle' : 'idle';
        const runningFolder = this.version === 'rhen' ? 'rhenRunning' : 'Running';
        const eatFolder = this.version === 'rhen' ? 'rheneat' : 'eat';
        const cryFolder = this.version === 'rhen' ? 'cryrhen' : 'cry';
        
        console.log(`Loading ${this.version} sprites from: ${idleFolder}, ${runningFolder}, ${eatFolder}, ${cryFolder}`);
        
        // Load idle sprites
        let idleLoaded = 0;
        const idleTotal = 2;
        for (let i = 1; i <= idleTotal; i++) {
            const img = new Image();
            img.onload = () => {
                idleLoaded++;
                if (idleLoaded === idleTotal) {
                    this.spritesLoaded.idle = true;
                }
            };
            img.src = `${idleFolder}/frame-${i}.png`;
            this.sprites.idle.push(img);
        }
        
        // Load walking sprites
        let walkingLoaded = 0;
        const walkingTotal = 6;
        for (let i = 1; i <= walkingTotal; i++) {
            const img = new Image();
            img.onload = () => {
                walkingLoaded++;
                if (walkingLoaded === walkingTotal) {
                    this.spritesLoaded.walking = true;
                }
            };
            // Use different naming convention for different versions
            if (this.version === 'rhen') {
                img.src = `${runningFolder}/frame-${i}.png`;
            } else {
                img.src = `${runningFolder}/frame-${i}.1.png`; // Sofia uses .1.png format
            }
            this.sprites.walking.push(img);
        }
        
         // Load eating sprite
         console.log(`Loading ${this.version} eating sprite...`);
         const eatImg = new Image();
         eatImg.onload = () => {
             this.spritesLoaded.eat = true;
             console.log('✅ Eating sprite loaded successfully!');
             console.log(`Eating sprite dimensions: ${eatImg.width}x${eatImg.height}`);
         };
         eatImg.onerror = () => {
             console.error(`❌ FAILED to load eating sprite: ${eatFolder}/frame-1.png`);
         };
         eatImg.src = `${eatFolder}/frame-1.png`;
         this.sprites.eat.push(eatImg);
        
        // Load hit/cry sprites
        let hitLoaded = 0;
        const hitTotal = this.version === 'rhen' ? 3 : 3; // Both versions have 3 frames
        
        console.log(`Loading ${this.version} cry sprites from ${cryFolder}`);
        
        if (this.version === 'rhen') {
            // Rhen version: frame-1.png, frame-2.png, frame-3.png
            for (let i = 1; i <= 3; i++) {
                const img = new Image();
                img.onload = () => {
                    hitLoaded++;
                    console.log(`Rhen cry sprite ${i} loaded (${hitLoaded}/${hitTotal})`);
                    if (hitLoaded === hitTotal) {
                        this.spritesLoaded.hit = true;
                        console.log('All Rhen cry sprites loaded!');
                    }
                };
                img.onerror = () => {
                    console.log(`Failed to load Rhen cry sprite ${i}: ${cryFolder}/frame-${i}.png`);
                };
                img.src = `${cryFolder}/frame-${i}.png`;
                this.sprites.hit.push(img);
            }
        } else {
            // Sofia version: frame-1.png, frame-2.png, frame 3.png (note space in frame 3)
            for (let i = 1; i <= 2; i++) {
                const img = new Image();
                img.onload = () => {
                    hitLoaded++;
                    console.log(`Sofia cry sprite ${i} loaded (${hitLoaded}/${hitTotal})`);
                    if (hitLoaded === hitTotal) {
                        this.spritesLoaded.hit = true;
                        console.log('All Sofia cry sprites loaded!');
                    }
                };
                img.onerror = () => {
                    console.log(`Failed to load Sofia cry sprite ${i}: ${cryFolder}/frame-${i}.png`);
                };
                img.src = `${cryFolder}/frame-${i}.png`;
                this.sprites.hit.push(img);
            }
            
            // Load frame 3.png (note the space in filename for Sofia)
            const img3 = new Image();
            img3.onload = () => {
                hitLoaded++;
                console.log(`Sofia cry sprite 3 loaded (${hitLoaded}/${hitTotal})`);
                if (hitLoaded === hitTotal) {
                    this.spritesLoaded.hit = true;
                    console.log('All Sofia cry sprites loaded!');
                }
            };
            img3.onerror = () => {
                console.log('Failed to load Sofia cry sprite 3: cry/frame 3.png');
            };
            img3.src = `${cryFolder}/frame 3.png`;
            this.sprites.hit.push(img3);
        }
    }
    
    loadFoodImages() {
        // Get version-specific food folder names
        const goodFoodFolder = this.version === 'rhen' ? 'rhengoodfood' : 'goodfood';
        const badFoodFolder = this.version === 'rhen' ? 'rhenbadfood' : 'badfood';
        
        console.log(`Loading ${this.version} food images from: ${goodFoodFolder}, ${badFoodFolder}`);

        // Load good food images
        let goodFoodLoaded = 0;
        const goodFoodTotal = this.version === 'rhen' ? 3 : 3; // Both have 3 images
        for (let i = 1; i <= goodFoodTotal; i++) {
            const img = new Image();
            img.onload = () => {
                goodFoodLoaded++;
                console.log(`${this.version} good food ${i} loaded (${goodFoodLoaded}/${goodFoodTotal})`);
                this.checkAllFoodImagesLoaded();
            };
            img.onerror = () => {
                console.error(`Failed to load ${this.version} good food ${i}: ${goodFoodFolder}/good${i}.png`);
            };
            img.src = `${goodFoodFolder}/good${i}.png`;
            this.goodFoodImages.push(img);
        }
        
        // Load bad food images
        let badFoodLoaded = 0;
        const badFoodTotal = this.version === 'rhen' ? 1 : 3; // Rhen has 1, Sofia has 3
        for (let i = 1; i <= badFoodTotal; i++) {
            const img = new Image();
            img.onload = () => {
                badFoodLoaded++;
                console.log(`${this.version} bad food ${i} loaded (${badFoodLoaded}/${badFoodTotal})`);
                this.checkAllFoodImagesLoaded();
            };
            img.onerror = () => {
                console.error(`Failed to load ${this.version} bad food ${i}: ${badFoodFolder}/bad${i}.png`);
            };
            img.src = `${badFoodFolder}/bad${i}.png`;
            this.badFoodImages.push(img);
        }
    }
    
    checkAllFoodImagesLoaded() {
        const goodFoodReady = this.goodFoodImages.every(img => img.complete);
        const badFoodReady = this.badFoodImages.every(img => img.complete);
        
        if (goodFoodReady && badFoodReady && !this.foodImagesLoaded) {
            this.foodImagesLoaded = true;
            console.log('✅ All food images loaded successfully!');
            console.log('Good food images:', this.goodFoodImages.length);
            console.log('Bad food images:', this.badFoodImages.length);
        }
    }
    
    loadBackgroundTexture() {
        console.log('Loading background texture from local bg folder...');
        
        const img = new Image();
        img.onload = () => {
            this.backgroundTexture = img;
            console.log('✅ Background texture loaded successfully!');
            console.log(`Background texture dimensions: ${img.width}x${img.height}`);
        };
        img.onerror = () => {
            console.error('❌ Failed to load background texture: bg/bg.jpg');
            console.log('Game will continue with gradient background');
        };
        img.src = 'bg/bg.jpg';
    }
    
    testEatingAnimation() {
        console.log('🧪 Starting eating animation test...');
        console.log('Current player state:', this.player.state);
        
        // Force eating state for testing
        this.player.state = 'eating';
        this.player.animationFrame = 0;
        this.player.animationTimer = 0;
        
        console.log('Set player to eating state for 3 seconds');
        console.log('Available eating sprites:', this.sprites.eat.length);
        
        // Manual frame cycling test
        let testFrame = 0;
        const manualFrameTest = setInterval(() => {
            if (this.player.state === 'eating') {
                this.player.animationFrame = testFrame % this.sprites.eat.length;
                console.log(`🔄 Manual frame test: Setting frame to ${this.player.animationFrame}`);
                testFrame++;
            }
        }, 500); // Change frame every 500ms for testing
        
        // Reset after test
        setTimeout(() => {
            console.log('🧪 Test complete, resetting to idle');
            this.player.state = 'idle';
            clearInterval(manualFrameTest);
        }, 3000);
    }
    
    startForcedEatingAnimation() {
        console.log('🔧 Starting simple eating animation (single frame)');
        
        // Clear any existing eating timer
        if (this.eatingTimer) {
            clearTimeout(this.eatingTimer);
        }
        
        // Set to frame 0 (the only eating frame)
        this.player.animationFrame = 0;
        console.log('🔧 Showing eating frame for 400ms');
        
        // Show eating frame for a brief duration, then return to idle
        this.eatingTimer = setTimeout(() => {
            if (this.player.state === 'eating') {
                console.log('🔧 Eating animation complete, returning to idle');
                this.player.state = 'idle';
            }
        }, 150); // Show eating frame for 400ms
    }
    
    startDramaticGameOver() {
        console.log('🎬 Starting dramatic game over sequence');
        this.dramaticGameOverInProgress = true;
        
        // Keep player in crying state
        this.player.state = 'hit';
        this.player.animationFrame = 0;
        this.player.animationTimer = 0;
        
        // Start continuous crying animation
        this.startContinuousCrying();
        
        // Start zoom effect
        this.startZoomEffect();
        
        // Show big game over text after a delay
        setTimeout(() => {
            this.showBigGameOverText();
        }, 1500);
        
        // Actually end the game after the dramatic sequence
        setTimeout(() => {
            this.gameOver();
        }, 4000);
    }
    
    startContinuousCrying() {
        // Clear any existing crying animation
        if (this.continuousCryingInterval) {
            clearInterval(this.continuousCryingInterval);
        }
        
        // Keep cycling through crying frames continuously
        this.continuousCryingInterval = setInterval(() => {
            if (this.player.state === 'hit' && this.sprites.hit.length > 0) {
                this.player.animationFrame = (this.player.animationFrame + 1) % this.sprites.hit.length;
            }
        }, 200); // Cycle through crying frames every 200ms
    }
    
    startZoomEffect() {
        console.log('🔍 Starting zoom effect');
        let zoomLevel = 1;
        const maxZoom = 2.5;
        const zoomSpeed = 0.02;
        
        this.zoomInterval = setInterval(() => {
            if (zoomLevel < maxZoom) {
                zoomLevel += zoomSpeed;
                
                // Apply zoom transform to canvas
                const canvas = document.getElementById('game-canvas');
                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                
                // Calculate transform origin as percentage
                const originX = (playerCenterX / this.canvas.width) * 100;
                const originY = (playerCenterY / this.canvas.height) * 100;
                
                canvas.style.transformOrigin = `${originX}% ${originY}%`;
                canvas.style.transform = `scale(${zoomLevel})`;
                canvas.style.transition = 'transform 0.1s ease-out';
            }
        }, 50);
    }
    
    showBigGameOverText() {
        console.log('💥 Showing big GAME OVER text');
        
        // Set up canvas-based game over text
        this.gameOverTextActive = true;
        this.gameOverTextTime = 0;
        this.gameOverTextDuration = 2500; // Show for 2.5 seconds
    }
    
    showLevelUpAnimation() {
        console.log('🎉 Showing level up animation');
        
        // Set up canvas text rendering for level up
        this.levelUpAnimationActive = true;
        this.levelUpAnimationTime = 0;
        this.levelUpAnimationDuration = 1000; // Show for 1 second (shorter)
        
        console.log(`Level up animation will show for ${this.levelUpAnimationDuration}ms`);
        
        // Clear animation after duration
        setTimeout(() => {
            this.levelUpAnimationActive = false;
            console.log('Level up animation complete');
        }, this.levelUpAnimationDuration);
    }
    
    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });
        
        // Prevent arrow key scrolling
        document.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.initializeCanvas();
            // Update player position to stay centered
            this.player.x = this.canvas.width / 2 - this.player.width / 2;
        });
        
        // Mobile controls
        this.setupMobileControls();
    }
    
    setupUI() {
        // Menu buttons
        document.getElementById('play-button').addEventListener('click', () => this.startGame());
        document.getElementById('scores-button').addEventListener('click', () => this.showScores());
        document.getElementById('back-to-menu').addEventListener('click', () => this.showMenu());
        
        // Game over buttons
        document.getElementById('play-again-button').addEventListener('click', () => this.startGame());
        document.getElementById('menu-button').addEventListener('click', () => this.showMenu());
        document.getElementById('save-score').addEventListener('click', () => this.saveHighScore());
        
        // Enter key for name input
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveHighScore();
            }
        });
    }
    
    setupMobileControls() {
        // Left button
        const leftButton = document.getElementById('move-left');
        const rightButton = document.getElementById('move-right');
        
        // Touch/click events for left button
        leftButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['arrowleft'] = true;
            this.keys['a'] = true;
        });
        
        leftButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['arrowleft'] = false;
            this.keys['a'] = false;
        });
        
        leftButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.keys['arrowleft'] = true;
            this.keys['a'] = true;
        });
        
        leftButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.keys['arrowleft'] = false;
            this.keys['a'] = false;
        });
        
        // Touch/click events for right button
        rightButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['arrowright'] = true;
            this.keys['d'] = true;
        });
        
        rightButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['arrowright'] = false;
            this.keys['d'] = false;
        });
        
        rightButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.keys['arrowright'] = true;
            this.keys['d'] = true;
        });
        
        rightButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.keys['arrowright'] = false;
            this.keys['d'] = false;
        });
        
        // Prevent context menu on mobile buttons
        leftButton.addEventListener('contextmenu', (e) => e.preventDefault());
        rightButton.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle touch leave events (when finger moves off button)
        leftButton.addEventListener('touchleave', (e) => {
            this.keys['arrowleft'] = false;
            this.keys['a'] = false;
        });
        
        rightButton.addEventListener('touchleave', (e) => {
            this.keys['arrowright'] = false;
            this.keys['d'] = false;
        });
        
        // Handle mouse leave events
        leftButton.addEventListener('mouseleave', (e) => {
            this.keys['arrowleft'] = false;
            this.keys['a'] = false;
        });
        
        rightButton.addEventListener('mouseleave', (e) => {
            this.keys['arrowright'] = false;
            this.keys['d'] = false;
        });
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    showMenu() {
        this.gameState = GameStates.MENU;
        this.showScreen('menu-screen');
    }
    
    showScores() {
        this.gameState = GameStates.SCORES;
        this.showScreen('scores-screen');
        this.updateHighScoresDisplay();
    }
    
    startGame() {
        this.gameState = GameStates.PLAYING;
        this.showScreen('game-screen');
        this.resetGame();
        this.gameLoop();
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameSpeed = 0.7; // Start slower
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.fallingObjects = [];
        this.objectSpawnRate = 0.004; // Even less food spawning
        this.badFoodChance = 0.2;
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('current-level').textContent = this.level;
        document.getElementById('current-lives').textContent = this.lives;
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== GameStates.PLAYING) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Store deltaTime for debugging
        this.lastDeltaTime = deltaTime;
        
        // Update player position
        this.updatePlayer();
        
        // Update player animation
        this.updatePlayerAnimation(deltaTime);
        
        // Spawn falling objects
        this.spawnObjects();
        
        // Update falling objects
        this.updateFallingObjects();
        
        // Check collisions
        this.checkCollisions();
        
        // Update difficulty
        this.updateDifficulty();
        
        // Check game over (but don't trigger immediately if dramatic game over is in progress)
        if (this.lives <= 0 && !this.dramaticGameOverInProgress) {
            this.gameOver();
        }
    }
    
    updatePlayer() {
        let isMoving = false;
        
        // Move left
        if ((this.keys['a'] || this.keys['arrowleft']) && this.player.x > 0) {
            this.player.x -= this.player.speed;
            this.player.facingRight = false; // Face left when moving left
            isMoving = true;
        }
        
        // Move right
        if ((this.keys['d'] || this.keys['arrowright']) && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
            this.player.facingRight = true; // Face right when moving right
            isMoving = true;
        }
        
        // Update player state based on movement
        if (this.player.state === 'eating' || this.player.state === 'hit') {
            // Keep eating or hit state for a bit longer
        } else if (isMoving) {
            this.player.state = 'walking';
        } else {
            this.player.state = 'idle';
        }
    }
    
    updatePlayerAnimation(deltaTime) {
        // Update animation timer
        this.player.animationTimer += deltaTime;
        
         // Use different animation speeds based on state
         let currentAnimationSpeed;
         if (this.player.state === 'walking') {
             currentAnimationSpeed = this.player.walkingAnimationSpeed;
         } else if (this.player.state === 'hit') {
             currentAnimationSpeed = 150; // Medium speed for hit animation
         } else if (this.player.state === 'eating') {
             currentAnimationSpeed = 300; // Slower speed for eating animation to make it more visible
         } else {
             currentAnimationSpeed = this.player.animationSpeed; // Default for idle
         }
        
         // Check if it's time to advance to the next frame
         if (this.player.animationTimer >= currentAnimationSpeed) {
             this.player.animationTimer = 0;
             
             // Get the current sprite array for the player's state
             const currentSprites = this.sprites[this.player.state];
             if (currentSprites && currentSprites.length > 0) {
                 const oldFrame = this.player.animationFrame;
                 this.player.animationFrame = (this.player.animationFrame + 1) % currentSprites.length;
                 
                 // Debug eating animation frame changes
                 if (this.player.state === 'eating') {
                     console.log(`🔄 EATING FRAME CHANGE: ${oldFrame} → ${this.player.animationFrame} (${currentSprites.length} total frames, speed: ${currentAnimationSpeed}ms)`);
                 }
             } else if (this.player.state === 'eating') {
                 console.log('⚠️ EATING: No sprites available for frame advancement');
             }
         } else if (this.player.state === 'eating') {
             // Show eating animation timer progress
             console.log(`⏱️ EATING: Animation timer: ${this.player.animationTimer}/${currentAnimationSpeed}ms (${Math.round((this.player.animationTimer/currentAnimationSpeed)*100)}%)`);
         }
    }
    
    spawnObjects() {
        if (Math.random() < this.objectSpawnRate && this.foodImagesLoaded) {
            const isGoodFood = Math.random() > this.badFoodChance;
            const foodArray = isGoodFood ? this.goodFoodImages : this.badFoodImages;
            const foodImage = foodArray[Math.floor(Math.random() * foodArray.length)];
            
            const object = {
                x: Math.random() * (this.canvas.width - 150), // Account for much larger size
                y: -150,
                width: 150, // Visual size - Twice as big (75 * 2)
                height: 150, // Visual size - Twice as big (75 * 2)
                // Smaller hitboxes for bad food
                hitboxWidth: isGoodFood ? 150 : 100, // Bad food has smaller hitbox
                hitboxHeight: isGoodFood ? 150 : 100, // Bad food has smaller hitbox
                speed: 1.5 + (this.level * 0.3) + Math.random() * 1.5, // Slower initial speed
                foodImage: foodImage,
                isGood: isGoodFood,
                points: isGoodFood ? (10 + this.level * 5) : 0
            };
            
            this.fallingObjects.push(object);
        }
    }
    
    updateFallingObjects() {
        for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
            const obj = this.fallingObjects[i];
            obj.y += obj.speed * this.gameSpeed;
            
            // Remove objects that have fallen off screen
            if (obj.y > this.canvas.height) {
                // No heart penalty for missing food, just remove it
                this.fallingObjects.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
            const obj = this.fallingObjects[i];
            
            // Collision detection using hitbox dimensions
            const hitboxX = obj.x + (obj.width - obj.hitboxWidth) / 2; // Center the hitbox
            const hitboxY = obj.y + (obj.height - obj.hitboxHeight) / 2; // Center the hitbox
            
            if (hitboxX < this.player.x + this.player.width &&
                hitboxX + obj.hitboxWidth > this.player.x &&
                hitboxY < this.player.y + this.player.height &&
                hitboxY + obj.hitboxHeight > this.player.y) {
                
                if (obj.isGood) {
                    // Good food - add points
                    this.score += obj.points;
                    this.createParticleEffect(obj.x + obj.width/2, obj.y + obj.height/2, '#4CAF50');
                    
                     // Trigger eating animation
                     console.log('Triggering eating animation - will repeat for 1.5 seconds');
                     console.log('Current deltaTime in game loop:', this.lastDeltaTime || 'unknown');
                     this.player.state = 'eating';
                     this.player.animationFrame = 0;
                     this.player.animationTimer = 0;
                     this.player.eatingStartTime = Date.now();
                     
                     // Force immediate animation advancement for testing
                     console.log('🔧 Starting eating animation with forced advancement');
                     
                     // Backup animation system - force frame cycling during eating
                     this.startForcedEatingAnimation();
                     
                     // Note: Animation will automatically stop after 2 cycles
                } else {
                    // Bad food - lose a heart
                    this.lives--;
                    this.createParticleEffect(obj.x + obj.width/2, obj.y + obj.height/2, '#F44336');
                    
                    // Check if this is the final hit
                    if (this.lives <= 0) {
                        // Final hit - start dramatic game over sequence
                        console.log('Final hit - starting dramatic game over');
                        this.startDramaticGameOver();
                    } else {
                        // Regular hit animation
                        console.log('Triggering hit animation');
                        this.player.state = 'hit';
                        this.player.animationFrame = 0;
                        this.player.animationTimer = 0;
                        
                        // Reset hit state after animation duration
                        setTimeout(() => {
                            if (this.player.state === 'hit') {
                                console.log('Resetting hit animation to idle');
                                this.player.state = 'idle';
                            }
                        }, 1200); // Show hit animation for 1200ms (longer for 3-frame animation)
                        
                        // Screen shake effect
                        this.screenShake();
                    }
                }
                
                // Remove the object
                this.fallingObjects.splice(i, 1);
                this.updateUI();
            }
        }
    }
    
    updateDifficulty() {
        const newLevel = Math.floor(this.score / 200) + 1;
        if (newLevel > this.level) {
            const oldLevel = this.level;
            this.level = newLevel;
            this.gameSpeed += 0.1;
            this.objectSpawnRate += 0.002; // Much smaller increase per level
            this.badFoodChance = Math.min(0.5, 0.2 + (this.level - 1) * 0.05); // Max 50% bad food
            this.updateUI();
            
            // Show level up animation
            console.log(`🎉 Level up! ${oldLevel} → ${this.level}`);
            this.showLevelUpAnimation();
        }
    }
    
    createParticleEffect(x, y, color) {
        // Simple particle effect - could be enhanced
        const particles = [];
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                color: color
            });
        }
        
        // Animate particles (simplified)
        const animateParticles = () => {
            this.ctx.save();
            particles.forEach((particle, index) => {
                if (particle.life <= 0) {
                    particles.splice(index, 1);
                    return;
                }
                
                this.ctx.globalAlpha = particle.life / 30;
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(particle.x, particle.y, 3, 3);
                
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
            });
            this.ctx.restore();
            
            if (particles.length > 0) {
                setTimeout(animateParticles, 16);
            }
        };
        
        animateParticles();
    }
    
    screenShake() {
        const originalTransform = this.canvas.style.transform;
        let shakeIntensity = 10;
        let shakeCount = 0;
        const maxShakes = 10;
        
        const shake = () => {
            if (shakeCount >= maxShakes) {
                this.canvas.style.transform = originalTransform;
                return;
            }
            
            const x = (Math.random() - 0.5) * shakeIntensity;
            const y = (Math.random() - 0.5) * shakeIntensity;
            this.canvas.style.transform = `translate(${x}px, ${y}px)`;
            
            shakeIntensity *= 0.8;
            shakeCount++;
            
            setTimeout(shake, 50);
        };
        
        shake();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background texture
        this.drawBackground();
        
        // Draw player
        this.drawPlayer();
        
        // Draw falling objects
        this.drawFallingObjects();
        
        // Draw UI elements
        this.drawGameUI();
        
        // Draw level up animation if active
        if (this.levelUpAnimationActive) {
            this.drawLevelUpAnimation();
        }
        
        // Draw game over text if active
        if (this.gameOverTextActive) {
            this.drawGameOverText();
        }
    }
    
    drawPlayer() {
        let spriteToUse = null;
        
        // Special handling for eating animation
        if (this.player.state === 'eating') {
            console.log('EATING STATE DETECTED');
            console.log('Eating sprites loaded:', this.spritesLoaded.eat);
            console.log('Eating sprites count:', this.sprites.eat.length);
            console.log('Current animation frame:', this.player.animationFrame);
            
            if (this.sprites.eat.length > 0) {
                const eatSprite = this.sprites.eat[this.player.animationFrame % this.sprites.eat.length];
                console.log('Eat sprite selected:', eatSprite ? 'found' : 'null');
                if (eatSprite && eatSprite.complete) {
                    spriteToUse = eatSprite;
                    console.log('Using eat sprite successfully');
                } else {
                    console.log('Eat sprite not ready, using fallback');
                }
            }
        }
        
        // Try to get the sprite for the current state (if not eating or eating failed)
        if (!spriteToUse && this.spritesLoaded[this.player.state]) {
            const currentSprites = this.sprites[this.player.state];
            if (currentSprites && currentSprites.length > 0) {
                spriteToUse = currentSprites[this.player.animationFrame % currentSprites.length];
            }
        }
        
        // If current state sprite isn't ready, always fallback to idle (if available)
        if (!spriteToUse && this.spritesLoaded.idle) {
            const idleSprites = this.sprites.idle;
            if (idleSprites && idleSprites.length > 0) {
                // Use a simple frame for idle fallback
                spriteToUse = idleSprites[0];
                if (this.player.state === 'eating') {
                    console.log('EATING: Falling back to idle sprite');
                }
            }
        }
        
        // Draw the sprite if we have one
        if (spriteToUse) {
            this.drawSprite(spriteToUse);
        } else {
            // Only use rectangle fallback if absolutely no sprites are loaded yet
            // This should only happen briefly at the very start
            this.drawPlayerFallback();
            if (this.player.state === 'eating') {
                console.log('EATING: Using rectangle fallback - this is bad!');
            }
        }
    }
    
    drawSprite(sprite) {
        // Save the current context state
        this.ctx.save();
        
        // If facing left, flip the sprite horizontally
        if (!this.player.facingRight) {
            this.ctx.translate(this.player.x + this.player.width, this.player.y);
            this.ctx.scale(-1, 1);
            
            // Draw the flipped sprite
            this.ctx.drawImage(
                sprite,
                0,
                0,
                this.player.width,
                this.player.height
            );
        } else {
            // Draw the sprite normally (facing right)
            this.ctx.drawImage(
                sprite,
                this.player.x,
                this.player.y,
                this.player.width,
                this.player.height
            );
        }
        
        // Restore the context state
        this.ctx.restore();
    }
    
    drawPlayerFallback() {
        // Draw a more sprite-like fallback that's less jarring
        this.ctx.save();
        
        // Use a softer, more sprite-like appearance
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.8)'; // Semi-transparent green
        this.ctx.fillRect(this.player.x + 10, this.player.y + 10, this.player.width - 20, this.player.height - 20);
        
        // Add a simple character-like shape
        this.ctx.fillStyle = 'rgba(46, 125, 50, 0.9)';
        // Head
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width/2, this.player.y + 30, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Body
        this.ctx.fillRect(this.player.x + this.player.width/2 - 15, this.player.y + 50, 30, 60);
        
        this.ctx.restore();
    }
    
    drawFallingObjects() {
        this.fallingObjects.forEach(obj => {
            if (obj.foodImage && obj.foodImage.complete) {
                // Draw food image without any background or shadow
                this.ctx.drawImage(
                    obj.foodImage,
                    obj.x,
                    obj.y,
                    obj.width,
                    obj.height
                );
            } else {
                // Fallback to colored rectangle if image isn't loaded
                this.ctx.fillStyle = obj.isGood ? '#4CAF50' : '#F44336';
                this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            }
        });
    }
    
    drawGameUI() {
        // Draw level progress bar (bigger and brighter with rounded edges)
        const barWidth = 280; // Increased from 200
        const barHeight = 30; // Increased from 20
        const barX = 10;
        const barY = 10;
        const progressWidth = (this.score % 200) / 200 * barWidth;
        const borderRadius = 15; // Rounded corners
        
        // Draw background with rounded corners
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.drawRoundedRect(barX, barY, barWidth, barHeight, borderRadius);
        
        // Draw progress with rounded corners and brighter green
        if (progressWidth > 0) {
            this.ctx.fillStyle = '#00E676'; // Bright green (Material Design A400)
            this.drawRoundedRect(barX, barY, progressWidth, barHeight, borderRadius);
        }
        
        // Draw border
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.drawRoundedRectStroke(barX, barY, barWidth, barHeight, borderRadius);
        
        // Draw label
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Level Progress', barX, barY + barHeight + 18);
        
        // Draw hearts in top right
        this.drawHearts();
    }
    
    drawBackground() {
        // Save context
        this.ctx.save();
        
        // Draw white background first
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw texture overlay if available
        if (this.backgroundTexture && this.backgroundTexture.complete) {
            // Set 20% opacity for the texture
            this.ctx.globalAlpha = 0.2;
            
            // Draw image to cover entire canvas (stretch to fit)
            this.ctx.drawImage(
                this.backgroundTexture,
                0, 0, // source x, y
                this.backgroundTexture.width, this.backgroundTexture.height, // source width, height
                0, 0, // destination x, y
                this.canvas.width, this.canvas.height // destination width, height (covers entire canvas)
            );
        }
        
        // Restore context
        this.ctx.restore();
    }
    
    drawLevelUpAnimation() {
        // Save context
        this.ctx.save();
        
        // Calculate center position
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Animation progress (0 to 1)
        this.levelUpAnimationTime += 16; // Approximate frame time
        const progress = Math.min(this.levelUpAnimationTime / this.levelUpAnimationDuration, 1);
        
        // Calculate scale and opacity based on progress
        let scale, opacity;
        if (progress < 0.3) {
            // Growing phase
            scale = progress / 0.3;
            opacity = progress / 0.3;
        } else if (progress < 0.8) {
            // Stable phase
            scale = 1;
            opacity = 1;
        } else {
            // Fading phase
            const fadeProgress = (progress - 0.8) / 0.2;
            scale = 1 - (fadeProgress * 0.2);
            opacity = 1 - fadeProgress;
        }
        
        this.ctx.globalAlpha = opacity;
        
        // Draw "LEVEL UP!" text
        this.ctx.fillStyle = '#FFD700'; // Gold color
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.font = `${60 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const levelUpY = centerY - 40;
        this.ctx.strokeText('LEVEL UP!', centerX, levelUpY);
        this.ctx.fillText('LEVEL UP!', centerX, levelUpY);
        
        // Draw level number
        this.ctx.fillStyle = '#00E676'; // Bright green color (same as progress bar)
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.font = `${100 * scale}px Arial`;
        
        const levelNumberY = centerY + 50;
        this.ctx.strokeText(this.level.toString(), centerX, levelNumberY);
        this.ctx.fillText(this.level.toString(), centerX, levelNumberY);
        
        // Restore context
        this.ctx.restore();
    }
    
    drawGameOverText() {
        // Save context
        this.ctx.save();
        
        // Calculate center position
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Animation progress (0 to 1)
        this.gameOverTextTime += 16; // Approximate frame time
        const progress = Math.min(this.gameOverTextTime / this.gameOverTextDuration, 1);
        
        // Calculate scale and opacity with pulsing effect
        let scale, opacity;
        if (progress < 0.2) {
            // Growing phase
            scale = 0.3 + (progress / 0.2) * 0.7;
            opacity = progress / 0.2;
        } else {
            // Pulsing phase
            scale = 1 + Math.sin((progress - 0.2) * 20) * 0.05;
            opacity = 1;
        }
        
        this.ctx.globalAlpha = opacity;
        
        // Draw semi-transparent dark background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw "GAME OVER" text
        this.ctx.fillStyle = '#FF4444'; // Red color
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4; // Reduced line width too
        this.ctx.font = `${80 * scale}px Arial`; // Reduced from 120 to 80
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.strokeText('GAME OVER', centerX, centerY);
        this.ctx.fillText('GAME OVER', centerX, centerY);
        
        // Restore context
        this.ctx.restore();
    }
    
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawRoundedRectStroke(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    drawHearts() {
        const heartSize = 35; // Increased from 25
        const heartSpacing = 40; // Increased spacing to accommodate bigger hearts
        const startX = this.canvas.width - 130; // Moved left to fit bigger hearts
        const startY = 15;
        
        this.ctx.font = `${heartSize}px Arial`;
        this.ctx.textAlign = 'center';
        
        for (let i = 0; i < 3; i++) {
            if (i < this.lives) {
                this.ctx.fillStyle = '#F44336'; // Red heart
                this.ctx.fillText('❤️', startX + (i * heartSpacing), startY + heartSize/2);
            } else {
                this.ctx.fillStyle = '#999'; // Gray empty heart
                this.ctx.fillText('🤍', startX + (i * heartSpacing), startY + heartSize/2);
            }
        }
    }
    
    gameOver() {
        this.gameState = GameStates.GAME_OVER;
        
        // Clean up dramatic game over effects
        this.cleanupDramaticGameOver();
        
        // Update final score display
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-level').textContent = this.level;
        
        // Check if it's a high score
        if (this.isHighScore(this.score)) {
            document.getElementById('new-highscore').classList.remove('hidden');
            document.getElementById('player-name').focus();
        } else {
            document.getElementById('new-highscore').classList.add('hidden');
        }
        
        this.showScreen('gameover-screen');
    }
    
    cleanupDramaticGameOver() {
        // Clear intervals
        if (this.continuousCryingInterval) {
            clearInterval(this.continuousCryingInterval);
            this.continuousCryingInterval = null;
        }
        if (this.zoomInterval) {
            clearInterval(this.zoomInterval);
            this.zoomInterval = null;
        }
        
        // Reset canvas transform
        const canvas = document.getElementById('game-canvas');
        canvas.style.transform = '';
        canvas.style.transformOrigin = '';
        canvas.style.transition = '';
        
        // Reset animation flags
        this.gameOverTextActive = false;
        this.levelUpAnimationActive = false;
        this.dramaticGameOverInProgress = false;
    }
    
    isHighScore(score) {
        if (this.highScores.length < 10) return true;
        return score > this.highScores[this.highScores.length - 1].score;
    }
    
    saveHighScore() {
        const playerName = document.getElementById('player-name').value.trim() || 'Anonymous';
        
        const newScore = {
            name: playerName,
            score: this.score,
            level: this.level,
            date: new Date().toLocaleDateString()
        };
        
        this.highScores.push(newScore);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10); // Keep top 10
        
        localStorage.setItem('fallingFoodHighScores', JSON.stringify(this.highScores));
        
        document.getElementById('new-highscore').classList.add('hidden');
        document.getElementById('player-name').value = '';
        
        this.updateHighScoresDisplay();
    }
    
    loadHighScores() {
        const saved = localStorage.getItem('fallingFoodHighScores');
        return saved ? JSON.parse(saved) : [];
    }
    
    updateHighScoresDisplay() {
        const container = document.getElementById('highscores-list');
        
        if (this.highScores.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No high scores yet. Be the first!</p>';
            return;
        }
        
        container.innerHTML = this.highScores.map((score, index) => `
            <div class="highscore-entry">
                <div class="highscore-rank">#${index + 1}</div>
                <div class="highscore-name">${score.name}</div>
                <div class="highscore-info">
                    <div class="highscore-score">${score.score}</div>
                    <div class="highscore-level">Level ${score.level}</div>
                </div>
            </div>
        `).join('');
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new FallingFoodGame();
});

// Prevent context menu on right click
document.addEventListener('contextmenu', (e) => e.preventDefault());
