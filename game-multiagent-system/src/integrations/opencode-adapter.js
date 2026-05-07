const fs = require('fs').promises;
const path = require('path');

class OpenCodeAdapter {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.workspace = process.cwd();
        this.outputDir = path.join(this.workspace, 'output');
        this.projectStructure = {
            src: 'src',
            assets: 'assets',
            config: 'config',
            tests: 'tests'
        };
    }

    async initializeProject(gameType, options = {}) {
        console.log(`[OpenCode] Initializing ${gameType} project...`);

        const structure = await this.createProjectStructure(options);

        await this.orchestrator.knowledgeBase.store('system', 'project_structure', {
            gameType,
            options,
            createdAt: new Date().toISOString()
        });

        return structure;
    }

    async createProjectStructure(options = {}) {
        const structure = {
            directories: this.getProjectDirectories(options),
            files: await this.generateInitialFiles(options),
            configuration: this.getProjectConfiguration(options)
        };

        for (const dir of structure.directories) {
            try {
                await fs.mkdir(path.join(this.outputDir, dir), { recursive: true });
                console.log(`[OpenCode] Created directory: ${dir}`);
            } catch (error) {
                console.error(`[OpenCode] Failed to create directory ${dir}:`, error.message);
            }
        }

        return structure;
    }

    getProjectDirectories(options = {}) {
        const baseDirs = ['src', 'assets/sprites', 'assets/audio', 'assets/fonts', 'config'];

        if (options.testing !== false) {
            baseDirs.push('tests');
        }

        if (options.documentation !== false) {
            baseDirs.push('docs');
        }

        return baseDirs;
    }

    async generateInitialFiles(options = {}) {
        const files = [];
        const gameType = options.gameType || 'platformer';
        const engine = options.engine || 'phaser';

        files.push({
            path: 'package.json',
            content: this.generatePackageJson(options)
        });

        files.push({
            path: 'src/index.html',
            content: this.generateHTML(gameType)
        });

        files.push({
            path: `src/game.${this.getExtension(engine)}`,
            content: this.generateMainGameCode(engine, options)
        });

        files.push({
            path: 'config/game.config.js',
            content: this.generateGameConfig(options)
        });

        for (const file of files) {
            try {
                const filePath = path.join(this.outputDir, file.path);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, file.content);
                console.log(`[OpenCode] Generated file: ${file.path}`);
            } catch (error) {
                console.error(`[OpenCode] Failed to write file ${file.path}:`, error.message);
            }
        }

        return files.map(f => f.path);
    }

    getExtension(engine) {
        const extensions = {
            phaser: 'js',
            threejs: 'js',
            pixi: 'js',
            babylon: 'js'
        };
        return extensions[engine] || 'js';
    }

    generatePackageJson(options = {}) {
        const engine = options.engine || 'phaser';
        const dependencies = {
            phaser: '^3.70.0',
            express: '^4.18.2'
        };

        return JSON.stringify({
            name: options.projectName || 'game-project',
            version: '1.0.0',
            description: `Generated ${gameType} game using multi-agent system`,
            main: 'src/index.js',
            scripts: {
                start: 'node src/server.js',
                dev: 'nodemon src/server.js',
                build: 'webpack --mode production',
                test: 'jest',
                lint: 'eslint src/'
            },
            dependencies,
            devDependencies: {
                jest: '^29.7.0',
                webpack: '^5.89.0',
                eslint: '^8.55.0'
            },
            keywords: [gameType, 'game', engine],
            author: 'Multi-Agent System',
            license: 'MIT'
        }, null, 2);
    }

    generateHTML(gameType) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated ${gameType} Game</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: #1a1a2e;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: 'Segoe UI', sans-serif;
        }
        #game-container {
            position: relative;
            width: 800px;
            height: 600px;
            border: 4px solid #4a90d9;
            border-radius: 8px;
            overflow: hidden;
        }
        canvas {
            display: block;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 24px;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <div class="loading">Loading...</div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <script type="module" src="game.js"></script>
</body>
</html>`;
    }

    generateMainGameCode(engine, options = {}) {
        if (engine === 'phaser') {
            return this.generatePhaserGame(options);
        } else if (engine === 'threejs') {
            return this.generateThreeJSGame(options);
        }

        return this.generatePhaserGame(options);
    }

    generatePhaserGame(options = {}) {
        const gameType = options.gameType || 'platformer';

        return `// Generated by Multi-Agent System
// Game Type: ${gameType}
// Engine: Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.createLoadingBar();
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x4a90d9, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });
    }

    create() {
        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 3, '${gameType} Game', {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const startButton = this.add.text(width / 2, height / 2, 'Start Game', {
            fontSize: '32px',
            fill: '#4a90d9',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerover', () => startButton.setStyle({ fill: '#8b5cf6' }));
        startButton.on('pointerout', () => startButton.setStyle({ fill: '#4a90d9' }));
        startButton.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.score = 0;
        this.player = null;
        this.platforms = null;
        this.cursors = null;
    }

    create() {
        this.platforms = this.physics.add.staticGroup();

        this.platforms.create(400, 568, 'platform').setScale(2).refreshBody();

        this.add.text(16, 16, 'Score: 0', {
            fontSize: '20px',
            fill: '#fff'
        });

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.cursors.left.isDown) {
            console.log('Moving left');
        } else if (this.cursors.right.isDown) {
            console.log('Moving right');
        }

        if (this.cursors.up.isDown) {
            console.log('Jump!');
        }
    }

    addScore(points) {
        this.score += points;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(config);
export default game;`;
    }

    generateThreeJSGame(options = {}) {
        return `// Generated by Multi-Agent System
// Engine: Three.js

import * as THREE from 'three';

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.objects = [];
        this.init();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x4a90d9 });
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
        this.objects.push(cube);

        window.addEventListener('resize', () => this.onWindowResize());
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.objects.forEach((obj, i) => {
            obj.rotation.x += 0.01 * (i + 1);
            obj.rotation.y += 0.01 * (i + 1);
        });

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

const game = new Game();
export default game;`;
    }

    generateGameConfig(options = {}) {
        return `// Game Configuration
// Generated by Multi-Agent System

export const gameConfig = {
    ${Object.entries(options).map(([key, value]) => {
        if (typeof value === 'string') return `${key}: '${value}'`;
        return `${key}: ${JSON.stringify(value)}`;
    }).join(',\n    ')}

    physics: {
        gravity: 300,
        debug: false
    },

    graphics: {
        width: 800,
        height: 600,
        pixelArt: ${options.style === 'pixel' ? 'true' : 'false'},
        antialias: true
    },

    audio: {
        masterVolume: 0.8,
        musicVolume: 0.6,
        sfxVolume: 1.0
    },

    gameplay: {
        startingLives: 3,
        invincibilityTime: 2000,
        checkpointInterval: 500
    }
};

export default gameConfig;`;
    }

    getProjectConfiguration(options = {}) {
        return {
            engine: options.engine || 'phaser',
            gameType: options.gameType || 'platformer',
            style: options.style || 'modern',
            features: options.features || ['basic_mechanics'],
            generatedAt: new Date().toISOString()
        };
    }

    async generateGame(gameType, options = {}) {
        console.log(`[OpenCode] Generating ${gameType} game...`);

        const taskDescription = this.buildTaskDescription(gameType, options);
        const result = await this.orchestrator.executeTask(taskDescription, {
            context: { gameType, options }
        });

        if (result.results?.results) {
            await this.writeGeneratedArtifacts(result.results.results);
        }

        await this.createReadme(gameType, options);

        return {
            success: true,
            projectPath: this.outputDir,
            artifacts: result.results || [],
            message: 'Game generated successfully'
        };
    }

    buildTaskDescription(gameType, options) {
        return `Create a complete ${gameType} game with:
        - Engine: ${options.engine || 'Phaser 3'}
        - Features: ${(options.features || ['basic mechanics']).join(', ')}
        - Style: ${options.style || 'modern pixel art'}
        - Theme: ${options.theme || 'fantasy'}
        
        Include game code, configuration, and basic structure.`;
    }

    async writeGeneratedArtifacts(artifacts) {
        for (const artifact of artifacts) {
            if (artifact.result?.files) {
                for (const file of artifact.result.files) {
                    await this.writeArtifact(file);
                }
            }
        }
    }

    async writeArtifact(file) {
        try {
            const filePath = path.join(this.outputDir, file.name || 'untitled.js');
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, file.content);
            console.log(`[OpenCode] Written: ${file.name}`);
        } catch (error) {
            console.error(`[OpenCode] Failed to write artifact:`, error.message);
        }
    }

    async createReadme(gameType, options) {
        const readme = `# Generated ${gameType} Game

Generated by Multi-Agent Game Development System

## Quick Start

\`\`\`bash
npm install
npm start
\`\`\`

## Project Structure

- \`src/\` - Game source code
- \`assets/\` - Game assets (sprites, audio, fonts)
- \`config/\` - Game configuration
- \`tests/\` - Test files

## Configuration

- Engine: ${options.engine || 'Phaser 3'}
- Game Type: ${gameType}
- Style: ${options.style || 'modern'}

## Available Scripts

- \`npm start\` - Start development server
- \`npm run build\` - Build for production
- \`npm test\` - Run tests

## Generated Features

${(options.features || ['Basic mechanics']).map(f => `- ${f}`).join('\n')}

---
*This project was automatically generated by the Game Multi-Agent System*
`;

        await fs.writeFile(path.join(this.outputDir, 'README.md'), readme);
        console.log('[OpenCode] Generated README.md');
    }

    async readProjectContext() {
        const context = {
            files: [],
            packageJson: null,
            config: {},
            readme: null
        };

        try {
            const packagePath = path.join(this.workspace, 'package.json');
            context.packageJson = JSON.parse(
                await fs.readFile(packagePath, 'utf-8')
            );
        } catch (e) {
            console.log('[OpenCode] No package.json found');
        }

        const extensions = ['.js', '.ts', '.json', '.html', '.md'];
        const files = await this.findFiles(this.workspace, extensions);
        context.files = files;

        return context;
    }

    async findFiles(dir, extensions) {
        const files = [];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory() &&
                    !entry.name.startsWith('.') &&
                    !entry.name.startsWith('node_modules')) {
                    const subFiles = await this.findFiles(fullPath, extensions);
                    files.push(...subFiles);
                } else if (extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push({
                        path: fullPath,
                        name: entry.name,
                        relative: path.relative(this.workspace, fullPath)
                    });
                }
            }
        } catch (e) {
            console.error(`[OpenCode] Error reading directory ${dir}:`, e.message);
        }

        return files;
    }

    async analyzeProject() {
        const context = await this.readProjectContext();

        const analysis = {
            projectType: this.detectProjectType(context),
            technologies: this.detectTechnologies(context),
            structure: this.analyzeStructure(context),
            recommendations: []
        };

        if (!context.packageJson) {
            analysis.recommendations.push({
                type: 'missing',
                message: 'No package.json found - consider adding one',
                priority: 'high'
            });
        }

        return analysis;
    }

    detectProjectType(context) {
        if (context.packageJson?.dependencies?.phaser) return 'phaser';
        if (context.packageJson?.dependencies?.three) return 'threejs';
        if (context.packageJson?.dependencies?.pixi) return 'pixijs';
        return 'unknown';
    }

    detectTechnologies(context) {
        const tech = [];

        if (context.packageJson?.dependencies) {
            Object.keys(context.packageJson.dependencies).forEach(dep => {
                if (dep.includes('phaser')) tech.push('Phaser');
                if (dep.includes('three')) tech.push('Three.js');
                if (dep.includes('pixi')) tech.push('PixiJS');
                if (dep.includes('express')) tech.push('Express');
            });
        }

        return tech;
    }

    analyzeStructure(context) {
        return {
            totalFiles: context.files.length,
            sourceFiles: context.files.filter(f => f.name.endsWith('.js')).length,
            configFiles: context.files.filter(f => f.name.endsWith('.json')).length,
            hasTests: context.files.some(f => f.path.includes('/tests/'))
        };
    }

    getStatus() {
        return {
            workspace: this.workspace,
            outputDir: this.outputDir,
            projectStructure: this.projectStructure,
            initialized: this.orchestrator !== null
        };
    }
}

module.exports = { OpenCodeAdapter };
