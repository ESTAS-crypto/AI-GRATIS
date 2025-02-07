// src/utils/contextManager.js
export class ContextManager {
    constructor() {
        this.contexts = new Map();
    }

    addContext(sessionId, message) {
        if (!this.contexts.has(sessionId)) {
            this.contexts.set(sessionId, []);
        }
        const context = this.contexts.get(sessionId);
        context.push(message);
        if (context.length > 10) context.shift(); // Keep last 10 messages
    }

    getContext(sessionId) {
        return this.contexts.get(sessionId) || [];
    }
}