const { v4: uuidv4 } = require('uuid');

class MessageQueue {
    constructor() {
        this.messages = new Map();
        this.subscribers = new Map();
        this.processingQueue = [];
        this.completedMessages = new Map();
    }

    publish(message) {
        const messageId = message.id || uuidv4();
        message.id = messageId;
        message.timestamp = message.timestamp || new Date().toISOString();
        
        this.messages.set(messageId, {
            ...message,
            status: 'published',
            createdAt: Date.now()
        });

        this.notifySubscribers(message);
        
        return messageId;
    }

    subscribe(agentId, callback) {
        if (!this.subscribers.has(agentId)) {
            this.subscribers.set(agentId, []);
        }
        this.subscribers.get(agentId).push(callback);

        return () => {
            const callbacks = this.subscribers.get(agentId);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    subscribeToAll(callback) {
        return this.subscribe('__all__', callback);
    }

    notifySubscribers(message) {
        const allCallbacks = this.subscribers.get('__all__') || [];
        const targetedCallbacks = this.subscribers.get(message.to) || [];
        
        [...allCallbacks, ...targetedCallbacks].forEach(callback => {
            try {
                callback(message);
            } catch (error) {
                console.error(`Error in message subscriber:`, error);
            }
        });
    }

    getMessage(messageId) {
        return this.messages.get(messageId) || this.completedMessages.get(messageId);
    }

    getMessagesByAgent(agentId) {
        const agentMessages = [];
        this.messages.forEach((msg, id) => {
            if (msg.to === agentId || msg.from === agentId) {
                agentMessages.push({ id, ...msg });
            }
        });
        return agentMessages;
    }

    getPendingMessages(agentId) {
        const pending = [];
        this.messages.forEach((msg, id) => {
            if ((msg.to === agentId || msg.to === 'all') && 
                (msg.status === 'published' || msg.status === 'delivered')) {
                pending.push({ id, ...msg });
            }
        });
        return pending;
    }

    acknowledgeMessage(messageId, agentId) {
        const message = this.messages.get(messageId);
        if (message) {
            message.status = 'delivered';
            message.deliveredTo = agentId;
            message.deliveredAt = Date.now();
        }
    }

    completeMessage(messageId, result) {
        const message = this.messages.get(messageId);
        if (message) {
            message.status = 'completed';
            message.result = result;
            message.completedAt = Date.now();
            
            this.completedMessages.set(messageId, message);
            this.messages.delete(messageId);
        }
    }

    failMessage(messageId, error) {
        const message = this.messages.get(messageId);
        if (message) {
            message.status = 'failed';
            message.error = error;
            message.failedAt = Date.now();
            
            this.completedMessages.set(messageId, message);
            this.messages.delete(messageId);
        }
    }

    cancelMessage(messageId) {
        const message = this.messages.get(messageId);
        if (message) {
            message.status = 'cancelled';
            message.cancelledAt = Date.now();
            
            this.completedMessages.set(messageId, message);
            this.messages.delete(messageId);
        }
    }

    getQueueStats() {
        const stats = {
            total: this.messages.size,
            byStatus: {},
            byPriority: { high: 0, normal: 0, low: 0 },
            averageWaitTime: 0
        };

        let totalWaitTime = 0;
        let processedCount = 0;

        this.messages.forEach(msg => {
            stats.byStatus[msg.status] = (stats.byStatus[msg.status] || 0) + 1;
            stats.byPriority[msg.priority] = (stats.byPriority[msg.priority] || 0) + 1;
            
            if (msg.status === 'completed' || msg.status === 'failed') {
                totalWaitTime += (msg.completedAt || msg.failedAt) - msg.createdAt;
                processedCount++;
            }
        });

        if (processedCount > 0) {
            stats.averageWaitTime = totalWaitTime / processedCount;
        }

        stats.completedTotal = this.completedMessages.size;

        return stats;
    }

    clearCompleted(beforeTimestamp = null) {
        if (beforeTimestamp) {
            this.completedMessages.forEach((msg, id) => {
                if (msg.completedAt < beforeTimestamp || msg.failedAt < beforeTimestamp) {
                    this.completedMessages.delete(id);
                }
            });
        } else {
            this.completedMessages.clear();
        }
    }

    createRequest(from, to, task, params = {}, priority = 'normal') {
        return {
            id: uuidv4(),
            type: 'task_request',
            from,
            to,
            content: {
                task,
                params,
                data: null
            },
            timestamp: new Date().toISOString(),
            priority,
            correlation_id: null
        };
    }

    createResponse(originalMessage, result, success = true) {
        return {
            id: uuidv4(),
            type: 'task_response',
            from: originalMessage.to,
            to: originalMessage.from,
            content: {
                task: originalMessage.content.task,
                result,
                success,
                original_message_id: originalMessage.id
            },
            timestamp: new Date().toISOString(),
            priority: originalMessage.priority,
            correlation_id: originalMessage.id
        };
    }

    createEvent(from, eventType, data) {
        return {
            id: uuidv4(),
            type: 'event_notification',
            from,
            to: 'all',
            content: {
                event: eventType,
                data
            },
            timestamp: new Date().toISOString(),
            priority: 'normal',
            correlation_id: null
        };
    }
}

module.exports = { MessageQueue };
