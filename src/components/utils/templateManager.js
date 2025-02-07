// src/utils/templateManager.js
export class TemplateManager {
    constructor() {
        this.loadTemplates();
    }

    loadTemplates() {
        const saved = localStorage.getItem('chatTemplates');
        this.templates = saved ? JSON.parse(saved) : [];
    }

    saveTemplates() {
        localStorage.setItem('chatTemplates', JSON.stringify(this.templates));
    }

    addTemplate(name, content) {
        this.templates.push({ id: Date.now(), name, content });
        this.saveTemplates();
    }

    getTemplates() {
        return this.templates;
    }
}