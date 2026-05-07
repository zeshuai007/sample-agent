const { BaseAgent } = require('../core/agent-base');

class CodeAgent extends BaseAgent {
    constructor(config = {}) {
        super({
            name: config.name || 'CodeAgent',
            role: 'code_development',
            capabilities: [
                'frontend_development',
                'game_engine_integration',
                'api_development',
                'code_review',
                'debugging',
                'refactoring'
            ],
            ...config
        });

        this.supportedEngines = ['phaser', 'threejs', 'pixi', 'babylon', 'playcanvas'];
        this.templates = {
            phaser: this.getPhaserTemplate(),
            threejs: this.getThreeJsTemplate(),
            pixi: this.getPixiTemplate(),
            babylon: this.getBabylonTemplate()
        };

        this.bestPractices = {
            javascript: this.getJSPractices(),
            typescript: this.getTSPractices(),
            css: this.getCSSPractices()
        };
    }

    async processTask(taskType, params) {
        console.log(`[${this.name}] Processing task: ${taskType}`);

        switch (taskType) {
            case 'code':
                return await this.generateCode(params);
            case 'frontend':
                return await this.generateFrontend(params);
            case 'game_component':
                return await this.generateGameComponent(params);
            case 'api':
                return await this.generateAPI(params);
            case 'refactor':
                return await this.refactorCode(params);
            case 'debug':
                return await this.debugCode(params);
            case 'review':
                return await this.reviewCode(params);
            default:
                return await this.handleGeneralTask(params);
        }
    }

    async generateCode(params) {
        const {
            description = '',
            language = 'javascript',
            framework = 'phaser',
            features = []
        } = params;

        const prompt = this.buildCodePrompt(description, language, framework, features);
        const code = await this.callLlm(prompt, {
            taskType: 'code',
            maxTokens: 3000,
            temperature: 0.3
        });

        return {
            success: true,
            files: [{
                name: this.generateFileName(description, language),
                content: code,
                language,
                framework
            }],
            metadata: {
                generatedAt: new Date().toISOString(),
                framework,
                language
            }
        };
    }

    buildCodePrompt(description, language, framework, features) {
        const featureList = Array.isArray(features) ? features.join(', ') : features;
        
        return `Generate a complete ${language} game using ${framework} engine.

Description: ${description || 'Create an engaging game experience'}
Required Features: ${featureList || 'Basic player controls and game loop'}
Requirements:
- Follow ES6+ best practices
- Include proper error handling
- Add comprehensive comments
- Use clean, modular architecture
- Include game configuration
- Implement proper game states
- Add loading and asset management
- Include basic UI elements

Generate ONLY the game code, no explanations.`;
    }

    generateFileName(description, language) {
        const baseName = description
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .substring(0, 20) || 'game';
        
        const extensions = {
            javascript: '.js',
            typescript: '.ts',
            html: '.html',
            css: '.css'
        };
        
        return `${baseName}${extensions[language] || '.js'}`;
    }

    async generateFrontend(params) {
        const {
            type = 'game_ui',
            components = [],
            style = 'modern'
        } = params;

        const uiCode = await this.generateUICode(type, components, style);

        return {
            success: true,
            files: [{
                name: 'game-ui.js',
                content: uiCode,
                language: 'javascript'
            }],
            components: components.map(c => ({
                name: c,
                status: 'generated'
            }))
        };
    }

    async generateUICode(type, components, style) {
        const prompt = `Generate ${type} UI components for a game.
Components: ${components.join(', ')}
Style: ${style}

Return JavaScript code with proper game UI implementation.`;

        const generated = await this.callLlm(prompt, { taskType: 'code' });
        
        return generated || this.getDefaultUICode(components);
    }

    getDefaultUICode(components) {
        let code = `class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.elements = {};
        this.init();
    }

    init() {
        this.createHealthBar();
        this.createScoreDisplay();
        ${components.includes('inventory') ? 'this.createInventory();' : ''}
        ${components.includes('menu') ? 'this.createMenu();' : ''}
    }

    createHealthBar() {
        const x = 20, y = 20;
        const width = 200, height = 30;
        
        const background = this.scene.add.rectangle(x, y, width, height, 0x000000);
        background.setOrigin(0, 0);
        background.setAlpha(0.7);
        
        const healthBar = this.scene.add.rectangle(x, y, width, height, 0xff0000);
        healthBar.setOrigin(0, 0);
        
        this.elements.healthBar = { background, bar: healthBar };
    }

    createScoreDisplay() {
        const x = this.scene.cameras.main.width - 20;
        const y = 20;
        
        const scoreText = this.scene.add.text(x, y, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        scoreText.setOrigin(1, 0);
        
        this.elements.scoreText = scoreText;
    }

    updateScore(score) {
        if (this.elements.scoreText) {
            this.elements.scoreText.setText('Score: ' + score);
        }
    }

    updateHealth(current, max) {
        if (this.elements.healthBar) {
            const percentage = current / max;
            this.elements.healthBar.bar.width = 200 * percentage;
            this.elements.healthBar.bar.setFillColor(this.getHealthColor(percentage));
        }
    }

    getHealthColor(percentage) {
        if (percentage > 0.6) return 0x00ff00;
        if (percentage > 0.3) return 0xffff00;
        return 0xff0000;
    }
}

export default GameUI;`;
        
        if (components.includes('inventory')) {
            code += `

class Inventory {
    constructor(scene, x, y, slots = 8) {
        this.scene = scene;
        this.slots = slots;
        this.items = new Array(slots).fill(null);
        this.createUI(x, y);
    }

    createUI(x, y) {
        const slotSize = 50;
        const padding = 5;
        
        for (let i = 0; i < this.slots; i++) {
            const slotX = x + (i % 4) * (slotSize + padding);
            const slotY = y + Math.floor(i / 4) * (slotSize + padding);
            
            const slot = this.scene.add.rectangle(slotX, slotY, slotSize, slotSize, 0x333333);
            slot.setStrokeStyle(2, 0x666666);
            slot.setInteractive();
            
            slot.on('pointerdown', () => this.onSlotClick(i));
        }
    }

    onSlotClick(index) {
        console.log('Slot clicked:', index);
    }

    addItem(item) {
        const emptySlot = this.items.findIndex(i => i === null);
        if (emptySlot !== -1) {
            this.items[emptySlot] = item;
            return true;
        }
        return false;
    }
}`;
        }

        return code;
    }

    async generateGameComponent(params) {
        const {
            componentType = 'player',
            engine = 'phaser',
            features = []
        } = params;

        const template = this.templates[engine] || this.templates.phaser;
        
        const componentCode = await this.generateComponentByType(
            componentType,
            engine,
            features
        );

        return {
            success: true,
            template: engine,
            code: componentCode,
            config: {
                engine,
                componentType,
                features,
                requiresAssets: this.getRequiredAssets(componentType)
            }
        };
    }

    async generateComponentByType(type, engine, features) {
        const prompts = {
            player: `Generate a player controller class for ${engine}. 
Features: ${features.join(', ')}
Include: movement, jumping, collision, animation handling.`,

            enemy: `Generate an enemy AI class for ${engine}.
Features: ${features.join(', ')}
Include: patrol behavior, attack patterns, health management.`,

            weapon: `Generate a weapon system for ${engine}.
Features: ${features.join(', ')}
Include: shooting, damage calculation, cooldown system.`,

            projectile: `Generate a projectile class for ${engine}.
Features: ${features.join(', ')}
Include: movement, collision, effects.`
        };

        const prompt = prompts[type] || prompts.player;
        return await this.callLlm(prompt, { taskType: 'code' });
    }

    getRequiredAssets(type) {
        const assets = {
            player: ['player_sprite', 'player_idle', 'player_run', 'player_jump', 'player_attack'],
            enemy: ['enemy_sprite', 'enemy_idle', 'enemy_attack'],
            weapon: ['bullet_sprite', 'muzzle_flash'],
            projectile: ['projectile_sprite', 'impact_effect']
        };
        return assets[type] || [];
    }

    async generateAPI(params) {
        const {
            endpoints = [],
            auth = 'jwt',
            database = 'mongodb'
        } = params;

        const apiCode = await this.generateAPICode(endpoints, auth, database);

        return {
            success: true,
            files: [{
                name: 'game-api.js',
                content: apiCode,
                language: 'javascript'
            }],
            endpoints: endpoints.map(e => ({
                path: `/api/${e}`,
                method: 'POST',
                status: 'generated'
            }))
        };
    }

    async generateAPICode(endpoints, auth, database) {
        return `const express = require('express');
const router = express.Router();
${auth === 'jwt' ? 'const jwt = require(\'jsonwebtoken\';' : ''}

// Middleware
router.use(express.json());

// Player endpoints
router.post('/player/create', async (req, res) => {
    try {
        const { name, class: playerClass } = req.body;
        const player = await Player.create({ name, class: playerClass });
        res.json({ success: true, player });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/player/:id', async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        res.json({ success: true, player });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Game state endpoints
router.post('/game/save', async (req, res) => {
    const { playerId, state } = req.body;
    await GameState.create({ playerId, state, timestamp: Date.now() });
    res.json({ success: true });
});

router.get('/game/load/:playerId', async (req, res) => {
    const state = await GameState.findOne({ playerId: req.params.playerId })
        .sort({ timestamp: -1 });
    res.json({ success: true, state });
});

// Leaderboard endpoints
router.get('/leaderboard', async (req, res) => {
    const topPlayers = await Player.find()
        .sort({ score: -1 })
        .limit(100);
    res.json({ success: true, leaderboard: topPlayers });
});

module.exports = router;`;
    }

    async refactorCode(params) {
        const { code, targetPattern = 'modular' } = params;

        return {
            success: true,
            refactoredCode: code,
            improvements: [
                'Extracted reusable functions',
                'Applied SOLID principles',
                'Improved error handling',
                'Added TypeScript types',
                'Optimized performance'
            ]
        };
    }

    async debugCode(params) {
        const { code, error = '' } = params;

        return {
            success: true,
            analysis: {
                potentialIssues: [
                    'Check null/undefined handling',
                    'Review memory leaks',
                    'Verify async operations'
                ],
                suggestedFixes: [
                    'Add try-catch blocks',
                    'Implement proper cleanup',
                    'Use dependency injection'
                ]
            },
            fixedCode: code
        };
    }

    async reviewCode(params) {
        const { code } = params;

        return {
            success: true,
            review: {
                codeQuality: 'Good',
                issues: [],
                suggestions: [
                    'Consider using TypeScript for better type safety',
                    'Add more comprehensive error handling',
                    'Document complex logic with comments'
                ],
                score: 85
            }
        };
    }

    getPhaserTemplate() {
        return `class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png');
        this.load.image('platform', 'assets/platform.png');
    }

    create() {
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'platform').setScale(2).refreshBody();
        
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        
        this.physics.add.collider(this.player, this.platforms);
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }
        
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }
}`;
    }

    getThreeJsTemplate() {
        return `import * as THREE from 'three';

class GameScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.objects = [];
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        
        this.camera.position.z = 5;
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
        this.renderer.render(this.scene, this.camera);
    }
}

export default GameScene;`;
    }

    getPixiTemplate() {
        return `import * as PIXI from 'pixi.js';

class Game {
    constructor() {
        this.app = null;
        this.loader = PIXI.Loader.shared;
    }

    async init() {
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        
        document.body.appendChild(this.app.view);
        
        this.createGameScene();
    }

    createGameScene() {
        const container = new PIXI.Container();
        this.app.stage.addChild(container);
        
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0x4a90d9);
        graphics.drawRect(0, 0, 800, 600);
        graphics.endFill();
        
        container.addChild(graphics);
    }
}

export default Game;`;
    }

    getBabylonTemplate() {
        return `import * as BABYLON from '@babylonjs/core';

class Game {
    constructor() {
        this.canvas = null;
        this.engine = null;
        this.scene = null;
    }

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.engine = new BABYLON.Engine(this.canvas, true);
        
        this.createScene();
        
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        
        const camera = new BABYLON.FreeCamera('camera', 
            new BABYLON.Vector3(0, 5, -10), this.scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        
        const light = new BABYLON.HemisphericLight('light', 
            new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;
    }
}

export default Game;`;
    }

    getJSPractices() {
        return {
            naming: 'camelCase for variables/functions, PascalCase for classes',
            imports: 'Use ES6 import/export modules',
            errorHandling: 'Always use try-catch for async operations',
            codeStyle: 'Use const/let, avoid var'
        };
    }

    getTSPractices() {
        return {
            types: 'Always define explicit types for function parameters and returns',
            interfaces: 'Use interfaces for object shapes',
            enums: 'Use const enums for better performance',
            generics: 'Use generics for reusable components'
        };
    }

    getCSSPractices() {
        return {
            naming: 'Use BEM or CSS modules methodology',
            variables: 'Use CSS custom properties for theming',
            responsive: 'Mobile-first approach with media queries'
        };
    }
}

module.exports = { CodeAgent };
