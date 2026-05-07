const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class TaskOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            maxConcurrentTasks: config.maxConcurrentTasks || 10,
            taskTimeout: config.taskTimeout || 300000,
            retryAttempts: config.retryAttempts || 3,
            enableParallelExecution: config.enableParallelExecution !== false,
            ...config
        };
        
        this.agents = new Map();
        this.messageQueue = null;
        this.knowledgeBase = null;
        this.tasks = new Map();
        this.taskHistory = [];
        this.activeWorkflows = new Map();
        this.metrics = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            averageExecutionTime: 0
        };
    }

    setMessageQueue(messageQueue) {
        this.messageQueue = messageQueue;
    }

    setKnowledgeBase(kb) {
        this.knowledgeBase = kb;
    }

    registerAgent(agent) {
        this.agents.set(agent.name, agent);
        agent.setMessageQueue(this.messageQueue);
        agent.setKnowledgeBase(this.knowledgeBase);
        console.log(`[Orchestrator] Registered agent: ${agent.name}`);
    }

    unregisterAgent(agentName) {
        if (this.agents.has(agentName)) {
            const agent = this.agents.get(agentName);
            agent.shutdown();
            this.agents.delete(agentName);
            console.log(`[Orchestrator] Unregistered agent: ${agentName}`);
        }
    }

    async initializeAgents() {
        console.log('[Orchestrator] Initializing all agents...');
        const initPromises = [];
        
        this.agents.forEach(agent => {
            initPromises.push(agent.initialize());
        });

        await Promise.all(initPromises);
        console.log('[Orchestrator] All agents initialized');
    }

    decomposeTask(taskDescription, context = {}) {
        const taskTypes = {
            'code': 'code',
            'code_generation': 'code',
            'refactor': 'code',
            'debug': 'code',
            'art': 'art',
            'design': 'design',
            'ui': 'art',
            'animation': 'art',
            'level': 'design',
            'gameplay': 'design',
            'test': 'qa',
            'qa': 'qa',
            'bug': 'qa',
            'performance': 'qa',
            'analytics': 'operations',
            'server': 'operations',
            'config': 'operations'
        };

        const keywords = taskDescription.toLowerCase();
        const subtasks = [];
        let primaryType = 'general';

        for (const [keyword, type] of Object.entries(taskTypes)) {
            if (keywords.includes(keyword)) {
                subtasks.push({
                    id: uuidv4(),
                    type,
                    description: `Handle ${keyword} aspects of: ${taskDescription}`,
                    priority: subtasks.length === 0 ? 'high' : 'normal'
                });
                if (subtasks.length === 1) {
                    primaryType = type;
                }
            }
        }

        if (subtasks.length === 0) {
            subtasks.push({
                id: uuidv4(),
                type: 'general',
                description: taskDescription,
                priority: 'normal'
            });
        }

        if (keywords.includes('full') || keywords.includes('complete') || keywords.includes('implement')) {
            if (!subtasks.find(t => t.type === 'code')) {
                subtasks.push({
                    id: uuidv4(),
                    type: 'code',
                    description: `Generate code for: ${taskDescription}`,
                    priority: 'high'
                });
            }
            if (!subtasks.find(t => t.type === 'art')) {
                subtasks.push({
                    id: uuidv4(),
                    type: 'art',
                    description: `Design art assets for: ${taskDescription}`,
                    priority: 'medium'
                });
            }
            if (!subtasks.find(t => t.type === 'qa')) {
                subtasks.push({
                    id: uuidv4(),
                    type: 'qa',
                    description: `Create tests for: ${taskDescription}`,
                    priority: 'medium'
                });
            }
        }

        return {
            id: uuidv4(),
            description: taskDescription,
            primaryType,
            subtasks,
            context
        };
    }

    async executeTask(taskDescription, options = {}) {
        const startTime = Date.now();
        const taskId = uuidv4();
        
        this.tasks.set(taskId, {
            id: taskId,
            description: taskDescription,
            status: 'decomposing',
            createdAt: startTime,
            options
        });

        this.metrics.totalTasks++;

        try {
            const decomposed = this.decomposeTask(taskDescription, options.context);
            
            this.tasks.set(taskId, {
                ...this.tasks.get(taskId),
                status: 'dispatching',
                decomposed
            });

            const results = await this.dispatchSubtasks(decomposed.subtasks, options);

            const executionTime = Date.now() - startTime;
            this.updateMetrics(executionTime, true);

            const finalResult = {
                taskId,
                description: taskDescription,
                success: true,
                results,
                executionTime,
                completedAt: new Date().toISOString()
            };

            this.taskHistory.push(finalResult);
            this.tasks.set(taskId, {
                ...this.tasks.get(taskId),
                status: 'completed',
                result: finalResult
            });

            this.emit('task:completed', finalResult);
            return finalResult;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.updateMetrics(executionTime, false);

            const failedResult = {
                taskId,
                description: taskDescription,
                success: false,
                error: error.message,
                executionTime,
                completedAt: new Date().toISOString()
            };

            this.taskHistory.push(failedResult);
            this.tasks.set(taskId, {
                ...this.tasks.get(taskId),
                status: 'failed',
                error: error.message
            });

            this.emit('task:failed', failedResult);
            throw error;
        }
    }

    async dispatchSubtasks(subtasks, options = {}) {
        const results = [];
        const agentMapping = {
            'code': ['CodeAgent'],
            'art': ['ArtAgent'],
            'design': ['DesignAgent'],
            'qa': ['QAAgent'],
            'operations': ['OperationsAgent'],
            'general': ['CodeAgent', 'DesignAgent']
        };

        if (this.config.enableParallelExecution && options.parallel !== false) {
            const parallelGroups = this.groupSubtasksForParallel(subtasks);
            
            for (const group of parallelGroups) {
                const groupPromises = group.map(subtask => 
                    this.executeSingleSubtask(subtask, agentMapping)
                );
                const groupResults = await Promise.allSettled(groupPromises);
                
                groupResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        results.push({
                            subtaskId: group[index].id,
                            success: false,
                            error: result.reason?.message || 'Unknown error'
                        });
                    }
                });
            }
        } else {
            for (const subtask of subtasks) {
                const result = await this.executeSingleSubtask(subtask, agentMapping);
                results.push(result);
            }
        }

        return this.aggregateResults(results);
    }

    groupSubtasksForParallel(subtasks) {
        const groups = [];
        let currentGroup = [];
        let currentLoad = 0;
        const maxLoad = this.config.maxConcurrentTasks;

        for (const subtask of subtasks) {
            const estimatedLoad = subtask.priority === 'high' ? 2 : 1;
            
            if (currentLoad + estimatedLoad > maxLoad) {
                groups.push(currentGroup);
                currentGroup = [subtask];
                currentLoad = estimatedLoad;
            } else {
                currentGroup.push(subtask);
                currentLoad += estimatedLoad;
            }
        }

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    }

    async executeSingleSubtask(subtask, agentMapping) {
        const targetAgents = agentMapping[subtask.type] || agentMapping['general'];
        let lastError = null;

        for (const agentName of targetAgents) {
            const agent = this.agents.get(agentName);
            if (!agent) {
                console.warn(`[Orchestrator] Agent not found: ${agentName}`);
                continue;
            }

            try {
                console.log(`[Orchestrator] Dispatching subtask to ${agentName}: ${subtask.description}`);
                
                const result = await this.executeWithTimeout(
                    () => agent.processTask(subtask.type, {
                        description: subtask.description,
                        priority: subtask.priority,
                        fullTask: subtask
                    }),
                    this.config.taskTimeout
                );

                return {
                    subtaskId: subtask.id,
                    agent: agentName,
                    success: true,
                    result,
                    completedAt: new Date().toISOString()
                };

            } catch (error) {
                console.error(`[Orchestrator] Agent ${agentName} failed:`, error.message);
                lastError = error;
            }
        }

        return {
            subtaskId: subtask.id,
            agent: null,
            success: false,
            error: lastError?.message || 'No available agents',
            completedAt: new Date().toISOString()
        };
    }

    async executeWithTimeout(fn, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Task timeout after ${timeout}ms`));
            }, timeout);

            fn()
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    aggregateResults(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        return {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            results,
            summary: successful.map(s => ({
                agent: s.agent,
                summary: this.summarizeResult(s.result)
            })),
            errors: failed.map(f => ({
                subtaskId: f.subtaskId,
                error: f.error
            }))
        };
    }

    summarizeResult(result) {
        if (typeof result === 'string') {
            return result.substring(0, 200) + (result.length > 200 ? '...' : '');
        }
        if (Array.isArray(result)) {
            return `Generated ${result.length} items`;
        }
        if (typeof result === 'object' && result !== null) {
            const keys = Object.keys(result);
            return `Object with ${keys.length} properties: ${keys.slice(0, 3).join(', ')}`;
        }
        return String(result);
    }

    updateMetrics(executionTime, success) {
        if (success) {
            this.metrics.completedTasks++;
            this.metrics.averageExecutionTime = 
                (this.metrics.averageExecutionTime * (this.metrics.completedTasks - 1) + executionTime) 
                / this.metrics.completedTasks;
        } else {
            this.metrics.failedTasks++;
        }
    }

    getStatus() {
        return {
            activeTasks: this.tasks.size,
            totalAgents: this.agents.size,
            registeredAgents: Array.from(this.agents.keys()),
            metrics: this.metrics,
            queueStats: this.messageQueue?.getQueueStats() || null
        };
    }

    getTaskHistory(limit = 10) {
        return this.taskHistory.slice(-limit).reverse();
    }

    async shutdown() {
        console.log('[Orchestrator] Shutting down...');
        
        for (const [taskId, task] of this.tasks) {
            if (task.status === 'dispatching' || task.status === 'decomposing') {
                this.tasks.set(taskId, {
                    ...task,
                    status: 'cancelled'
                });
            }
        }

        for (const agent of this.agents.values()) {
            await agent.shutdown();
        }

        console.log('[Orchestrator] Shutdown complete');
    }
}

module.exports = { TaskOrchestrator };
