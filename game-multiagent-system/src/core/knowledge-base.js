const { v4: uuidv4 } = require('uuid');

class KnowledgeBase {
    constructor(config = {}) {
        this.storage = new Map();
        this.vectorIndex = new Map();
        this.metadata = new Map();
        this.config = {
            maxEntries: config.maxEntries || 10000,
            ttl: config.ttl || 7 * 24 * 60 * 60 * 1000,
            enableVectorSearch: config.enableVectorSearch !== false
        };
    }

    async store(agentId, key, value, metadata = {}) {
        const entry = {
            id: uuidv4(),
            agentId,
            key,
            value,
            metadata: {
                ...metadata,
                createdBy: agentId,
                createdAt: Date.now(),
                accessedAt: Date.now()
            },
            tags: metadata.tags || [],
            vector: metadata.vector || null
        };

        const storageKey = `${agentId}:${key}`;
        this.storage.set(storageKey, entry);
        this.metadata.set(storageKey, {
            size: JSON.stringify(value).length,
            type: typeof value
        });

        if (entry.vector && this.config.enableVectorSearch) {
            this.vectorIndex.set(entry.id, entry);
        }

        this.enforceMaxSize();

        return entry.id;
    }

    async retrieve(agentId, key) {
        const storageKey = `${agentId}:${key}`;
        const entry = this.storage.get(storageKey);

        if (entry) {
            entry.metadata.accessedAt = Date.now();
            return entry.value;
        }

        return null;
    }

    async search(query, options = {}) {
        const results = [];
        const {
            agentId = null,
            tags = [],
            limit = 10,
            threshold = 0.5
        } = options;

        this.storage.forEach((entry, key) => {
            if (agentId && entry.agentId !== agentId) return;

            if (tags.length > 0) {
                const hasTag = tags.some(tag => entry.tags.includes(tag));
                if (!hasTag) return;
            }

            const queryLower = query.toLowerCase();
            const keyMatch = entry.key.toLowerCase().includes(queryLower);
            const valueMatch = typeof entry.value === 'string' && 
                               entry.value.toLowerCase().includes(queryLower);
            const tagMatch = entry.tags.some(tag => 
                tag.toLowerCase().includes(queryLower)
            );

            if (keyMatch || valueMatch || tagMatch) {
                const relevance = keyMatch ? 1.0 : (tagMatch ? 0.7 : 0.5);
                if (relevance >= threshold) {
                    results.push({
                        ...entry,
                        relevance
                    });
                }
            }
        });

        results.sort((a, b) => b.relevance - a.relevance);

        return results.slice(0, limit);
    }

    async retrieveByTag(tag, agentId = null) {
        const results = [];

        this.storage.forEach((entry) => {
            if (agentId && entry.agentId !== agentId) return;
            if (entry.tags.includes(tag)) {
                results.push(entry);
            }
        });

        return results;
    }

    async retrieveByAgent(agentId) {
        const results = [];
        this.storage.forEach((entry) => {
            if (entry.agentId === agentId) {
                results.push(entry);
            }
        });
        return results;
    }

    async update(agentId, key, updates) {
        const storageKey = `${agentId}:${key}`;
        const entry = this.storage.get(storageKey);

        if (entry) {
            Object.assign(entry.value, updates.value);
            entry.metadata.updatedAt = Date.now();
            if (updates.tags) {
                entry.tags = [...new Set([...entry.tags, ...updates.tags])];
            }
            return true;
        }

        return false;
    }

    async delete(agentId, key) {
        const storageKey = `${agentId}:${key}`;
        const entry = this.storage.get(storageKey);

        if (entry) {
            if (entry.vector) {
                this.vectorIndex.delete(entry.id);
            }
            this.storage.delete(storageKey);
            this.metadata.delete(storageKey);
            return true;
        }

        return false;
    }

    async clear(agentId = null) {
        if (agentId) {
            const keysToDelete = [];
            this.storage.forEach((entry, key) => {
                if (entry.agentId === agentId) {
                    keysToDelete.push(key);
                }
            });
            keysToDelete.forEach(key => {
                this.storage.delete(key);
                this.metadata.delete(key);
            });
        } else {
            this.storage.clear();
            this.metadata.clear();
            this.vectorIndex.clear();
        }
    }

    enforceMaxSize() {
        if (this.storage.size > this.config.maxEntries) {
            const entries = Array.from(this.storage.entries());
            entries.sort((a, b) => 
                (a[1].metadata.accessedAt || 0) - (b[1].metadata.accessedAt || 0)
            );

            const toDelete = entries.slice(0, entries.length - this.config.maxEntries);
            toDelete.forEach(([key, entry]) => {
                if (entry.vector) {
                    this.vectorIndex.delete(entry.id);
                }
                this.storage.delete(key);
                this.metadata.delete(key);
            });
        }
    }

    async cleanupExpired() {
        const now = Date.now();
        const keysToDelete = [];

        this.storage.forEach((entry, key) => {
            const age = now - entry.metadata.createdAt;
            if (age > this.config.ttl) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => {
            const entry = this.storage.get(key);
            if (entry && entry.vector) {
                this.vectorIndex.delete(entry.id);
            }
            this.storage.delete(key);
            this.metadata.delete(key);
        });

        return keysToDelete.length;
    }

    getStats() {
        let totalSize = 0;
        const agentStats = new Map();

        this.metadata.forEach((meta) => {
            totalSize += meta.size;
            agentStats.set(meta.type, (agentStats.get(meta.type) || 0) + 1);
        });

        return {
            totalEntries: this.storage.size,
            totalSize,
            byType: Object.fromEntries(agentStats),
            vectorIndexSize: this.vectorIndex.size,
            config: this.config
        };
    }

    async export() {
        const data = {};
        this.storage.forEach((entry, key) => {
            data[key] = {
                key: entry.key,
                value: entry.value,
                metadata: entry.metadata,
                tags: entry.tags
            };
        });
        return data;
    }

    async import(data) {
        for (const [storageKey, entry] of Object.entries(data)) {
            this.storage.set(storageKey, {
                ...entry,
                id: entry.id || uuidv4()
            });
            this.metadata.set(storageKey, {
                size: JSON.stringify(entry.value).length,
                type: typeof entry.value
            });

            if (entry.vector) {
                this.vectorIndex.set(entry.id, entry);
            }
        }
    }

    createNamespace(namespace) {
        return new KnowledgeBaseNamespace(this, namespace);
    }
}

class KnowledgeBaseNamespace {
    constructor(kb, namespace) {
        this.kb = kb;
        this.namespace = namespace;
    }

    async store(key, value, metadata = {}) {
        const fullKey = `${this.namespace}:${key}`;
        return await this.kb.store('namespace', fullKey, value, metadata);
    }

    async retrieve(key) {
        const fullKey = `${this.namespace}:${key}`;
        return await this.kb.retrieve('namespace', fullKey);
    }

    async search(query, options = {}) {
        return await this.kb.search(query, {
            ...options,
            tags: [...(options.tags || []), this.namespace]
        });
    }

    async list() {
        const results = [];
        this.kb.storage.forEach((entry, key) => {
            if (key.startsWith(`namespace:${this.namespace}:`)) {
                const shortKey = key.replace(`namespace:${this.namespace}:`, '');
                results.push({
                    key: shortKey,
                    value: entry.value,
                    metadata: entry.metadata
                });
            }
        });
        return results;
    }
}

module.exports = { KnowledgeBase, KnowledgeBaseNamespace };
