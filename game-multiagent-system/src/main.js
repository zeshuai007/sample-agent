const { MessageQueue } = require('./core/message-queue');
const { KnowledgeBase } = require('./core/knowledge-base');
const { LlmClient } = require('./core/llm-client');
const { TaskOrchestrator } = require('./orchestrator/orchestrator');
const { CodeAgent } = require('./agents/code-agent');
const { ArtAgent } = require('./agents/art-agent');
const { DesignAgent } = require('./agents/design-agent');
const { QAAgent } = require('./agents/qa-agent');
const { OperationsAgent } = require('./agents/operations-agent');
const { OpenCodeAdapter } = require('./integrations/opencode-adapter');

class GameMultiAgentSystem {
    constructor(config = {}) {
        this.config = {
            llmProvider: config.llmProvider || 'mock',
            llmApiKey: config.llmApiKey || process.env.OPENAI_API_KEY,
            maxConcurrentTasks: config.maxConcurrentTasks || 10,
            taskTimeout: config.taskTimeout || 300000,
            enableParallelExecution: config.enableParallelExecution !== false,
            ...config
        };

        this.messageQueue = null;
        this.knowledgeBase = null;
        this.llmClient = null;
        this.orchestrator = null;
        this.agents = new Map();
        this.opencodeAdapter = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            console.log('[System] Already initialized');
            return this;
        }

        console.log('[System] Initializing Game Multi-Agent System...');
        console.log(`[System] LLM Provider: ${this.config.llmProvider}`);
        console.log(`[System] Parallel Execution: ${this.config.enableParallelExecution}`);

        this.messageQueue = new MessageQueue();
        console.log('[System] Message Queue initialized');

        this.knowledgeBase = new KnowledgeBase({
            maxEntries: 10000,
            ttl: 7 * 24 * 60 * 60 * 1000
        });
        console.log('[System] Knowledge Base initialized');

        this.llmClient = new LlmClient({
            provider: this.config.llmProvider,
            apiKey: this.config.llmApiKey
        });
        await this.llmClient.initialize();
        console.log('[System] LLM Client initialized');

        this.orchestrator = new TaskOrchestrator({
            maxConcurrentTasks: this.config.maxConcurrentTasks,
            taskTimeout: this.config.taskTimeout,
            enableParallelExecution: this.config.enableParallelExecution
        });
        this.orchestrator.setMessageQueue(this.messageQueue);
        this.orchestrator.setKnowledgeBase(this.knowledgeBase);
        console.log('[System] Task Orchestrator initialized');

        await this.initializeAgents();

        this.opencodeAdapter = new OpenCodeAdapter(this.orchestrator);
        console.log('[System] OpenCode Adapter initialized');

        this.initialized = true;
        console.log('[System] System initialization complete');

        return this;
    }

    async initializeAgents() {
        console.log('[System] Initializing agents...');

        const codeAgent = new CodeAgent({
            name: 'CodeAgent',
            capabilities: ['frontend_development', 'game_engine_integration', 'api_development']
        });
        codeAgent.setLlmClient(this.llmClient);
        this.agents.set('CodeAgent', codeAgent);
        this.orchestrator.registerAgent(codeAgent);
        console.log('[System] CodeAgent registered');

        const artAgent = new ArtAgent({
            name: 'ArtAgent',
            capabilities: ['ui_design', 'sprite_planning', 'color_schemes', 'animation_specs']
        });
        artAgent.setLlmClient(this.llmClient);
        this.agents.set('ArtAgent', artAgent);
        this.orchestrator.registerAgent(artAgent);
        console.log('[System] ArtAgent registered');

        const designAgent = new DesignAgent({
            name: 'DesignAgent',
            capabilities: ['gameplay_design', 'level_design', 'balance_calculation', 'narrative_design']
        });
        designAgent.setLlmClient(this.llmClient);
        this.agents.set('DesignAgent', designAgent);
        this.orchestrator.registerAgent(designAgent);
        console.log('[System] DesignAgent registered');

        const qaAgent = new QAAgent({
            name: 'QAAgent',
            capabilities: ['functional_testing', 'automation_testing', 'performance_testing']
        });
        qaAgent.setLlmClient(this.llmClient);
        this.agents.set('QAAgent', qaAgent);
        this.orchestrator.registerAgent(qaAgent);
        console.log('[System] QAAgent registered');

        const operationsAgent = new OperationsAgent({
            name: 'OperationsAgent',
            capabilities: ['server_configuration', 'analytics', 'monitoring', 'deployment']
        });
        operationsAgent.setLlmClient(this.llmClient);
        this.agents.set('OperationsAgent', operationsAgent);
        this.orchestrator.registerAgent(operationsAgent);
        console.log('[System] OperationsAgent registered');

        await this.orchestrator.initializeAgents();
        console.log('[System] All agents initialized');
    }

    async generateGame(gameType, options = {}) {
        if (!this.initialized) {
            throw new Error('System not initialized. Call initialize() first.');
        }

        console.log(`[System] Generating ${gameType} game...`);
        console.log(`[System] Options:`, options);

        const startTime = Date.now();

        try {
            const result = await this.opencodeAdapter.generateGame(gameType, options);

            const executionTime = Date.now() - startTime;
            console.log(`[System] Generation completed in ${executionTime}ms`);

            return {
                success: true,
                result,
                executionTime,
                metadata: {
                    gameType,
                    options,
                    completedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('[System] Generation failed:', error);
            throw error;
        }
    }

    async processTask(taskDescription, options = {}) {
        if (!this.initialized) {
            throw new Error('System not initialized. Call initialize() first.');
        }

        console.log(`[System] Processing task: ${taskDescription}`);
        return await this.orchestrator.executeTask(taskDescription, options);
    }

    async generateCode(params) {
        const codeAgent = this.agents.get('CodeAgent');
        if (!codeAgent) {
            throw new Error('CodeAgent not available');
        }

        return await codeAgent.processTask('code', params);
    }

    async designArt(params) {
        const artAgent = this.agents.get('ArtAgent');
        if (!artAgent) {
            throw new Error('ArtAgent not available');
        }

        return await artAgent.processTask('art', params);
    }

    async designGame(params) {
        const designAgent = this.agents.get('DesignAgent');
        if (!designAgent) {
            throw new Error('DesignAgent not available');
        }

        return await designAgent.processTask('design', params);
    }

    async runTests(params) {
        const qaAgent = this.agents.get('QAAgent');
        if (!qaAgent) {
            throw new Error('QAAgent not available');
        }

        return await qaAgent.processTask('test', params);
    }

    async analyzePerformance(params) {
        const operationsAgent = this.agents.get('OperationsAgent');
        if (!operationsAgent) {
            throw new Error('OperationsAgent not available');
        }

        return await operationsAgent.processTask('performance', params);
    }

    async sendMessage(from, to, content, priority = 'normal') {
        const message = this.messageQueue.createRequest(from, to, content, priority);
        return this.messageQueue.publish(message);
    }

    async broadcastEvent(from, eventType, data) {
        const event = this.messageQueue.createEvent(from, eventType, data);
        return this.messageQueue.publish(event);
    }

    async storeKnowledge(key, value, metadata = {}) {
        return await this.knowledgeBase.store('system', key, value, metadata);
    }

    async retrieveKnowledge(key) {
        return await this.knowledgeBase.retrieve('system', key);
    }

    async searchKnowledge(query, options = {}) {
        return await this.knowledgeBase.search(query, options);
    }

    getStatus() {
        return {
            initialized: this.initialized,
            orchestrator: this.orchestrator?.getStatus() || null,
            agents: Array.from(this.agents.entries()).map(([name, agent]) => ({
                name,
                status: agent.getStatus()
            })),
            messageQueue: this.messageQueue?.getQueueStats() || null,
            knowledgeBase: this.knowledgeBase?.getStats() || null,
            llmClient: this.llmClient?.getStatus() || null
        };
    }

    getAgent(name) {
        return this.agents.get(name) || null;
    }

    getAllAgents() {
        return Array.from(this.agents.values()).map(agent => agent.getStatus());
    }

    async exportKnowledge() {
        return await this.knowledgeBase.export();
    }

    async importKnowledge(data) {
        await this.knowledgeBase.import(data);
    }

    async clearKnowledge(agentId = null) {
        await this.knowledgeBase.clear(agentId);
    }

    async getTaskHistory(limit = 10) {
        return this.orchestrator.getTaskHistory(limit);
    }

    async cleanupExpiredKnowledge() {
        return await this.knowledgeBase.cleanupExpired();
    }

    async reset() {
        console.log('[System] Resetting system...');

        this.messageQueue.clearCompleted();

        await this.knowledgeBase.clear();

        this.orchestrator.tasks.clear();

        console.log('[System] System reset complete');
    }

    async shutdown() {
        if (!this.initialized) {
            return;
        }

        console.log('[System] Shutting down...');

        await this.orchestrator.shutdown();

        this.initialized = false;

        console.log('[System] Shutdown complete');
    }
}

async function createSystem(config = {}) {
    const system = new GameMultiAgentSystem(config);
    await system.initialize();
    return system;
}

module.exports = { GameMultiAgentSystem, createSystem };

if (require.main === module) {
    (async () => {
        console.log('='.repeat(60));
        console.log('Game Multi-Agent System - Demo');
        console.log('='.repeat(60));
        console.log('');

        const system = await createSystem({
            llmProvider: 'mock',
            enableParallelExecution: true
        });

        console.log('');
        console.log('System Status:');
        console.log(JSON.stringify(system.getStatus(), null, 2));
        console.log('');

        console.log('Testing Code Generation...');
        const codeResult = await system.generateCode({
            description: 'Simple platformer player controller',
            language: 'javascript',
            framework: 'phaser'
        });
        console.log('Code Result:', JSON.stringify(codeResult.success, null, 2));
        console.log('');

        console.log('Testing Art Design...');
        const artResult = await system.designArt({
            gameType: 'platformer',
            theme: 'fantasy',
            style: 'pixel'
        });
        console.log('Art Result:', JSON.stringify(artResult.success, null, 2));
        console.log('');

        console.log('Testing Game Design...');
        const designResult = await system.designGame({
            gameType: 'platformer',
            genre: 'action',
            theme: 'fantasy'
        });
        console.log('Design Result:', JSON.stringify(designResult.success, null, 2));
        console.log('');

        console.log('Testing Full Task Processing...');
        const taskResult = await system.processTask('Create a game with player movement and enemies');
        console.log('Task Result:', JSON.stringify(taskResult.success, null, 2));
        console.log('');

        console.log('='.repeat(60));
        console.log('Demo Complete');
        console.log('='.repeat(60));

        await system.shutdown();
    })().catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
}
