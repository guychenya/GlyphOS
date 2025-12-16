/**
 * GlyphOS Unified - Core Logic
 * Implements the text-first, single-canvas operating system concept.
 * Features: Rich Text (Markdown), Tables, Mermaid Diagrams, LaTeX Math.
 */

class UnifiedOS {
    constructor() {
        // State
        this.provider = 'ollama'; // 'ollama' | 'groq' | 'openai' | 'gemini' | 'openrouter'
        this.model = 'llama2';
        this.style = 'balanced'; // 'focused' | 'balanced' | 'creative'
        
        // Configuration & Keys
        this.ollamaUrl = 'http://127.0.0.1:11434';
        
        this.keys = {
            groq: localStorage.getItem('glyphos_groq_key') || '',
            openai: localStorage.getItem('glyphos_openai_key') || '',
            gemini: localStorage.getItem('glyphos_gemini_key') || '',
            openrouter: localStorage.getItem('glyphos_openrouter_key') || ''
        };

        // Default Models
        this.models = {
            ollama: 'llama2',
            groq: 'mixtral-8x7b-32768',
            openai: 'gpt-4-turbo',
            gemini: 'gemini-pro',
            openrouter: 'anthropic/claude-3-opus'
        };
        
        this.history = [];
        this.isGenerating = false;
        this.isConnected = false;
        this.hasStarted = false;

        // Temperature Presets
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
            appGrid: document.getElementById('app-grid'),
            // New API Key Elements
            apiKeyContainer: document.getElementById('api-key-container'),
            apiKeyInput: document.getElementById('api-key-input'),
            saveKeyBtn: document.getElementById('save-key-btn')
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
        if (window.mermaid) {
            mermaid.initialize({ 
                startOnLoad: false, 
                theme: 'base',
                securityLevel: 'loose',
                themeVariables: {
                    fontFamily: 'Inter',
                    primaryColor: '#e2e8f0',
                    primaryTextColor: '#1e293b',
                    lineColor: '#64748b'
                }
            });
        }
        if (window.marked) {
            marked.setOptions({
                breaks: true,
                gfm: true,
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

        // API Key Saving
        this.dom.saveKeyBtn.addEventListener('click', async () => {
            const key = this.dom.apiKeyInput.value.trim();
            if (key) {
                // Show loading state on button
                const originalIcon = this.dom.saveKeyBtn.innerHTML;
                this.dom.saveKeyBtn.innerHTML = '...';
                
                try {
                    // Validate before saving
                    if (this.provider !== 'ollama') {
                        await this.validateProviderConnection(this.provider, key);
                    }
                    
                    this.keys[this.provider] = key;
                    localStorage.setItem(`glyphos_${this.provider}_key`, key);
                    
                    // Success feedback
                    this.dom.saveKeyBtn.innerHTML = '<span style="color:var(--success)">✓</span>';
                    this.checkConnection();
                } catch (error) {
                    // Error feedback
                    this.dom.saveKeyBtn.innerHTML = '<span style="color:var(--danger)">✕</span>';
                    this.appendBlock('system', `⚠️ **API Key Validation Failed:** ${error.message}`);
                }

                setTimeout(() => {
                    this.dom.saveKeyBtn.innerHTML = originalIcon;
                }, 2000);
            }
        });

        // Global Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== this.dom.input && document.activeElement !== this.dom.apiKeyInput) {
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
                if (['groq', 'ollama', 'openai', 'gemini', 'openrouter'].includes(providerName)) {
                    tempProvider = providerName;
                    text = match[2];
                }
            }
        }

        // 3. Normal Chat Generation
        this.appendBlock('user', text);
        
        if (!this.isConnected && !tempProvider) {
            // Check if it's just a missing key for a cloud provider
            if (this.provider !== 'ollama' && !this.keys[this.provider]) {
                this.appendBlock('system', `⚠️ **Missing API Key** for ${this.provider}. Use the sidebar input or \`/key ${this.provider} <your_key>\` to set it.`);
                return;
            }
            if (this.provider === 'ollama') {
                 this.appendBlock('system', 'System is offline. Ensure Ollama is running.');
                 return;
            }
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
| \`/key\` | Set API Key for a provider | \`/key openai sk-...\` |
| \`/reset\` | Reset context and memory | \`/reset\` |
| \`@provider\` | Switch provider for one message | \`@gemini Analyze this\` |

### Supported Providers
* **Ollama** (Local)
* **Groq** (Cloud)
* **OpenAI** (Cloud)
* **Google Gemini** (Cloud)
* **OpenRouter** (Cloud)
`.trim());
                break;
            case 'clear':
                this.dom.canvas.innerHTML = '';
                break;
            case 'key':
                // Usage: /key <provider> <key>
                if (args.length >= 2) {
                    const provider = args[0].toLowerCase();
                    const key = args[1];
                    if (this.keys.hasOwnProperty(provider)) {
                        this.validateProviderConnection(provider, key).then(() => {
                            this.keys[provider] = key;
                            localStorage.setItem(`glyphos_${provider}_key`, key);
                            this.appendBlock('system', `**✅ API Key for ${provider} verified and updated.**`);
                            
                            // Update UI input if currently selected
                            if (this.provider === provider) {
                                this.dom.apiKeyInput.value = key;
                                this.checkConnection();
                            }
                        }).catch(err => {
                            this.appendBlock('system', `❌ **Validation Failed:** ${err.message}`);
                        });
                    } else {
                         this.appendBlock('system', `❌ Unknown provider: ${provider}. Supported: groq, openai, gemini, openrouter.`);
                    }
                } else {
                    this.appendBlock('system', 'Usage: `/key <provider> <your_api_key>`\nExample: `/key openai sk-1234...`');
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
        const activeModel = this.models[activeProvider];
        
        // Create response block
        const responseId = 'resp-' + Date.now();
        this.appendBlock('assistant', '', responseId);
        const contentEl = document.getElementById(responseId).querySelector('.block-content');
        
        let fullResponseText = '';

        // Helper for streaming updates
        const onUpdate = (text) => {
            fullResponseText = text;
            this.renderRichContent(contentEl, fullResponseText);
            this.scrollToBottom();
        };

        try {
            switch(activeProvider) {
                case 'ollama':
                    await this.streamOllama(prompt, activeModel, temp, onUpdate);
                    break;
                case 'groq':
                    await this.streamOpenAIStyle('https://api.groq.com/openai/v1/chat/completions', this.keys.groq, prompt, activeModel, temp, onUpdate);
                    break;
                case 'openai':
                    await this.streamOpenAIStyle('https://api.openai.com/v1/chat/completions', this.keys.openai, prompt, activeModel, temp, onUpdate);
                    break;
                case 'openrouter':
                    await this.streamOpenAIStyle('https://openrouter.ai/api/v1/chat/completions', this.keys.openrouter, prompt, activeModel, temp, onUpdate);
                    break;
                case 'gemini':
                    await this.streamGemini(prompt, activeModel, temp, onUpdate);
                    break;
                default:
                    throw new Error(`Provider ${activeProvider} not implemented.`);
            }
        } catch (err) {
            contentEl.innerHTML += `\n\n**⚠️ Error:** ${err.message}`;
        } finally {
            this.isGenerating = false;
            this.setFocusMode(false);
            
            // Final render pass
            this.renderRichContent(contentEl, fullResponseText, true);
            this.scrollToBottom();
        }
    }

    // --- Rich Content Renderer (Markdown + Math + Mermaid) ---
    renderRichContent(element, markdownText, isFinal = false) {
        if (!window.marked) {
            element.textContent = markdownText;
            return;
        }

        // 1. Math Pre-processing: Escape LaTeX to prevent Markdown mangling
        // Store math blocks in a map to restore later
        const mathBlocks = [];
        let processedText = markdownText;

        // Escape $$...$$
        processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
            mathBlocks.push({ type: 'display', tex: tex });
            return `%%%MATH${mathBlocks.length - 1}%%%`;
        });

        // Escape $...$
        processedText = processedText.replace(/\$([^\$\n]+?)\$/g, (match, tex) => {
            mathBlocks.push({ type: 'inline', tex: tex });
            return `%%%MATH${mathBlocks.length - 1}%%%`;
        });

        // 2. Render Markdown
        element.innerHTML = marked.parse(processedText);

        // 3. Restore and Render Math using KaTeX
        if (window.renderMathInElement) {
            // Restore placeholders with valid HTML/KaTeX ready content
            // However, it's safer to traverse text nodes or re-inject.
            // Simplified approach: Regex replace on innerHTML (careful with XSS, but we control the placeholders)
            
            element.innerHTML = element.innerHTML.replace(/%%%MATH(\d+)%%%/g, (match, index) => {
                const block = mathBlocks[parseInt(index)];
                if (!block) return match;
                
                try {
                    const html = katex.renderToString(block.tex, {
                        displayMode: block.type === 'display',
                        throwOnError: false
                    });
                    return html;
                } catch (e) {
                    return block.tex;
                }
            });
        }

        // 4. Handle Mermaid (only on final pass or specifically detected blocks)
        if (isFinal || markdownText.includes('```mermaid')) {
            const codeBlocks = element.querySelectorAll('code.language-mermaid');
            codeBlocks.forEach((codeBlock, index) => {
                const pre = codeBlock.parentElement;
                const source = codeBlock.textContent;
                
                const div = document.createElement('div');
                div.className = 'mermaid';
                div.id = `mermaid-${Date.now()}-${index}`;
                div.textContent = source;
                div.style.textAlign = 'center'; // Center alignment
                
                pre.replaceWith(div);
                
                try {
                    mermaid.init(undefined, div);
                } catch (e) {
                    console.warn('Mermaid render error:', e);
                    div.innerHTML = `<span style="color:red; font-size:0.8em">Diagram Error</span>`;
                }
            });
        }
    }

    scrollToBottom() {
        const mainCanvas = document.getElementById('main-canvas');
        mainCanvas.scrollTop = mainCanvas.scrollHeight;
    }

    // --- Streaming Providers ---

    async streamOllama(prompt, model, temp, onUpdate) {
        const response = await fetch(`${this.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, options: { temperature: temp }, stream: true })
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
                    if (json.response) { fullText += json.response; onUpdate(fullText); }
                } catch (e) {}
            }
        }
    }

    async streamOpenAIStyle(url, key, prompt, model, temp, onUpdate) {
        if (!key) throw new Error('API Key missing.');
        
        const headers = {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        };
        // OpenRouter needs extra headers
        if (url.includes('openrouter')) {
            headers['HTTP-Referer'] = window.location.href;
            headers['X-Title'] = 'GlyphOS';
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: model,
                temperature: temp,
                stream: true
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error (${response.status}): ${err}`);
        }

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
                        const content = json.choices && json.choices[0].delta.content;
                        if (content) { fullText += content; onUpdate(fullText); }
                    } catch (e) {}
                }
            }
        }
    }

    async streamGemini(prompt, model, temp, onUpdate) {
        if (!this.keys.gemini) throw new Error('Gemini API Key missing.');
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.keys.gemini}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: temp }
            })
        });

        if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            if (buffer.startsWith('[')) buffer = buffer.substring(1);
            if (buffer.endsWith(']')) buffer = buffer.substring(0, buffer.length - 1);
            
            const parts = buffer.split(',\n').filter(p => p.trim() !== '');
        }
        
        // Fallback: Non-streaming Gemini for stability in this version
        const simpleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.keys.gemini}`, {
             method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: temp }
            })
        });
        
        const json = await simpleResponse.json();
        if (json.candidates && json.candidates[0].content) {
            onUpdate(json.candidates[0].content.parts[0].text);
        }
    }

    appendBlock(type, content, id = null) {
        const block = document.createElement('div');
        block.className = `block ${type}`;
        if (id) block.id = id;

        const author = type === 'user' ? 'You' : (type === 'system' ? 'System' : 'Assistant');
        const meta = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        block.innerHTML = `
            <div class="block-header">
                <span class="block-author">${author}</span>
                <span class="block-meta">${meta}</span>
            </div>
            <div class="block-content"></div>
        `;

        const contentEl = block.querySelector('.block-content');
        this.renderRichContent(contentEl, content, true);

        this.dom.canvas.appendChild(block);
        this.scrollToBottom();
    }

    async validateProviderConnection(provider, key) {
        let url = '';
        let headers = { 'Authorization': `Bearer ${key}` };
        
        switch (provider) {
            case 'openai':
                url = 'https://api.openai.com/v1/models';
                break;
            case 'groq':
                url = 'https://api.groq.com/openai/v1/models';
                break;
            case 'openrouter':
                url = 'https://openrouter.ai/api/v1/models';
                break;
            case 'gemini':
                url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
                headers = {}; // API key is in query param
                break;
            case 'ollama':
                return true; // Ollama validation is separate
            default:
                throw new Error('Unknown provider');
        }

        try {
            const response = await fetch(url, { method: 'GET', headers: headers });
            if (!response.ok) {
                let msg = response.statusText;
                try {
                    const data = await response.json();
                    msg = data.error?.message || msg;
                } catch(e) {}
                throw new Error(msg);
            }
            return true;
        } catch (e) {
            throw e;
        }
    }

    async checkConnection() {
        this.updateStatus('Checking...', 'pending');
        
        const p = this.provider;
        
        if (p === 'ollama') {
            try {
                const res = await fetch(`${this.ollamaUrl}/api/tags`);
                if (res.ok) {
                    const data = await res.json();
                    this.updateModelList(data.models.map(m => m.name));
                    this.updateStatus('Connected', 'connected');
                    this.isConnected = true;
                } else throw new Error();
            } catch (e) {
                this.updateStatus('Offline', 'disconnected');
                this.isConnected = false;
                this.dom.modelList.innerHTML = '<div style="color:var(--danger); font-size:0.8rem">Ollama unavailable</div>';
            }
        } else {
            // Cloud providers
            if (this.keys[p]) {
                try {
                    await this.validateProviderConnection(p, this.keys[p]);
                    this.updateStatus('Connected', 'connected');
                    this.isConnected = true;
                    this.updateModelList(this.getDefaultModels(p));
                } catch (e) {
                    this.updateStatus('Invalid Key', 'disconnected');
                    this.isConnected = false;
                    this.dom.modelList.innerHTML = `<div style="color:var(--danger); font-size:0.8rem">${e.message}</div>`;
                }
            } else {
                this.updateStatus('No API Key', 'disconnected');
                this.isConnected = false;
                this.dom.modelList.innerHTML = '<div style="font-size:0.8rem">Enter API Key above</div>';
            }
        }
    }

    getDefaultModels(provider) {
        switch(provider) {
            case 'groq': return ['mixtral-8x7b-32768', 'llama2-70b-4096', 'gemma-7b-it'];
            case 'openai': return ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
            case 'gemini': return ['gemini-pro', 'gemini-1.5-pro'];
            case 'openrouter': return ['anthropic/claude-3-opus', 'anthropic/claude-3-sonnet', 'google/gemini-pro-1.5'];
            default: return [];
        }
    }

    updateModelList(models) {
        let html = '';
        models.forEach(m => {
            const activeModel = this.models[this.provider];
            const isActive = m === activeModel;
            html += `<span class="model-pill ${isActive ? 'active' : ''}" onclick="window.os.setModel('${m}')">${m}</span>`;
        });
        this.dom.modelList.innerHTML = html;
    }

    setModel(m) {
        this.models[this.provider] = m;
        this.updateModelList(this.getDefaultModels(this.provider) || [m]);
    }

    updateStatus(text, state) {
        this.dom.statusText.textContent = text;
        this.dom.statusProvider.textContent = this.provider.charAt(0).toUpperCase() + this.provider.slice(1);
        
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
        
        // Handle API Key Input Visibility
        if (this.provider === 'ollama') {
            this.dom.apiKeyContainer.classList.add('hidden');
        } else {
            this.dom.apiKeyContainer.classList.remove('hidden');
            this.dom.apiKeyInput.value = this.keys[this.provider] || '';
            this.dom.apiKeyInput.placeholder = `Enter ${this.provider.charAt(0).toUpperCase() + this.provider.slice(1)} Key`;
        }
        
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
            models: this.models // Save model preferences per provider
        }));
    }

    loadSettings() {
        const data = localStorage.getItem('glyphos_settings');
        if (data) {
            const settings = JSON.parse(data);
            this.provider = settings.provider || 'ollama';
            this.style = settings.style || 'balanced';
            if (settings.models) this.models = { ...this.models, ...settings.models };
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
