const { v4: uuidv4 } = require('uuid');

class BaseAgent {
    constructor(config) {
        this.id = config.id || uuidv4();
        this.name = config.name || `Agent_${this.id.slice(0, 8)}`;
        this.role = config.role || 'general';
        this.description = config.description || '';
        this.capabilities = config.capabilities || [];
        this.messageQueue = null;
        this.knowledgeBase = null;
        this.llmClient = null;
        this.isRunning = false;
        this.messageHandlers = new Map();
        this.context = {
            tasks: new Map(),
            memory: [],
            preferences: {}
        };
    }

    setMessageQueue(messageQueue) {
        this.messageQueue = messageQueue;
    }

    setKnowledgeBase(kb) {
        this.knowledgeBase = kb;
    }

    setLlmClient(client) {
        this.llmClient = client;
    }

    async initialize() {
        console.log(`[${this.name}] Initializing agent...`);
        this.setupMessageHandlers();
        this.isRunning = true;
        console.log(`[${this.name}] Agent initialized successfully`);
    }

    setupMessageHandlers() {
        this.registerHandler('task_request', this.handleTaskRequest.bind(this));
        this.registerHandler('task_response', this.handleTaskResponse.bind(this));
        this.registerHandler('event_notification', this.handleEvent.bind(this));
        this.registerHandler('query', this.handleQuery.bind(this));
    }

    registerHandler(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }

    async handleMessage(message) {
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            try {
                return await handler(message);
            } catch (error) {
                console.error(`[${this.name}] Error handling message:`, error);
                return {
                    success: false,
                    error: error.message
                };
            }
        } else {
            console.warn(`[${this.name}] No handler for message type: ${message.type}`);
            return { handled: false };
        }
    }

    async handleTaskRequest(message) {
        console.log(`[${this.name}] Received task: ${message.content.task}`);
        
        const taskId = message.id;
        this.context.tasks.set(taskId, {
            message,
            status: 'processing',
            startTime: Date.now()
        });

        try {
            const result = await this.processTask(message.content.task, message.content.params);
            
            this.context.tasks.set(taskId, {
                ...this.context.tasks.get(taskId),
                status: 'completed',
                result,
                endTime: Date.now()
            });

            if (this.messageQueue) {
                const response = this.messageQueue.createResponse(message, result, true);
                this.messageQueue.publish(response);
            }

            return { success: true, result };
        } catch (error) {
            this.context.tasks.set(taskId, {
                ...this.context.tasks.get(taskId),
                status: 'failed',
                error: error.message,
                endTime: Date.now()
            });

            if (this.messageQueue) {
                const response = this.messageQueue.createResponse(message, { error: error.message }, false);
                this.messageQueue.publish(response);
            }

            return { success: false, error: error.message };
        }
    }

    async handleTaskResponse(message) {
        console.log(`[${this.name}] Received response from ${message.from}`);
        
        if (message.correlation_id) {
            const parentTask = this.context.tasks.get(message.correlation_id);
            if (parentTask) {
                parentTask.subTaskResults = parentTask.subTaskResults || [];
                parentTask.subTaskResults.push({
                    from: message.from,
                    result: message.content.result,
                    success: message.content.success
                });
            }
        }

        return { handled: true };
    }

    async handleEvent(message) {
        console.log(`[${this.name}] Received event: ${message.content.event}`);
        
        this.context.memory.push({
            type: 'event',
            event: message.content.event,
            data: message.content.data,
            timestamp: message.timestamp
        });

        return { handled: true };
    }

    async handleQuery(message) {
        console.log(`[${this.name}] Received query: ${message.content.query}`);
        
        const response = await this.processQuery(message.content.query, message.content.context);
        
        if (this.messageQueue) {
            const responseMsg = {
                id: uuidv4(),
                type: 'query_response',
                from: this.name,
                to: message.from,
                content: {
                    query: message.content.query,
                    response
                },
                timestamp: new Date().toISOString()
            };
            this.messageQueue.publish(responseMsg);
        }

        return { handled: true, response };
    }

    async processTask(task, params) {
        throw new Error(`${this.name} must implement processTask method`);
    }

    async processQuery(query, context) {
        throw new Error(`${this.name} must implement processQuery method`);
    }

    async callLlm(prompt, options = {}) {
        if (!this.llmClient) {
            throw new Error('LLM client not configured');
        }

        try {
            const response = await this.llmClient.generate({
                prompt,
                ...options
            });
            return response;
        } catch (error) {
            console.error(`[${this.name}] LLM call failed:`, error);
            throw error;
        }
    }

    async storeToKnowledge(key, value) {
        if (this.knowledgeBase) {
            await this.knowledgeBase.store(this.id, key, value);
        }
    }

    async retrieveFromKnowledge(key) {
        if (this.knowledgeBase) {
            return await this.knowledgeBase.retrieve(this.id, key);
        }
        return null;
    }

    addToMemory(type, content) {
        this.context.memory.push({
            type,
            content,
            timestamp: Date.now()
        });

        if (this.context.memory.length > 1000) {
            this.context.memory = this.context.memory.slice(-500);
        }
    }

    getMemory(filter = {}) {
        let memory = this.context.memory;
        
        if (filter.type) {
            memory = memory.filter(m => m.type === filter.type);
        }
        if (filter.since) {
            memory = memory.filter(m => m.timestamp > filter.since);
        }
        
        return memory;
    }

    sendMessage(to, type, content, priority = 'normal') {
        if (!this.messageQueue) {
            throw new Error('Message queue not configured');
        }

        const message = this.messageQueue.createRequest(this.name, to, type, content, priority);
        return this.messageQueue.publish(message);
    }

    broadcastEvent(eventType, data) {
        if (!this.messageQueue) {
            throw new Error('Message queue not configured');
        }

        const event = this.messageQueue.createEvent(this.name, eventType, data);
        return this.messageQueue.publish(event);
    }

    getStatus() {
        return {
            id: this.id,
            name: this.name,
            role: this.role,
            isRunning: this.isRunning,
            activeTasks: Array.from(this.context.tasks.values()).filter(t => t.status === 'processing').length,
            totalTasks: this.context.tasks.size,
            memorySize: this.context.memory.length
        };
    }

    async shutdown() {
        console.log(`[${this.name}] Shutting down...`);
        this.isRunning = false;
        
        for (const [taskId, task] of this.context.tasks) {
            if (task.status === 'processing') {
                task.status = 'cancelled';
            }
        }
        
        console.log(`[${this.name}] Shutdown complete`);
    }
}

module.exports = { BaseAgent };
