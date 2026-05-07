# Quick Start Guide

## Installation

```bash
cd game-multiagent-system
npm install
```

## Basic Usage

### 1. Initialize the System

```javascript
const { GameMultiAgentSystem, createSystem } = require('./src/main');

async function main() {
    const system = await createSystem({
        llmProvider: 'mock',
        enableParallelExecution: true
    });
    
    // Your code here...
    
    await system.shutdown();
}

main();
```

### 2. Generate Game Code

```javascript
const { GameMultiAgentSystem } = require('./src/main');

async function generateGame() {
    const system = new GameMultiAgentSystem({
        llmProvider: 'openai',
        llmApiKey: process.env.OPENAI_API_KEY
    });
    
    await system.initialize();
    
    const result = await system.generateCode({
        description: 'Player controller with movement and jump',
        language: 'javascript',
        framework: 'phaser'
    });
    
    console.log('Generated files:', result.files);
    await system.shutdown();
}

generateGame();
```

### 3. Design Game Art

```javascript
const { GameMultiAgentSystem } = require('./src/main');

async function designGame() {
    const system = await createSystem();
    
    const artPlan = await system.designArt({
        gameType: 'platformer',
        theme: 'fantasy',
        style: 'pixel'
    });
    
    console.log('Color Palette:', artPlan.colorPalette);
    console.log('Asset List:', artPlan.assetList);
    
    await system.shutdown();
}
```

### 4. Design Complete Game

```javascript
const { GameMultiAgentSystem } = require('./src/main');

async function designGame() {
    const system = await createSystem();
    
    const design = await system.designGame({
        gameType: 'platformer',
        genre: 'action',
        theme: 'fantasy',
        targetAudience: 'all_ages'
    });
    
    console.log('Core Mechanics:', design.gameDesign.coreMechanics);
    console.log('Progression:', design.gameDesign.progression);
    
    await system.shutdown();
}
```

### 5. Run Tests

```javascript
const { GameMultiAgentSystem } = require('./src/main');

async function runTests() {
    const system = await createSystem();
    
    const testResult = await system.runTests({
        component: 'PlayerController',
        framework: 'jest'
    });
    
    console.log('Generated tests:', testResult.tests);
    await system.shutdown();
}
```

### 6. Process Custom Task

```javascript
const { GameMultiAgentSystem } = require('./src/main');

async function processCustomTask() {
    const system = await createSystem();
    
    const result = await system.processTask(
        'Create a platformer game with player movement, collectibles, and enemies'
    );
    
    console.log('Task completed:', result.success);
    console.log('Results:', result.results);
    
    await system.shutdown();
}
```

### 7. OpenCode Integration

```javascript
const { GameMultiAgentSystem } = require('./src/main');

async function generateFullGame() {
    const system = await createSystem();
    
    const result = await system.generateGame('platformer', {
        engine: 'phaser',
        style: 'pixel',
        features: [
            'player_movement',
            'collectibles',
            'enemies',
            'scoring'
        ],
        theme: 'fantasy'
    });
    
    console.log('Generated project at:', result.result.projectPath);
    await system.shutdown();
}
```

### 8. Multi-Agent Collaboration

```javascript
const { GameMultiAgentSystem } = require('./src/main');

async function multiAgentCollab() {
    const system = await createSystem();
    
    // Send message between agents
    await system.sendMessage(
        'DesignAgent',
        'CodeAgent',
        { task: 'implement_level', level: 1 }
    );
    
    // Broadcast event
    await system.broadcastEvent(
        'Orchestrator',
        'task_completed',
        { taskId: '123', result: 'success' }
    );
    
    await system.shutdown();
}
```

### 9. Knowledge Management

```javascript
const { GameMultiAgentSystem } = require('./src/main');

async function manageKnowledge() {
    const system = await createSystem();
    
    // Store knowledge
    await system.storeKnowledge('design_patterns', {
        patterns: ['singleton', 'factory', 'observer']
    });
    
    // Retrieve knowledge
    const patterns = await system.retrieveKnowledge('design_patterns');
    
    // Search knowledge
    const results = await system.searchKnowledge('singleton');
    
    await system.shutdown();
}
```

### 10. System Status and Monitoring

```javascript
const { GameMultiAgentSystem } = require('./src/main');

async function monitorSystem() {
    const system = await createSystem();
    
    // Get system status
    const status = system.getStatus();
    console.log('System Status:', status);
    
    // Get specific agent
    const codeAgent = system.getAgent('CodeAgent');
    console.log('CodeAgent Status:', codeAgent.getStatus());
    
    // Get task history
    const history = await system.getTaskHistory(10);
    console.log('Recent Tasks:', history);
    
    await system.shutdown();
}
```

## Configuration Options

```javascript
const system = new GameMultiAgentSystem({
    // LLM Configuration
    llmProvider: 'openai',        // 'openai', 'anthropic', 'local', 'mock'
    llmApiKey: 'your-api-key',    // Or use OPENAI_API_KEY env var
    
    // Task Configuration
    maxConcurrentTasks: 10,       // Max parallel tasks
    taskTimeout: 300000,          // 5 minutes
    enableParallelExecution: true, // Enable parallel task execution
    
    // Knowledge Base Configuration
    knowledgeBase: {
        maxEntries: 10000,
        ttl: 7 * 24 * 60 * 60 * 1000  // 7 days
    }
});
```

## Running the Demo

```bash
npm run dev
```

This will run the demo script in `src/main.js`.

## Running Tests

```bash
npm test
```

## Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Available Agents

| Agent | Description | Capabilities |
|-------|-------------|--------------|
| CodeAgent | Game code development | frontend, game engine, API, debugging |
| ArtAgent | Art and visual design | UI design, sprites, animation, color schemes |
| DesignAgent | Game design and balance | gameplay, levels, economy, narrative |
| QAAgent | Testing and quality assurance | functional, performance, automation |
| OperationsAgent | Server and deployment | configuration, monitoring, scaling |

## Agent Communication

### Send Message

```javascript
await agent.sendMessage('target_agent', 'task_type', content, priority);
```

### Broadcast Event

```javascript
await agent.broadcastEvent('event_type', eventData);
```

## Next Steps

1. Check `SPEC.md` for detailed architecture
2. Check `IMPLEMENTATION.md` for implementation details
3. Check `tests/agent-tests.js` for usage examples
4. Integrate with OpenCode using `OpenCodeAdapter`
