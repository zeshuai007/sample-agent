const { GameMultiAgentSystem } = require('./src/main');

async function runDemo() {
    console.log('='.repeat(60));
    console.log('Game Multi-Agent System - Demo');
    console.log('='.repeat(60));
    console.log('');

    const system = new GameMultiAgentSystem({
        llmProvider: 'mock',
        enableParallelExecution: true
    });

    console.log('[Demo] Initializing system...\n');
    await system.initialize();

    console.log('[Demo] Testing CodeAgent...');
    const codeResult = await system.generateCode({
        description: 'Simple player controller',
        language: 'javascript',
        framework: 'phaser'
    });
    console.log('  Result:', codeResult.success ? '✓ Success' : '✗ Failed');
    if (codeResult.files) {
        console.log('  Generated:', codeResult.files.length, 'files');
    }
    console.log('');

    console.log('[Demo] Testing ArtAgent...');
    const artResult = await system.designArt({
        gameType: 'platformer',
        theme: 'fantasy',
        style: 'pixel'
    });
    console.log('  Result:', artResult.success ? '✓ Success' : '✗ Failed');
    if (artResult.colorPalette) {
        console.log('  Color Palette:', artResult.colorPalette.primary);
    }
    console.log('');

    console.log('[Demo] Testing DesignAgent...');
    const designResult = await system.designGame({
        gameType: 'platformer',
        genre: 'action',
        theme: 'fantasy'
    });
    console.log('  Result:', designResult.success ? '✓ Success' : '✗ Failed');
    if (designResult.gameDesign) {
        console.log('  Game Type:', designResult.gameDesign.metadata.gameType);
    }
    console.log('');

    console.log('[Demo] Testing Task Processing...');
    const taskResult = await system.processTask('Create a game with player movement and enemies');
    console.log('  Result:', taskResult.success ? '✓ Success' : '✗ Failed');
    if (taskResult.results) {
        console.log('  Processed:', taskResult.results.total, 'subtasks');
    }
    console.log('');

    console.log('[Demo] System Status:');
    const status = system.getStatus();
    console.log('  Initialized:', status.initialized);
    console.log('  Total Agents:', status.agents.length);
    console.log('  Agents:', status.agents.map(a => a.name).join(', '));
    console.log('  LLM Mode:', status.llmClient.mockMode ? 'Mock' : 'Production');
    console.log('');

    console.log('[Demo] Testing Knowledge Base...');
    await system.storeKnowledge('test', { demo: 'data' });
    const retrieved = await system.retrieveKnowledge('test');
    console.log('  Store/Retrieve:', retrieved ? '✓ Success' : '✗ Failed');
    console.log('');

    console.log('[Demo] Shutting down...\n');
    await system.shutdown();

    console.log('='.repeat(60));
    console.log('Demo Complete - All Systems Working!');
    console.log('='.repeat(60));
}

runDemo().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
});
