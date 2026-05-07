const assert = require('assert');

async function runAgentTests() {
    console.log('Running Agent Tests...\n');

    try {
        await testMessageQueue();
        await testKnowledgeBase();
        await testBaseAgent();
        await testCodeAgent();
        await testArtAgent();
        await testDesignAgent();
        await testQAAgent();
        await testOperationsAgent();
        await testOrchestrator();
        await testMainSystem();

        console.log('\n✓ All tests passed!');
        return true;
    } catch (error) {
        console.error('\n✗ Tests failed:', error.message);
        return false;
    }
}

async function testMessageQueue() {
    console.log('Testing MessageQueue...');
    const { MessageQueue } = require('../src/core/message-queue');

    const mq = new MessageQueue();

    const request = mq.createRequest('agent1', 'agent2', 'test_task', { data: 'test' });
    assert(request.type === 'task_request');
    assert(request.from === 'agent1');
    assert(request.to === 'agent2');

    const msgId = mq.publish(request);
    assert(msgId !== null);

    const response = mq.createResponse(request, { result: 'success' }, true);
    assert(response.type === 'task_response');
    assert(response.correlation_id === request.id);

    const event = mq.createEvent('agent1', 'test_event', { data: 'event_data' });
    assert(event.type === 'event_notification');
    assert(event.to === 'all');

    console.log('  ✓ MessageQueue tests passed');
}

async function testKnowledgeBase() {
    console.log('Testing KnowledgeBase...');
    const { KnowledgeBase } = require('../src/core/knowledge-base');

    const kb = new KnowledgeBase();

    const entryId = await kb.store('agent1', 'test_key', { value: 'test_value' });
    assert(entryId !== null);

    const retrieved = await kb.retrieve('agent1', 'test_key');
    assert(retrieved.value === 'test_value');

    const searchResults = await kb.search('test');
    assert(searchResults.length > 0);

    const updated = await kb.update('agent1', 'test_key', { value: 'updated_value' });
    assert(updated === true);

    const deleted = await kb.delete('agent1', 'test_key');
    assert(deleted === true);

    console.log('  ✓ KnowledgeBase tests passed');
}

async function testBaseAgent() {
    console.log('Testing BaseAgent...');
    const { BaseAgent } = require('../src/core/agent-base');

    class TestAgent extends BaseAgent {
        async processTask(task, params) {
            return { processed: true, task, params };
        }
    }

    const agent = new TestAgent({
        name: 'TestAgent',
        role: 'testing'
    });

    assert(agent.name === 'TestAgent');
    assert(agent.role === 'testing');

    const status = agent.getStatus();
    assert(status.name === 'TestAgent');
    assert(status.isRunning === false);

    await agent.initialize();
    assert(agent.isRunning === true);

    agent.addToMemory('test', { data: 'test_memory' });
    const memory = agent.getMemory({ type: 'test' });
    assert(memory.length === 1);

    await agent.shutdown();
    assert(agent.isRunning === false);

    console.log('  ✓ BaseAgent tests passed');
}

async function testCodeAgent() {
    console.log('Testing CodeAgent...');
    const { CodeAgent } = require('../src/agents/code-agent');

    const agent = new CodeAgent();

    const result = await agent.processTask('code', {
        description: 'Test game component',
        language: 'javascript',
        framework: 'phaser'
    });

    assert(result.success === true);
    assert(result.files !== undefined);
    assert(result.files.length > 0);
    assert(result.files[0].language === 'javascript');

    const componentResult = await agent.processTask('game_component', {
        componentType: 'player',
        engine: 'phaser'
    });

    assert(componentResult.success === true);
    assert(componentResult.template === 'phaser');

    console.log('  ✓ CodeAgent tests passed');
}

async function testArtAgent() {
    console.log('Testing ArtAgent...');
    const { ArtAgent } = require('../src/agents/art-agent');

    const agent = new ArtAgent();

    const result = await agent.processTask('art', {
        gameType: 'platformer',
        theme: 'fantasy',
        style: 'pixel'
    });

    assert(result.success === true);
    assert(result.styleGuide !== undefined);
    assert(result.colorPalette !== undefined);
    assert(result.assetList !== undefined);

    const uiResult = await agent.processTask('ui', {
        gameType: 'platformer',
        uiStyle: 'modern'
    });

    assert(uiResult.success === true);
    assert(uiResult.layout !== undefined);

    console.log('  ✓ ArtAgent tests passed');
}

async function testDesignAgent() {
    console.log('Testing DesignAgent...');
    const { DesignAgent } = require('../src/agents/design-agent');

    const agent = new DesignAgent();

    const result = await agent.processTask('design', {
        gameType: 'platformer',
        genre: 'action',
        theme: 'fantasy'
    });

    assert(result.success === true);
    assert(result.gameDesign !== undefined);
    assert(result.gameDesign.coreMechanics !== undefined);

    const levelResult = await agent.processTask('level', {
        levelNumber: 1,
        difficulty: 'easy',
        gameType: 'platformer'
    });

    assert(levelResult.success === true);
    assert(levelResult.level !== undefined);
    assert(levelResult.level.metadata.number === 1);

    const balanceResult = await agent.processTask('balance', {
        baseDamage: 10,
        baseHealth: 100,
        difficulty: 'normal'
    });

    assert(balanceResult.success === true);
    assert(balanceResult.balance !== undefined);

    console.log('  ✓ DesignAgent tests passed');
}

async function testQAAgent() {
    console.log('Testing QAAgent...');
    const { QAAgent } = require('../src/agents/qa-agent');

    const agent = new QAAgent();

    const testResult = await agent.processTask('test', {
        component: 'PlayerController',
        framework: 'jest'
    });

    assert(testResult.success === true);
    assert(testResult.tests !== undefined);
    assert(testResult.tests.framework === 'jest');

    const qaResult = await agent.processTask('qa', {
        scope: 'critical',
        testTypes: ['functional']
    });

    assert(qaResult.success === true);
    assert(qaResult.qa !== undefined);

    const bugResult = await agent.processTask('bug', {
        description: 'Player cannot move',
        severity: 'high'
    });

    assert(bugResult.success === true);
    assert(bugResult.bug !== undefined);

    console.log('  ✓ QAAgent tests passed');
}

async function testOperationsAgent() {
    console.log('Testing OperationsAgent...');
    const { OperationsAgent } = require('../src/agents/operations-agent');

    const agent = new OperationsAgent();

    const opsResult = await agent.processTask('operations', {
        environment: 'production',
        scale: 'medium'
    });

    assert(opsResult.success === true);
    assert(opsResult.operations !== undefined);

    const serverResult = await agent.processTask('server', {
        gameType: 'multiplayer',
        maxPlayers: 100
    });

    assert(serverResult.success === true);
    assert(serverResult.serverConfig !== undefined);

    const analyticsResult = await agent.processTask('analytics', {
        metrics: ['players', 'revenue']
    });

    assert(analyticsResult.success === true);
    assert(analyticsResult.analytics !== undefined);

    console.log('  ✓ OperationsAgent tests passed');
}

async function testOrchestrator() {
    console.log('Testing TaskOrchestrator...');
    const { TaskOrchestrator } = require('../src/orchestrator/orchestrator');
    const { MessageQueue } = require('../src/core/message-queue');
    const { KnowledgeBase } = require('../src/core/knowledge-base');
    const { BaseAgent } = require('../src/core/agent-base');

    class MockAgent extends BaseAgent {
        async processTask(task, params) {
            return { success: true, task, result: 'processed' };
        }
    }

    const mq = new MessageQueue();
    const kb = new KnowledgeBase();
    const orchestrator = new TaskOrchestrator();

    orchestrator.setMessageQueue(mq);
    orchestrator.setKnowledgeBase(kb);

    const mockAgent = new MockAgent({ name: 'MockAgent' });
    orchestrator.registerAgent(mockAgent);

    await orchestrator.initializeAgents();

    const decomposed = orchestrator.decomposeTask('Create a game with code and art');
    assert(decomposed.subtasks.length > 0);

    const status = orchestrator.getStatus();
    assert(status.totalAgents === 1);

    await orchestrator.shutdown();

    console.log('  ✓ TaskOrchestrator tests passed');
}

async function testMainSystem() {
    console.log('Testing Main System...');
    const { GameMultiAgentSystem } = require('../src/main');

    const system = new GameMultiAgentSystem({
        llmProvider: 'mock',
        enableParallelExecution: false
    });

    await system.initialize();

    assert(system.initialized === true);
    assert(system.agents.size === 5);

    const codeResult = await system.generateCode({
        description: 'Test component',
        framework: 'phaser'
    });
    assert(codeResult.success === true);

    const artResult = await system.designArt({
        gameType: 'platformer'
    });
    assert(artResult.success === true);

    const designResult = await system.designGame({
        gameType: 'platformer'
    });
    assert(designResult.success === true);

    const status = system.getStatus();
    assert(status.initialized === true);
    assert(status.agents.length === 5);

    await system.shutdown();
    assert(system.initialized === false);

    console.log('  ✓ Main System tests passed');
}

runAgentTests()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
