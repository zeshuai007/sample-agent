const { BaseAgent } = require('../core/agent-base');

class ArtAgent extends BaseAgent {
    constructor(config = {}) {
        super({
            name: config.name || 'ArtAgent',
            role: 'art_design',
            capabilities: [
                'ui_design',
                'sprite_planning',
                'color_schemes',
                'animation_specs',
                'asset_management',
                'visual_style_guide'
            ],
            ...config
        });

        this.styleGuides = {
            pixel: this.getPixelArtGuide(),
            flat: this.getFlatDesignGuide(),
            cartoon: this.getCartoonGuide(),
            realistic: this.getRealisticGuide(),
            neon: this.getNeonDesignGuide()
        };

        this.assetCategories = [
            'characters',
            'environments',
            'ui_elements',
            'effects',
            'icons',
            'backgrounds'
        ];
    }

    async processTask(taskType, params) {
        console.log(`[${this.name}] Processing task: ${taskType}`);

        switch (taskType) {
            case 'art':
                return await this.createArtPlan(params);
            case 'design':
                return await this.designUI(params);
            case 'ui':
                return await this.designUI(params);
            case 'sprite':
                return await this.planSprites(params);
            case 'animation':
                return await this.specifyAnimation(params);
            case 'color':
                return await this.generateColorPalette(params);
            case 'style':
                return await this.createStyleGuide(params);
            default:
                return await this.handleGeneralDesign(params);
        }
    }

    async createArtPlan(params) {
        const {
            gameType = 'action',
            theme = 'fantasy',
            style = 'cartoon',
            targetPlatform = 'web'
        } = params;

        const artDirection = await this.generateArtDirection(gameType, theme, style);
        const styleGuide = this.styleGuides[style] || this.styleGuides.cartoon;
        const colorPalette = this.generateColorPalette(params.theme || 'fantasy', params.style);
        const assetList = this.suggestAssets(gameType, theme);
        const uiElements = this.planUIAssets();

        return {
            success: true,
            artDirection: artDirection || this.getDefaultArtDirection(gameType, theme, style),
            styleGuide,
            colorPalette,
            assetList,
            uiElements,
            metadata: {
                gameType,
                theme,
                style,
                generatedAt: new Date().toISOString()
            }
        };
    }

    async generateArtDirection(gameType, theme, style) {
        const prompt = `Create detailed art direction for a ${style} style ${gameType} game with ${theme} theme.

Include:
- Visual style description
- Key art elements
- Character design approach
- Environment design approach
- Color mood and palette
- Reference artists or games`;

        return await this.callLlm(prompt, {
            taskType: 'art',
            maxTokens: 2000,
            temperature: 0.7
        });
    }

    getDefaultArtDirection(gameType, theme, style) {
        const directions = {
            pixel: `Pixel art style with ${theme} theme. 
                16-bit era inspired visuals with limited color palette.
                Chunky, readable sprites with clear silhouettes.
                Dynamic backgrounds with parallax scrolling.`,
            
            flat: `Flat design with ${theme} theme.
                Clean, minimalist shapes with bold colors.
                No gradients or shadows.
                Modern, vector-based aesthetics.`,
            
            cartoon: `Cartoon style with ${theme} theme.
                Bold outlines with expressive characters.
                Vibrant, saturated colors.
                Exaggerated proportions and animations.`,
            
            realistic: `Realistic style with ${theme} theme.
                Detailed textures and lighting.
                Dynamic shadows and reflections.
                Cinematic camera angles.`,
            
            neon: `Neon cyberpunk style with ${theme} theme.
                Glowing effects and light trails.
                Dark backgrounds with bright accent colors.
                Retro-futuristic aesthetic.`
        };

        return directions[style] || directions.cartoon;
    }

    generateColorPalette(theme, style) {
        const palettes = {
            fantasy: {
                primary: '#4a90d9',
                secondary: '#8b5cf6',
                accent: '#10b981',
                background: '#1a1a2e',
                text: '#ffffff'
            },
            scifi: {
                primary: '#06b6d4',
                secondary: '#8b5cf6',
                accent: '#ec4899',
                background: '#0f172a',
                text: '#e2e8f0'
            },
            retro: {
                primary: '#f97316',
                secondary: '#84cc16',
                accent: '#06b6d4',
                background: '#1c1917',
                text: '#fef3c7'
            },
            horror: {
                primary: '#991b1b',
                secondary: '#450a0a',
                accent: '#dc2626',
                background: '#0a0a0a',
                text: '#d4d4d4'
            },
            fantasy_medieval: {
                primary: '#92400e',
                secondary: '#78350f',
                accent: '#fbbf24',
                background: '#292524',
                text: '#fef3c7'
            }
        };

        return palettes[theme] || palettes.fantasy;
    }

    suggestAssets(gameType, theme) {
        return {
            sprites: this.planSprites(gameType),
            backgrounds: this.planBackgrounds(theme),
            effects: this.planEffects(gameType),
            ui: this.planUIAssets()
        };
    }

    planSprites(gameType) {
        const spriteTypes = {
            platformer: [
                { name: 'player', size: '64x64', frames: 8, animations: ['idle', 'run', 'jump', 'attack'] },
                { name: 'enemy_slime', size: '32x32', frames: 4, animations: ['idle', 'move'] },
                { name: 'enemy_goblin', size: '48x48', frames: 6, animations: ['idle', 'run', 'attack'] },
                { name: 'npc_merchant', size: '64x64', frames: 4, animations: ['idle', 'talk'] }
            ],
            rpg: [
                { name: 'hero', size: '48x48', frames: 12, animations: ['idle', 'walk', 'attack', 'cast', 'hurt', 'death'] },
                { name: 'dragon', size: '128x128', frames: 8, animations: ['idle', 'fly', 'firebreath', 'death'] },
                { name: 'treasure_chest', size: '48x48', frames: 4, animations: ['closed', 'opening', 'open', 'looted'] }
            ],
            shooter: [
                { name: 'marine', size: '64x64', frames: 8, animations: ['idle', 'run', 'shoot', 'reload', 'hurt'] },
                { name: 'alien', size: '48x48', frames: 6, animations: ['idle', 'move', 'attack'] },
                { name: 'bullet', size: '8x8', frames: 2, animations: ['travel', 'impact'] }
            ],
            puzzle: [
                { name: 'game_piece', size: '64x64', frames: 4, animations: ['idle', 'selected', 'match', 'fall'] },
                { name: 'tile', size: '48x48', frames: 2, animations: ['normal', 'highlighted'] }
            ]
        };

        return spriteTypes[gameType] || spriteTypes.platformer;
    }

    planBackgrounds(theme) {
        return {
            layers: 4,
            parallax: true,
            types: [
                { name: 'sky', parallaxFactor: 0.1 },
                { name: 'mountains', parallaxFactor: 0.3 },
                { name: 'trees', parallaxFactor: 0.5 },
                { name: 'foreground', parallaxFactor: 0.8 }
            ],
            resolution: {
                width: 1920,
                height: 1080
            },
            style: theme
        };
    }

    planEffects(gameType) {
        return {
            particles: [
                { name: 'fire', color: '#ff6b35', size: '8x8', count: 20 },
                { name: 'sparkle', color: '#ffd700', size: '4x4', count: 30 },
                { name: 'smoke', color: '#808080', size: '16x16', count: 15 }
            ],
            screenEffects: [
                { name: 'screen_shake', intensity: 'variable' },
                { name: 'flash', duration: '100ms' },
                { name: 'fade', duration: '500ms' }
            ],
            transitions: [
                { name: 'slide', duration: '300ms' },
                { name: 'fade', duration: '500ms' },
                { name: 'wipe', duration: '400ms' }
            ]
        };
    }

    planUIAssets() {
        return {
            buttons: [
                { name: 'btn_primary', size: '200x50', states: ['normal', 'hover', 'pressed', 'disabled'] },
                { name: 'btn_icon', size: '48x48', states: ['normal', 'hover', 'pressed'] },
                { name: 'btn_close', size: '32x32', states: ['normal', 'hover'] }
            ],
            bars: [
                { name: 'health_bar', size: '200x20', style: 'gradient' },
                { name: 'xp_bar', size: '200x15', style: 'segmented' },
                { name: 'mana_bar', size: '200x20', style: 'liquid' }
            ],
            icons: {
                inventory: { name: 'inv_icon', size: '32x32' },
                settings: { name: 'settings_icon', size: '24x24' },
                sound: { name: 'sound_icon', size: '24x24' }
            },
            frames: [
                { name: 'panel', size: 'variable', style: 'ornate' },
                { name: 'tooltip', size: 'variable', style: 'simple' },
                { name: 'dialog', size: '400x300', style: 'modern' }
            ]
        };
    }

    async designUI(params) {
        const {
            gameType = 'action',
            uiStyle = 'modern',
            targetPlatform = 'web'
        } = params;

        const layout = this.createLayout(gameType, targetPlatform);
        const components = this.planUIComponents(uiStyle);
        const specifications = this.generateUISpecs(uiStyle, targetPlatform);

        return {
            success: true,
            layout,
            components,
            specifications,
            responsiveBreakpoints: this.getResponsiveBreakpoints(targetPlatform)
        };
    }

    createLayout(gameType, platform) {
        const layouts = {
            mobile: {
                orientation: 'portrait',
                safeArea: { top: 44, bottom: 34 },
                hudPosition: 'top',
                menuPosition: 'bottom',
                gestureZones: ['left:movement', 'right:actions']
            },
            desktop: {
                orientation: 'landscape',
                safeArea: { top: 0, bottom: 0 },
                hudPosition: 'corners',
                menuPosition: 'center',
                hotkeys: true
            },
            web: {
                responsive: true,
                minWidth: 320,
                maxWidth: 1920,
                scaling: 'letterbox'
            }
        };

        return layouts[platform] || layouts.web;
    }

    planUIComponents(style) {
        const componentStyles = {
            modern: {
                borderRadius: 8,
                shadows: true,
                gradients: false,
                animations: 'ease-out'
            },
            classic: {
                borderRadius: 0,
                shadows: false,
                gradients: true,
                animations: 'linear'
            },
            pixel: {
                borderRadius: 0,
                shadows: false,
                gradients: false,
                pixelPerfect: true,
                animations: 'frame-based'
            }
        };

        return {
            hud: {
                health: { style: componentStyles[style], position: 'top-left' },
                score: { style: componentStyles[style], position: 'top-right' },
                timer: { style: componentStyles[style], position: 'top-center' }
            },
            menus: {
                main: { fullscreen: true, buttons: ['start', 'continue', 'settings', 'credits', 'exit'] },
                pause: { fullscreen: false, overlay: true, buttons: ['resume', 'restart', 'settings', 'exit'] },
                settings: { tabs: ['video', 'audio', 'controls', 'gameplay'] }
            },
            inventory: {
                type: 'grid',
                slots: 20,
                gridSize: { cols: 5, rows: 4 },
                dragAndDrop: true
            }
        };
    }

    generateUISpecs(style, platform) {
        return {
            typography: {
                fontFamily: style === 'pixel' ? 'Press Start 2P' : 'Roboto, sans-serif',
                sizes: {
                    title: platform === 'mobile' ? 32 : 48,
                    heading: platform === 'mobile' ? 24 : 32,
                    body: platform === 'mobile' ? 16 : 18,
                    caption: platform === 'mobile' ? 12 : 14
                }
            },
            spacing: {
                base: platform === 'mobile' ? 8 : 16,
                component: platform === 'mobile' ? 12 : 24,
                section: platform === 'mobile' ? 24 : 48
            },
            colors: {
                primary: '#4a90d9',
                secondary: '#8b5cf6',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                text: '#ffffff',
                background: '#1a1a2e'
            }
        };
    }

    getResponsiveBreakpoints(platform) {
        if (platform === 'mobile') {
            return [
                { name: 'small', width: 320 },
                { name: 'medium', width: 375 },
                { name: 'large', width: 414 }
            ];
        }

        return [
            { name: 'mobile', maxWidth: 767 },
            { name: 'tablet', minWidth: 768, maxWidth: 1023 },
            { name: 'desktop', minWidth: 1024 },
            { name: 'large', minWidth: 1440 }
        ];
    }

    async planSprites(params) {
        const { spriteType = 'character', style = 'pixel' } = params;

        return {
            success: true,
            sprites: this.planSpritesByType(spriteType, style),
            specifications: {
                size: this.getSpriteSize(style),
                format: 'png',
                colorDepth: style === 'pixel' ? 16 : 32,
                transparency: true
            }
        };
    }

    planSpritesByType(type, style) {
        const sprites = {
            character: [
                { name: 'idle', frames: 4, fps: 8 },
                { name: 'walk', frames: 8, fps: 12 },
                { name: 'run', frames: 8, fps: 16 },
                { name: 'jump', frames: 6, fps: 12 },
                { name: 'attack', frames: 8, fps: 16 },
                { name: 'hurt', frames: 4, fps: 12 },
                { name: 'death', frames: 6, fps: 8 }
            ],
            npc: [
                { name: 'idle', frames: 4, fps: 6 },
                { name: 'talk', frames: 4, fps: 8 },
                { name: 'walk', frames: 8, fps: 10 }
            ],
            monster: [
                { name: 'idle', frames: 4, fps: 8 },
                { name: 'move', frames: 6, fps: 12 },
                { name: 'attack', frames: 8, fps: 16 },
                { name: 'death', frames: 8, fps: 10 }
            ]
        };

        return sprites[type] || sprites.character;
    }

    getSpriteSize(style) {
        const sizes = {
            pixel: { width: 64, height: 64, scale: '@1x' },
            hd: { width: 128, height: 128, scale: '@1x' },
            fullhd: { width: 256, height: 256, scale: '@1x' }
        };

        return sizes[style] || sizes.pixel;
    }

    async specifyAnimation(params) {
        const {
            type = 'character',
            action = 'idle',
            style = 'cartoon',
            duration = 1000
        } = params;

        return {
            success: true,
            animation: {
                type,
                action,
                style,
                duration,
                specs: {
                    fps: style === 'pixel' ? 12 : 24,
                    easing: this.getEasingFunction(style),
                    loop: true,
                    pingPong: false
                },
                boneStructure: this.getBoneStructure(type),
                keyframes: this.generateKeyframes(type, action)
            }
        };
    }

    getEasingFunction(style) {
        const easings = {
            pixel: 'step',
            cartoon: 'easeOutBack',
            realistic: 'easeInOutCubic',
            modern: 'easeOutQuart'
        };

        return easings[style] || 'linear';
    }

    getBoneStructure(type) {
        const bones = {
            character: {
                root: { x: 0, y: 0 },
                torso: { parent: 'root', x: 0, y: -10 },
                head: { parent: 'torso', x: 0, y: -20 },
                leftArm: { parent: 'torso', x: -10, y: -5 },
                rightArm: { parent: 'torso', x: 10, y: -5 },
                leftLeg: { parent: 'root', x: -5, y: 10 },
                rightLeg: { parent: 'root', x: 5, y: 10 }
            },
            enemy: {
                root: { x: 0, y: 0 },
                body: { parent: 'root', x: 0, y: -5 },
                head: { parent: 'body', x: 0, y: -15 },
                appendages: { parent: 'body', count: 4 }
            }
        };

        return bones[type] || bones.character;
    }

    generateKeyframes(type, action) {
        const keyframes = {
            idle: [
                { frame: 0, pose: 'standing', duration: 250 },
                { frame: 1, pose: 'breathing', duration: 250 },
                { frame: 2, pose: 'standing', duration: 250 },
                { frame: 3, pose: 'breathing', duration: 250 }
            ],
            walk: [
                { frame: 0, pose: 'left_foot_forward', duration: 125 },
                { frame: 1, pose: 'both_feet_center', duration: 125 },
                { frame: 2, pose: 'right_foot_forward', duration: 125 },
                { frame: 3, pose: 'both_feet_center', duration: 125 }
            ],
            jump: [
                { frame: 0, pose: 'crouch', duration: 100 },
                { frame: 1, pose: 'launch', duration: 100 },
                { frame: 2, pose: 'ascend', duration: 200 },
                { frame: 3, pose: 'peak', duration: 100 },
                { frame: 4, pose: 'descend', duration: 200 },
                { frame: 5, pose: 'land', duration: 100 }
            ],
            attack: [
                { frame: 0, pose: 'windup', duration: 150 },
                { frame: 1, pose: 'strike', duration: 100 },
                { frame: 2, pose: 'follow_through', duration: 150 },
                { frame: 3, pose: 'recover', duration: 200 }
            ]
        };

        return keyframes[action] || keyframes.idle;
    }

    async generateColorPalette(params) {
        const { theme = 'fantasy', style = 'cartoon', mood = 'balanced' } = params;

        return {
            success: true,
            palette: {
                primary: this.generateColorSet('primary', theme, mood),
                secondary: this.generateColorSet('secondary', theme, mood),
                accent: this.generateColorSet('accent', theme, mood),
                neutral: this.generateColorSet('neutral', theme, mood),
                semantic: {
                    success: '#10b981',
                    warning: '#f59e0b',
                    error: '#ef4444',
                    info: '#3b82f6'
                }
            },
            usage: this.getColorUsage(theme)
        };
    }

    generateColorSet(role, theme, mood) {
        const colors = {
            light: { saturation: 70, lightness: 65 },
            dark: { saturation: 60, lightness: 35 },
            muted: { saturation: 40, lightness: 50 }
        };

        const moodMod = colors[mood] || colors.light;

        const baseColors = {
            fantasy: { hue: 220 },
            scifi: { hue: 190 },
            retro: { hue: 25 },
            nature: { hue: 120 },
            horror: { hue: 0 }
        };

        const base = baseColors[theme] || baseColors.fantasy;

        return {
            main: `hsl(${base.hue}, ${moodMod.saturation}%, ${moodMod.lightness}%)`,
            dark: `hsl(${base.hue}, ${moodMod.saturation}%, ${moodMod.lightness - 20}%)`,
            light: `hsl(${base.hue}, ${moodMod.saturation}%, ${moodMod.lightness + 20}%)`
        };
    }

    getColorUsage(theme) {
        return {
            background: 'primary.dark',
            surface: 'primary.main',
            text: 'neutral.light',
            border: 'neutral.main',
            disabled: 'neutral.dark'
        };
    }

    async createStyleGuide(params) {
        const { style = 'cartoon', theme = 'fantasy' } = params;

        return {
            success: true,
            styleGuide: {
                name: `${theme}_${style}`,
                visualElements: this.styleGuides[style],
                colorUsage: this.getColorUsage(theme),
                typography: this.getTypography(style),
                iconography: this.getIconography(style),
                illustration: this.getIllustration(style)
            }
        };
    }

    getTypography(style) {
        const fonts = {
            pixel: { family: 'Press Start 2P', weights: [400] },
            cartoon: { family: 'Comic Neue', weights: [400, 700] },
            modern: { family: 'Inter', weights: [400, 500, 600, 700] },
            classic: { family: 'Crimson Pro', weights: [400, 600] }
        };

        return fonts[style] || fonts.modern;
    }

    getIconography(style) {
        return {
            style,
            strokeWidth: style === 'pixel' ? 2 : 1.5,
            size: style === 'pixel' ? 16 : 24,
            filled: style === 'flat'
        };
    }

    getIllustration(style) {
        return {
            lineWeight: style === 'pixel' ? 4 : 2,
            shadows: style !== 'flat' && style !== 'pixel',
            gradients: style === 'cartoon' || style === 'realistic',
            outlines: style !== 'flat'
        };
    }

    getPixelArtGuide() {
        return {
            style: 'pixel_art',
            resolution: 'multiples of 16',
            colors: 'limited palette (16-32 colors)',
            techniques: ['dithering', 'outlining', 'shading'],
            gridSize: 16,
            antiAliasing: false,
            animations: 'frame-by-frame'
        };
    }

    getFlatDesignGuide() {
        return {
            style: 'flat_design',
            colors: 'solid colors, minimal gradients',
            shadows: 'long shadows or no shadows',
            typography: 'sans-serif, bold weights',
            icons: 'outlined or filled, geometric',
            illustrations: 'simplified shapes'
        };
    }

    getCartoonGuide() {
        return {
            style: 'cartoon',
            lines: 'bold outlines (2-4px)',
            colors: 'vibrant, saturated',
            proportions: 'exaggerated features',
            shadows: 'soft, gradient shadows',
            highlights: 'specular highlights'
        };
    }

    getRealisticGuide() {
        return {
            style: 'realistic',
            lighting: 'dynamic, multi-source',
            textures: 'detailed PBR materials',
            animations: 'motion captured',
            shadows: 'real-time calculated',
            reflections: 'environment mapping'
        };
    }

    getNeonDesignGuide() {
        return {
            style: 'neon',
            colors: 'dark background, bright accents',
            effects: ['glow', 'bloom', 'light trails'],
            typography: 'futuristic, glowing',
            borders: 'neon outlines',
            animations: 'pulsing, flickering'
        };
    }
}

module.exports = { ArtAgent };
