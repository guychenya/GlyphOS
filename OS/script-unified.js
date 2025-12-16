/**
 * GlyphOS Unified - Core Logic
 * Implements the text-first, single-canvas operating system concept.
 * Features: Rich Text (Markdown), Tables, Mermaid Diagrams.
 */

class UnifiedOS {
    constructor() {
        // State
        this.provider = 'ollama'; // 'ollama' | 'groq'
        this.model = 'llama2';
        this.style = 'balanced'; // 'focused' | 'balanced' | 'creative'
        
        this.ollamaUrl = 'http://127.0.0.1:11434';
        this.groqApiKey = localStorage.getItem('glyphos_groq_key') || '';
        this.groqModel = 'mixtral-8x7b-32768';
        
        this.history = [];
        this.isGenerating = false;
        this.isConnected = false;
        this.hasStarted = false; // Tracks if user has interacted

        // Config
        this.styles = {
            focused: 0.1,
            balanced: 0.4,
            creative: 0.8
        };

        // DOM Elements
        this.dom = {
            input: document.getElementById('cmd-input'),
            canvas: document.getElementById('canvas-content'),
            onboarding: document.getElementById('onboarding-card'),
            statusConn: document.getElementById('status-conn'),
            statusText: document.getElementById('status-text'),
            statusProvider: document.getElementById('status-provider'),
            providerSelect: document.getElementById('provider-select'),
            modelList: document.getElementById('model-list'),
            appGrid: document.getElementById('app-grid')
        };

        this.init();
    }

    init() {
        this.loadSettings();
        this.setupListeners();
        this.updateUI();
        this.initRichText();
        
        // Auto-connect
        this.checkConnection();
    }

    initRichText() {
        // Initialize Mermaid
        if (window.mermaid) {
            mermaid.initialize({ startOnLoad: false, theme: 'default' });
        }
        
        // Configure Marked
        if (window.marked) {
            marked.setOptions({
                breaks: true, // Enable line breaks
                gfm: true,    // GitHub Flavored Markdown
                headerIds: false
            });
        }
    }

    setupListeners() {
        // Input Handling
        this.dom.input.addEventListener('keydown', (e) => this.handleInputKey(e));
        
        // Provider Change
        this.dom.providerSelect.addEventListener('change', (e) => {
            this.provider = e.target.value;
            this.updateUI();
            this.checkConnection();
            this.saveSettings();
        });

        // Global Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== this.dom.input) {
                e.preventDefault();
                this.dom.input.focus();
                this.dom.input.value = '/';
            }
        });
    }

    handleInputKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = this.dom.input.value.trim();
            if (!text) return;

            // Hide onboarding if first interaction
            if (!this.hasStarted) {
                this.hasStarted = true;
                this.dom.onboarding.style.display = 'none';
            }

            this.processInput(text);
            this.dom.input.value = '';
        }
    }

    async processInput(text) {
        // 1. Check for Commands
        if (text.startsWith('/')) {
            const [cmd, ...args] = text.slice(1).split(' ');
            this.handleCommand(cmd.toLowerCase(), args);
            return;
        }

        // 2. Check for Provider Override (@groq ...)
        let tempProvider = null;
        if (text.startsWith('@')) {
            const match = text.match(/^@(\w+)\s+(.+)$/);
            if (match) {
                const providerName = match[1].toLowerCase();
                if (['groq', 'ollama'].includes(providerName)) {
                    tempProvider = providerName;
                    text = match[2];
                }
            }
        }

        // 3. Normal Chat Generation
        this.appendBlock('user', text);
        
        if (!this.isConnected && !tempProvider) {
            this.appendBlock('system', 'System is offline. Check connection settings.');
            return;
        }

        await this.generateResponse(text, tempProvider);
    }

    handleCommand(cmd, args) {
        switch(cmd) {
            case 'help':
                this.appendBlock('system', `
## 🛠️ Command Reference

| Command | Description | Example |
| :--- | :--- | :--- |
| \`/clear\` | Clears the canvas history | \`/clear\` |
| \`/key\` | Set API Key for Cloud Providers | \`/key sk-1234...\` |
| \`/reset\` | Reset context and memory | \`/reset\` |
| \`@provider\` | Switch provider for one message | \`@groq Analyze this\` |

### Shortcuts
* **Cmd/Ctrl + K**: Focus Command Bar
* **/**: Quick Command Access
                `);
                break;
            case 'clear':
                this.dom.canvas.innerHTML = '';
                // Don't show onboarding again unless reset
                break;
            case 'key':
                if (args[0]) {
                    this.groqApiKey = args[0];
                    localStorage.setItem('glyphos_groq_key', this.groqApiKey);
                    this.appendBlock('system', '**✅ API Key updated successfully.**');
                    this.checkConnection();
                } else {
                    this.appendBlock('system', 'Usage: `/key <your_api_key>`');
                }
                break;
            default:
                this.appendBlock('system', `❌ Unknown command: \`/${cmd}\``);
        }
    }

    async generateResponse(prompt, overrideProvider = null) {
        if (this.isGenerating) return;
        this.isGenerating = true;
        this.setFocusMode(true);

        const activeProvider = overrideProvider || this.provider;
        const temp = this.styles[this.style];
        
        // Create response block
        const responseId = 'resp-' + Date.now();
        this.appendBlock('assistant', '', responseId);
        const contentEl = document.getElementById(responseId).querySelector('.block-content');
        
        let fullResponseText = '';

        try {
            if (activeProvider === 'ollama') {
                await this.streamOllama(prompt, this.model, temp, contentEl, (text) => {
                    fullResponseText = text;
                    this.renderRichContent(contentEl, fullResponseText);
                    this.scrollToBottom();
                });
            } else if (activeProvider === 'groq') {
                await this.streamGroq(prompt, this.groqModel, temp, contentEl, (text) => {
                    fullResponseText = text;
                    this.renderRichContent(contentEl, fullResponseText);
                    this.scrollToBottom();
                });
            }
        } catch (err) {
            contentEl.innerHTML += `\n\n**⚠️ Error:** ${err.message}`;
        } finally {
            this.isGenerating = false;
            this.setFocusMode(false);
            
            // Final render pass to ensure Mermaid diagrams are drawn
            this.renderRichContent(contentEl, fullResponseText, true);
            this.scrollToBottom();
        }
    }

    // Helper to render Markdown + Mermaid
    renderRichContent(element, markdownText, isFinal = false) {
        if (!window.marked) {
            element.textContent = markdownText;
            return;
        }

        // 1. Render Markdown to HTML
        element.innerHTML = marked.parse(markdownText);

        // 2. Handle Mermaid Diagrams (only on final pass or stable blocks to avoid flickering)
        // For streaming, we might only want to render mermaid at the end, 
        // OR we can try to detect complete blocks. 
        // Here, we'll scan for code blocks marked as 'mermaid'.
        
        const codeBlocks = element.querySelectorAll('code.language-mermaid');
        codeBlocks.forEach((codeBlock, index) => {
            const pre = codeBlock.parentElement;
            const source = codeBlock.textContent;
            
            // Create a container for the diagram
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.id = `mermaid-${Date.now()}-${index}`;
            div.textContent = source; // Mermaid needs raw text initially
            
            // Replace the pre/code block with the div
            pre.replaceWith(div);
            
            // Render
            try {
                mermaid.init(undefined, div);
            } catch (e) {
                console.warn('Mermaid render error:', e);
                div.innerHTML = `<p style="color:red">Mermaid Error: ${e.message}</p>`;
            }
        });
    }

    scrollToBottom() {
        const mainCanvas = document.getElementById('main-canvas');
        mainCanvas.scrollTop = mainCanvas.scrollHeight;
    }

    async streamOllama(prompt, model, temp, element, onUpdate) {
        const response = await fetch(`${this.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                options: { temperature: temp },
                stream: true
            })
        });

        if (!response.ok) throw new Error('Ollama connection failed');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (!line) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        fullText += json.response;
                        onUpdate(fullText);
                    }
                } catch (e) { console.warn(e); }
            }
        }
    }

    async streamGroq(prompt, model, temp, element, onUpdate) {
        if (!this.groqApiKey) throw new Error('Groq API Key missing. Use /key to set it.');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: model,
                temperature: temp,
                stream: true
            })
        });

        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.trim().startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '').trim();
                    if (dataStr === '[DONE]') break;
                    
                    try {
                        const json = JSON.parse(dataStr);
                        if (json.choices && json.choices[0].delta.content) {
                            fullText += json.choices[0].delta.content;
                            onUpdate(fullText);
                        }
                    } catch (e) {}
                }
            }
        }
    }

    appendBlock(type, content, id = null) {
        const block = document.createElement('div');
        block.className = `block ${type}`;
        if (id) block.id = id;

        const author = type === 'user' ? 'You' : (type === 'system' ? 'System' : 'Assistant');
        const meta = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Basic inner HTML structure
        block.innerHTML = `
            <div class="block-header">
                <span class="block-author">${author}</span>
                <span class="block-meta">${meta}</span>
            </div>
            <div class="block-content"></div>
        `;

        // Render content immediately using the helper
        const contentEl = block.querySelector('.block-content');
        this.renderRichContent(contentEl, content, true);

        this.dom.canvas.appendChild(block);
        this.scrollToBottom();
    }

    async checkConnection() {
        this.updateStatus('Connecting...', 'pending');
        
        if (this.provider === 'ollama') {
            try {
                const res = await fetch(`${this.ollamaUrl}/api/tags`);
                if (res.ok) {
                    const data = await res.json();
                    this.updateModelList(data.models.map(m => m.name));
                    this.updateStatus('Connected', 'connected');
                    this.isConnected = true;
                } else {
                    throw new Error('Ollama unreachable');
                }
            } catch (e) {
                this.updateStatus('Offline', 'disconnected');
                this.isConnected = false;
                this.dom.modelList.innerHTML = '<div style="color:var(--danger); font-size:0.8rem">Ollama unavailable. Is it running?</div>';
            }
        } else if (this.provider === 'groq') {
            if (this.groqApiKey) {
                this.updateStatus('Ready', 'connected');
                this.isConnected = true;
                this.updateModelList(['mixtral-8x7b-32768', 'llama2-70b-4096', 'gemma-7b-it']);
            } else {
                this.updateStatus('No API Key', 'disconnected');
                this.isConnected = false;
                this.dom.modelList.innerHTML = '<div style="font-size:0.8rem">Use /key command to set API key</div>';
            }
        }
    }

    updateModelList(models) {
        let html = '';
        models.forEach(m => {
            const isActive = (this.provider === 'ollama' && m === this.model) || 
                           (this.provider === 'groq' && m === this.groqModel);
            html += `<span class="model-pill ${isActive ? 'active' : ''}" onclick="window.os.setModel('${m}')">${m}</span>`;
        });
        this.dom.modelList.innerHTML = html;
    }

    setModel(m) {
        if (this.provider === 'ollama') this.model = m;
        else this.groqModel = m;
        this.updateModelList(Array.from(this.dom.modelList.querySelectorAll('.model-pill')).map(el => el.textContent));
    }

    updateStatus(text, state) {
        this.dom.statusText.textContent = text;
        this.dom.statusProvider.textContent = this.provider === 'groq' ? 'Groq' : 'Ollama';
        
        this.dom.statusConn.className = 'status-dot';
        if (state === 'connected') this.dom.statusConn.classList.add('active');
        
        const pill = document.getElementById('status-pill');
        if (pill) {
             pill.style.borderColor = state === 'connected' ? 'var(--success)' : 'var(--border)';
        }
    }

    setFocusMode(enable) {
        const check = document.getElementById('chk-focus');
        if (check && check.checked && enable) {
            document.getElementById('sidebar-left').style.opacity = '0.3';
            document.getElementById('sidebar-right').style.opacity = '0.3';
        } else {
            document.getElementById('sidebar-left').style.opacity = '1';
            document.getElementById('sidebar-right').style.opacity = '1';
        }
    }

    updateUI() {
        this.dom.providerSelect.value = this.provider;
        
        // Update Style Buttons
        document.querySelectorAll('.style-btn').forEach(btn => {
            if (btn.textContent.toLowerCase() === this.style) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    saveSettings() {
        localStorage.setItem('glyphos_settings', JSON.stringify({
            provider: this.provider,
            style: this.style,
            model: this.model
        }));
    }

    loadSettings() {
        const data = localStorage.getItem('glyphos_settings');
        if (data) {
            const settings = JSON.parse(data);
            this.provider = settings.provider || 'ollama';
            this.style = settings.style || 'balanced';
            this.model = settings.model || 'llama2';
        }
    }
}

// Global functions for UI interaction
window.toggleSidebar = (side) => {
    const grid = document.getElementById('app-grid');
    if (side === 'left') grid.classList.toggle('left-collapsed');
    if (side === 'right') grid.classList.toggle('right-collapsed');
};

window.toggleCommandPalette = () => {
    const input = document.getElementById('cmd-input');
    input.focus();
    if (input.value === '') {
        input.value = '/';
    }
}

window.setStyle = (style) => {
    window.os.style = style;
    window.os.updateUI();
    window.os.saveSettings();
};

window.createNewDoc = () => {
    window.os.appendBlock('system', '**New thread context created.**');
    window.os.dom.canvas.innerHTML = '';
};

window.triggerFileUpload = () => {
    document.getElementById('file-upload-hidden').click();
};

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.os = new UnifiedOS();
});
