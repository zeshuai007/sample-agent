const { CodeAgent } = require('./code-agent');
const { ArtAgent } = require('./art-agent');
const { DesignAgent } = require('./design-agent');
const { QAAgent } = require('./qa-agent');
const { OperationsAgent } = require('./operations-agent');

const agents = {
    CodeAgent,
    ArtAgent,
    DesignAgent,
    QAAgent,
    OperationsAgent
};

function createAgent(type, config = {}) {
    const AgentClass = agents[type + 'Agent'];
    if (!AgentClass) {
        throw new Error(`Unknown agent type: ${type}`);
    }
    return new AgentClass(config);
}

function getAllAgentTypes() {
    return Object.keys(agents).map(type => ({
        type: type.replace('Agent', '').toLowerCase(),
        name: type,
        class: agents[type]
    }));
}

function getAgentCapabilities(type) {
    const AgentClass = agents[type + 'Agent'];
    if (!AgentClass) {
        return null;
    }
    const instance = new AgentClass();
    return instance.capabilities;
}

module.exports = {
    CodeAgent,
    ArtAgent,
    DesignAgent,
    QAAgent,
    OperationsAgent,
    agents,
    createAgent,
    getAllAgentTypes,
    getAgentCapabilities
};
