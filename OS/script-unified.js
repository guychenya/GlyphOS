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
        this.theme = 'system'; // 'light' | 'dark' | 'system'
        this.streamResponses = true;
        this.ambientFocusMode = true;
        
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
            groq: 'llama-3.1-8b-instant',
            openai: 'gpt-3.5-turbo',
            gemini: 'gemini-pro',
            openrouter: 'mistralai/mistral-7b-instruct:free'
        };
        
        // System Prompt to enforce formatting
        this.systemPrompt = `You are GlyphOS, an advanced AI operating system interface.
- Format: Use strict Markdown.
- Lists: ALWAYS put a blank line before starting a list.
- Structure: Use paragraphs and vertical spacing for readability. Do not output dense blocks of text.
- Examples: When explaining concepts, show the RENDERED result, not the raw code block, unless asked for code.
- Diagrams: Use Mermaid.js syntax inside 
```mermaid blocks. Supported types: sequenceDiagram, graph TD, mindmap, pie, gantt.
- Math: Use LaTeX inside $$ (display) or $ (inline).
- Tone: Be concise, professional, and helpful.`;

        this.history = []; // Stores past chat threads
        this.commandHistory = []; // Stores last 5 executed commands for dropdown
        this.commandHistoryIndex = -1;
        this.isGenerating = false;
        this.isConnected = false;
        this.hasStarted = false; // To control onboarding card visibility

        // Temperature Presets
        this.tempPresets = {
            focused: 0.1,
            balanced: 0.4,
            creative: 0.8
        };

        // DOM Elements
        this.dom = {}; 
        this.initDomElements(); // Call to populate dom object *before* init()
        this.init();
    }

    initDomElements() {
        this.dom = {
            // Header
            viewDocsLink: document.getElementById('view-docs-link'),
            startTypingBtn: document.getElementById('start-typing-btn'),
            enterRunBtn: document.getElementById('enter-run-btn'),

            // Workspace
            workspace: document.getElementById('workspace'),
            newThreadBtn: document.querySelector('.workspace-actions button:first-child'), // New Thread button
            uploadContextBtnLabel: document.querySelector('.workspace-actions label[for="file-upload-hidden"]'), // Upload Context button is a label
            fileUploadHidden: document.getElementById('file-upload-hidden'),
            historyList: document.getElementById('history-list'),
            onboarding: document.getElementById('onboarding-card'),
            canvas: document.getElementById('canvas-content'),

            // Command Input
            cmdInputArea: document.querySelector('.command-input-area'), 
            cmdInput: document.getElementById('cmd-input'),
            clearCmdBtn: document.querySelector('.clear-cmd-btn'),
            runCmdBtn: document.querySelector('.run-cmd-btn'),
            cmdHistoryDropdown: document.querySelector('.command-history-dropdown'),

            // Control Panel
            controlPanel: document.getElementById('control-panel'),
            providerSelect: document.getElementById('provider-select'),
            apiKeyContainer: document.getElementById('api-key-container'),
            apiKeyInput: document.getElementById('api-key-input'),
            saveKeyBtn: document.getElementById('save-key-btn'),
            modelList: document.getElementById('model-list'),
            tempFocused: document.getElementById('temp-focused'),
            tempBalanced: document.getElementById('temp-balanced'),
            tempCreative: document.getElementById('temp-creative'),
            chkStream: document.getElementById('chk-stream'),
            chkFocus: document.getElementById('chk-focus'),
            themeToggle: document.getElementById('theme-toggle'),
            
            // Status Bar
            statusBar: document.getElementById('status-bar'),
            statusText: document.getElementById('status-text'),
            statusSpinner: document.getElementById('status-spinner'),
            statusProvider: document.getElementById('status-provider'),
            indicatorStreaming: document.getElementById('indicator-streaming'),
            indicatorFocus: document.getElementById('indicator-focus'),

            appGrid: document.getElementById('app-grid')
        };
    }

    init() {
        this.loadSettings();
        this.applyTheme(); // Apply theme before setting up listeners
        this.setupListeners();
        this.updateUI();
        this.initRichText();
        this.renderHistoryList();
        
        // Auto-connect
        this.checkConnection();
        this.showWelcome(); // Show welcome/onboarding based on history
    }

    initRichText() {
        if (window.mermaid) {
            mermaid.initialize({
                startOnLoad: false, 
                theme: 'base',
                securityLevel: 'loose',
                themeVariables: {
                    fontFamily: 'var(--font-sans)',
                    primaryColor: 'var(--text-primary)',
                    lineColor: 'var(--text-secondary)',
                    fontSize: '14px'
                }
            });
        }
        if (window.marked) {
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false // Prevent mangling of @
            });
        }
    }

    setupListeners() {
        // Header Actions
        if (this.dom.startTypingBtn) {
            this.dom.startTypingBtn.addEventListener('click', () => this.dom.cmdInput.focus());
        }
        if (this.dom.enterRunBtn) {
            this.dom.enterRunBtn.addEventListener('click', () => this.processCommandInput());
        }

        // Command Input Handling
        this.dom.cmdInput.addEventListener('keydown', (e) => this.handleCommandInputKey(e));
        this.dom.cmdInput.addEventListener('input', () => this.updateCommandInputButtons());
        this.dom.cmdInput.addEventListener('focus', () => this.showCommandHistory());
        this.dom.cmdInput.addEventListener('blur', () => setTimeout(() => this.hideCommandHistory(), 100)); // Delay to allow click on history item
        if (this.dom.clearCmdBtn) {
            this.dom.clearCmdBtn.addEventListener('click', () => this.clearCommandInput());
        }
        if (this.dom.runCmdBtn) {
            this.dom.runCmdBtn.addEventListener('click', () => this.processCommandInput());
        }
        // Handle clicks on command history items
        this.dom.cmdHistoryDropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.history-dropdown-item');
            if (item) {
                this.dom.cmdInput.value = item.dataset.command;
                this.hideCommandHistory();
                this.dom.cmdInput.focus();
                this.processCommandInput(); 
            }
        });


        // Workspace Actions
        if (this.dom.newThreadBtn) {
            this.dom.newThreadBtn.addEventListener('click', () => this.createNewThread());
        }
        if (this.dom.uploadContextBtnLabel) {
            // The actual file input change listener is handled here
            this.dom.fileUploadHidden.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        }
        // History item click is handled by renderHistoryList

        // Control Panel - Provider Change
        this.dom.providerSelect.addEventListener('change', (e) => {
            this.provider = e.target.value;
            this.updateUI();
            this.checkConnection();
            this.saveSettings();
        });

        // Control Panel - API Key Saving
        this.dom.saveKeyBtn.addEventListener('click', async () => {
            const key = this.dom.apiKeyInput.value.trim();
            if (key) {
                const originalIcon = this.dom.saveKeyBtn.innerHTML;
                this.dom.saveKeyBtn.innerHTML = '...';
                
                try {
                    if (this.provider !== 'ollama') {
                        await this.validateProviderConnection(this.provider, key);
                    }
                    this.keys[this.provider] = key;
                    localStorage.setItem(`glyphos_${this.provider}_key`, key);
                    this.dom.saveKeyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    this.toast('API Key saved and validated!', 'success');
                    this.checkConnection();
                } catch (error) {
                    this.dom.saveKeyBtn.innerHTML = '<span style="color:var(--danger)">✕</span>';
                    this.toast(`API Key validation failed: ${error.message}`, 'error');
                } finally {
                    setTimeout(() => { this.dom.saveKeyBtn.innerHTML = originalIcon; }, 2000);
                }
            } else {
                this.toast('API Key cannot be empty.', 'warning');
            }
        });

        // Control Panel - Temperature Radios
        this.dom.tempFocused.addEventListener('change', () => this.setStyle('focused'));
        this.dom.tempBalanced.addEventListener('change', () => this.setStyle('balanced'));
        this.dom.tempCreative.addEventListener('change', () => this.setStyle('creative'));

        // Control Panel - Preferences Checkboxes
        this.dom.chkStream.addEventListener('change', (e) => {
            this.streamResponses = e.target.checked;
            this.dom.indicatorStreaming.classList.toggle('hidden', !this.streamResponses);
            this.saveSettings();
        });
        this.dom.chkFocus.addEventListener('change', (e) => {
            this.ambientFocusMode = e.target.checked;
            this.dom.indicatorFocus.classList.toggle('hidden', !this.ambientFocusMode);
            this.saveSettings();
            this.setFocusMode(false); // Reapply focus mode state
        });

        // Control Panel - Theme Toggle
        this.dom.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Global Keyboard Shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeyboardShortcuts(e));
    }

    handleGlobalKeyboardShortcuts(e) {
        // Cmd/Ctrl + K: Focus command input
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            this.dom.cmdInput.focus();
        }
        // Cmd/Ctrl + /: Toggle Help
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
            e.preventDefault();
            this.handleCommand('help');
        }
        // Cmd/Ctrl + Enter: Execute command (already handled in handleCommandInputKey for input)
    }

    handleCommandInputKey(e) {
        const cmdInput = this.dom.cmdInput;
        const historyDropdown = this.dom.cmdHistoryDropdown;
        const items = Array.from(historyDropdown.children);

        // Cmd/Ctrl + Enter for immediate execution
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            this.processCommandInput();
            return;
        }
        // Enter key for submission (without Shift for new line)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.processCommandInput();
            return;
        }

        if (historyDropdown.classList.contains('visible') && items.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.commandHistoryIndex = (this.commandHistoryIndex <= 0) ? items.length - 1 : this.commandHistoryIndex - 1;
                this.highlightCommandHistoryItem(items);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.commandHistoryIndex = (this.commandHistoryIndex >= items.length - 1) ? 0 : this.commandHistoryIndex + 1;
                this.highlightCommandHistoryItem(items);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hideCommandHistory();
                cmdInput.blur();
            }
            return; // Prevent further processing if history is active
        }
    }

    highlightCommandHistoryItem(items) {
        items.forEach((item, index) => {
            if (index === this.commandHistoryIndex) {
                item.classList.add('selected');
                this.dom.cmdInput.value = item.dataset.command;
            } else {
                item.classList.remove('selected');
            }
        });
    }

    showCommandHistory() {
        if (this.commandHistory.length === 0) return;

        const historyHtml = this.commandHistory.map((cmd, index) => `
            <div class="history-dropdown-item" data-command="${cmd}" data-index="${index}" tabindex="0" role="option" aria-selected="false">${cmd}</div>
        `).join('');

        this.dom.cmdHistoryDropdown.innerHTML = historyHtml;
        this.dom.cmdHistoryDropdown.classList.add('visible');
        this.commandHistoryIndex = -1; // Reset index
        this.dom.cmdHistoryDropdown.setAttribute('aria-expanded', 'true');
        this.dom.cmdHistoryDropdown.setAttribute('aria-activedescendant', '');
    }

    hideCommandHistory() {
        this.dom.cmdHistoryDropdown.classList.remove('visible');
        this.dom.cmdHistoryDropdown.setAttribute('aria-expanded', 'false');
    }

    updateCommandInputButtons() {
        const text = this.dom.cmdInput.value.trim();
        const hasText = text.length > 0;
        this.dom.clearCmdBtn.style.display = hasText ? 'flex' : 'none';
        this.dom.runCmdBtn.disabled = !hasText || this.isGenerating;
    }

    clearCommandInput() {
        this.dom.cmdInput.value = '';
        this.updateCommandInputButtons();
        this.dom.cmdInput.focus();
    }

    async processCommandInput() {
        const text = this.dom.cmdInput.value.trim();
        if (!text) {
            this.toast('Command input cannot be empty.', 'warning');
            return;
        }
        if (this.isGenerating) {
            this.toast('Please wait for the current response to finish.', 'info');
            return;
        }

        // Add to command history
        if (!this.commandHistory.includes(text)) {
            this.commandHistory.unshift(text); // Add to beginning
            if (this.commandHistory.length > 5) { // Keep last 5
                this.commandHistory.pop();
            }
            this.saveSettings(); // Save updated command history
        }
        this.dom.cmdInput.value = ''; // Clear input after processing
        this.updateCommandInputButtons();
        this.hideCommandHistory();

        // Hide onboarding if first interaction
        if (!this.hasStarted) {
            this.hasStarted = true;
            this.dom.onboarding.classList.add('hidden');
        }

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
            if (this.provider !== 'ollama' && !this.keys[this.provider]) {
                this.toast(`Missing API Key for ${this.provider}. Use the Control Panel or 
/key ${this.provider} <your_key>
 to set it.`, 'error');
                return;
            }
            if (this.provider === 'ollama') {
                 this.toast('Ollama is offline. Ensure Ollama server is running with CORS enabled.', 'error');
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
| 
/clear
 | Clears the canvas history | 
/clear
 |
| 
/key
 | Set API Key for a provider | 
/key openai sk-...
 |
| 
/reset
 | Reset context and memory | 
/reset
 |
| 
@provider
 | Switch provider for one message | 
@gemini Analyze this
 |

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
                this.history = [];
                this.saveSettings(); // Save empty history
                this.toast('Chat history cleared.', 'info');
                this.showWelcome();
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
                            this.toast(`API Key for ${provider} verified and updated.`, 'success');
                            
                            if (this.provider === provider) {
                                this.dom.apiKeyInput.value = key;
                                this.checkConnection();
                            }
                        }).catch(err => {
                            this.toast(`API Key validation failed for ${provider}: ${err.message}`, 'error');
                        });
                    } else {
                         this.toast(`Unknown provider: ${provider}. Supported: groq, openai, gemini, openrouter.`, 'warning');
                    }
                } else {
                    this.toast('Usage: `/key <provider> <your_api_key>`\nExample: `/key openai sk-1234...`', 'info');
                }
                break;
            case 'reset':
                this.history = [];
                this.dom.canvas.innerHTML = '';
                this.dom.onboarding.classList.remove('hidden');
                this.hasStarted = false;
                this.saveSettings(); // Save empty history
                this.toast('Context and memory reset. Welcome back!', 'info');
                this.renderHistoryList();
                break;
            default:
                this.toast(`Unknown command: 
/${cmd}
`, 'warning');
        }
    }

    async generateResponse(prompt, overrideProvider = null) {
        if (this.isGenerating) return;
        this.isGenerating = true;
        this.updateStatusBar(true);
        this.setFocusMode(true);

        const activeProvider = overrideProvider || this.provider;
        const temp = this.tempPresets[this.style];
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
            this.saveThreadToHistory(prompt, fullResponseText, activeProvider); // Save after full response
        } catch (err) {
            contentEl.innerHTML += `

**⚠️ Error:** ${err.message}`;
            this.toast(`Generation Error: ${err.message}`, 'error');
        } finally {
            this.isGenerating = false;
            this.updateStatusBar(false);
            this.setFocusMode(false);
            
            // Final render pass
            this.renderRichContent(contentEl, fullResponseText, true);
            this.scrollToBottom();
            this.updateCommandInputButtons();
        }
    }

    // --- Rich Content Renderer (Markdown + Math + Mermaid) ---
    
    sanitizeMarkdown(text) {
        if (!text) return '';
        
        // Hack: Fix missing newlines before numbered lists
        let clean = text.replace(/([^
])\s+(\d+\.)\s/g, '$1\n\n$2 ');
        clean = clean.replace(/([^
])\s+([\-\*])\s/g, '$1\n\n$2 '); // For bullet points

        return clean;
    }

    renderRichContent(element, markdownText, isFinal = false) {
        if (!window.marked) {
            element.textContent = markdownText;
            return;
        }

        const processedTextPre = this.sanitizeMarkdown(markdownText);
        const mathBlocks = [];
        let processedText = processedTextPre;

        // Extract and replace math blocks
        processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
            mathBlocks.push({ type: 'display', tex: tex });
            return `%%%MATH${mathBlocks.length - 1}%%%`;
        });
        processedText = processedText.replace(/\$([^\$\n]+?)\$/g, (match, tex) => {
            mathBlocks.push({ type: 'inline', tex: tex });
            return `%%%MATH${mathBlocks.length - 1}%%%`;
        });

        // Render Markdown
        element.innerHTML = marked.parse(processedText);

        // Restore Math
        if (window.renderMathInElement) {
            element.innerHTML = element.innerHTML.replace(/%%%MATH(\d+)%%%/g, (match, index) => {
                const block = mathBlocks[parseInt(index)];
                if (!block) return match;
                try {
                    return katex.renderToString(block.tex, {
                        displayMode: block.type === 'display',
                        throwOnError: false,
                        trust: true // Trust HTML for KaTeX
                    });
                } catch (e) { 
                    console.error('KaTeX rendering error:', e);
                    return `<span class="math-error" title="${e.message}">${block.tex}</span>`; 
                }
            });
        }

        // 4. Handle Mermaid & Code Actions (Only on final render for performance)
        if (isFinal) {
            // Mermaid Diagrams
            element.querySelectorAll('pre code.language-mermaid').forEach(async (codeBlock, index) => {
                const pre = codeBlock.parentElement;
                const source = codeBlock.textContent;
                const uniqueId = `mermaid-${Date.now()}-${index}`;
                
                const container = document.createElement('div');
                container.className = 'mermaid-container';
                
                const div = document.createElement('div');
                div.className = 'mermaid';
                div.id = uniqueId;
                div.textContent = source;
                
                const toolbar = document.createElement('div');
                toolbar.className = 'content-toolbar';
                toolbar.innerHTML = `
                    <button class="tool-btn" onclick="window.os.downloadMermaid('${uniqueId}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> SVG
                    </button>
                `;

                container.appendChild(div);
                container.appendChild(toolbar);
                pre.replaceWith(container);
                
                try {
                    await mermaid.init({ mermaid: { theme: this.theme === 'dark' ? 'dark' : 'default' } }, `#${uniqueId}`);
                } catch (e) {
                    console.warn('Mermaid Error:', e);
                    div.innerHTML = `<span style="color:var(--danger)">Diagram Error: ${e.message}</span>`;
                }
            });

            // Standard Code Blocks (Copy/Download)
            element.querySelectorAll('pre').forEach((pre) => {
                if (pre.closest('.mermaid-container')) return; // Skip if it was already processed as mermaid

                const code = pre.querySelector('code');
                if (!code) return;

                const wrapper = document.createElement('div');
                wrapper.className = 'code-wrapper';
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);

                const toolbar = document.createElement('div');
                toolbar.className = 'code-toolbar';
                toolbar.innerHTML = `
                    <button class="tool-btn" onclick="window.os.copyToClipboard(this)">Copy</button>
                    <button class="tool-btn" onclick="window.os.downloadCode(this)">Download</button>
                `;
                wrapper.appendChild(toolbar);
            });
        }
    }

    // --- Helper Actions ---
    
    downloadMermaid(id) {
        const svg = document.getElementById(id).querySelector('svg');
        if (!svg) {
            this.toast('Could not find diagram to download.', 'error');
            return;
        }
        
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagram-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast('Diagram downloaded!', 'success');
    }

    copyToClipboard(btn) {
        const wrapper = btn.closest('.code-wrapper');
        const code = wrapper.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = original, 2000);
            this.toast('Code copied to clipboard!', 'success');
        }).catch(() => {
            this.toast('Failed to copy code.', 'error');
        });
    }

    downloadCode(btn) {
        const wrapper = btn.closest('.code-wrapper');
        const code = wrapper.querySelector('code').textContent;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast('Code downloaded!', 'success');
    }

    scrollToBottom() {
        this.dom.canvas.scrollTop = this.dom.canvas.scrollHeight;
    }

    // --- Streaming Providers ---

    async streamOllama(prompt, model, temp, onUpdate) {
        const fullPrompt = `${this.systemPrompt}\n\nUser Query: ${prompt}`;
        try {
            const response = await fetch(`${this.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model, 
                    prompt: fullPrompt, 
                    options: { temperature: temp }, 
                    stream: true 
                })
            });
            
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.error || 'Ollama connection failed');
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); 
                
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.response) { fullText += json.response; onUpdate(fullText); }
                    } catch (e) {
                        console.warn('Ollama Parse Error:', e);
                    }
                }
            }
            
            if (buffer.trim()) { // Process any remaining buffer
                try {
                    const json = JSON.parse(buffer);
                    if (json.response) { fullText += json.response; onUpdate(fullText); }
                } catch (e) {}
            }
            if (!fullText) throw new Error('Empty response from Ollama.');

        } catch (error) {
            throw new Error(`Ollama Stream Error: ${error.message}`);
        }
    }

    async streamOpenAIStyle(url, key, prompt, model, temp, onUpdate) {
        try {
            if (!key) throw new Error('API Key missing.');
            
            const headers = {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            };
            if (url.includes('openrouter.ai')) {
                headers['HTTP-Referer'] = window.location.href;
                headers['X-Title'] = 'GlyphOS Unified';
            }

            const payload = {
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                model: model,
                temperature: temp,
                stream: true
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`API Error (${response.status}): ${err}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (buffer.trim()) { // Process any remaining buffer
                        const lines = buffer.split('\n');
                        for (const line of lines) {
                            if (line.trim().startsWith('data: ')) {
                                const dataStr = line.replace('data: ', '').trim();
                                if (dataStr !== '[DONE]') {
                                    try {
                                        const json = JSON.parse(dataStr);
                                        const content = json.choices?.[0]?.delta?.content || '';
                                        if (content) { fullText += content; onUpdate(fullText); }
                                    } catch (e) { console.warn('Final Buffer Parse Error:', e); }
                                }
                            }
                        }
                    }
                    break;
                }
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); 
                
                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;
                        try {
                            const json = JSON.parse(dataStr);
                            const content = json.choices?.[0]?.delta?.content || '';
                            if (content) { fullText += content; onUpdate(fullText); }
                        } catch (e) { console.warn('Stream Parse Error:', e); }
                    }
                }
            }
            
            if (!fullText) throw new Error('Empty response from provider.');
            
        } catch (error) {
            throw new Error(`Stream Error: ${error.message}`);
        }
    }

    async streamGemini(prompt, model, temp, onUpdate) {
        try {
            if (!this.keys.gemini) throw new Error('Gemini API Key missing.');
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.keys.gemini}`;
            const fullPrompt = `${this.systemPrompt}\n\nUser Query: ${prompt}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }],
                    generationConfig: { temperature: temp }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                let errMsg = `API Error (${response.status})`;
                try {
                    const errJson = JSON.parse(errText);
                    if (errJson.error && errJson.error.message) {
                        errMsg += `: ${errJson.error.message}`;
                    }
                } catch (e) { errMsg += `: ${errText}`; }
                throw new Error(errMsg);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        const content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (content) {
                            fullText += content;
                            onUpdate(fullText);
                        }
                    } catch (e) { console.warn('Gemini Stream Parse Error:', e); }
                }
            }
            if (!fullText) throw new Error('Empty response from Gemini.');
            
        } catch (error) {
            throw new Error(`Gemini Stream Error: ${error.message}`);
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
                if (window.location.protocol === 'file:') {
                    // OpenRouter requires HTTP-Referer for file://, may need a proxy or hosted deployment
                    // For local testing, can sometimes bypass by removing headers or using a browser extension
                    // For now, allow direct fetch but warn about file://
                    console.warn("OpenRouter may not work on file:// protocol without a referer. Deploy to a web server for best results.");
                } else {
                    headers['HTTP-Referer'] = window.location.href; // Required for OpenRouter
                    headers['X-Title'] = 'GlyphOS Unified';
                }
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
        this.updateStatusBar(false, 'Checking...', 'pending'); // Show spinner, checking status
        
        const p = this.provider;
        
        if (p === 'ollama') {
            try {
                const res = await fetch(`${this.ollamaUrl}/api/tags`);
                if (res.ok) {
                    const data = await res.json();
                    this.updateModelList(data.models.map(m => m.name));
                    this.isConnected = true;
                    this.updateStatusBar(false, 'Connected', 'connected'); // Hide spinner, connected
                } else throw new Error('Ollama server not reachable');
            } catch (e) {
                this.isConnected = false;
                this.updateStatusBar(false, 'Offline', 'disconnected'); // Hide spinner, disconnected
                this.dom.modelList.innerHTML = '<div style="color:var(--danger); font-size:0.8rem">Ollama unavailable</div>';
                this.toast('Ollama server is not running or accessible. Ensure it\'s running with CORS enabled.', 'error');
            }
        } else {
            // Cloud providers
            if (this.keys[p]) {
                try {
                    await this.validateProviderConnection(p, this.keys[p]);
                    this.isConnected = true;
                    this.updateStatusBar(false, 'Connected', 'connected'); // Hide spinner, connected
                    this.updateModelList(this.getDefaultModels(p));
                } catch (e) {
                    this.isConnected = false;
                    this.updateStatusBar(false, 'Invalid Key', 'disconnected'); // Hide spinner, disconnected
                    this.dom.modelList.innerHTML = `<div style="color:var(--danger); font-size:0.8rem">${e.message}</div>`;
                    this.toast(`Connection failed for ${p}: ${e.message}`, 'error');
                }
            } else {
                this.isConnected = false;
                this.updateStatusBar(false, 'No API Key', 'disconnected'); // Hide spinner, disconnected
                this.dom.modelList.innerHTML = '<div style="font-size:0.8rem">Enter API Key above</div>';
                this.toast(`No API Key found for ${p}. Please enter it in the Control Panel.`, 'warning');
            }
        }
    }

    getDefaultModels(provider) {
        switch(provider) {
            case 'groq': return ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'gemma-7b-it'];
            case 'openai': return ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
            case 'gemini': return ['gemini-pro', 'gemini-1.5-pro'];
            case 'openrouter': return ['anthropic/claude-3-opus', 'google/gemini-pro-1.5', 'mistralai/mistral-7b-instruct'];
            default: return [];
        }
    }

    updateModelList(models) {
        let html = '';
        models.forEach(m => {
            const activeModel = this.models[this.provider];
            const isActive = m === activeModel;
            html += `<span class="model-pill ${isActive ? 'active' : ''}" role="button" tabindex="0" onclick="window.os.setModel('${m}')">${m}</span>`;
        });
        this.dom.modelList.innerHTML = html;
        this.dom.modelList.setAttribute('aria-label', `Available models for ${this.provider}`);
    }

    setModel(m) {
        this.models[this.provider] = m;
        this.updateModelList(this.getDefaultModels(this.provider) || [m]);
        this.toast(`Model set to: ${m}`, 'info');
        this.saveSettings();
    }

    updateStatusBar(isGenerating, statusText = null, statusState = null) {
        this.dom.statusSpinner.classList.toggle('hidden', !isGenerating);
        if (this.dom.runCmdBtn) { // Check if runCmdBtn exists (it should after initDomElements)
            this.dom.runCmdBtn.disabled = isGenerating;
        }
        this.dom.statusText.textContent = statusText || (isGenerating ? 'Running...' : 'Ready');
        this.dom.statusProvider.textContent = this.provider.charAt(0).toUpperCase() + this.provider.slice(1);
        this.dom.statusProvider.classList.toggle('status-badge-connected', statusState === 'connected');
        this.dom.statusProvider.classList.toggle('status-badge-disconnected', statusState === 'disconnected');
        this.dom.statusProvider.classList.toggle('status-badge-pending', statusState === 'pending');

        this.dom.indicatorStreaming.classList.toggle('hidden', !this.streamResponses);
        this.dom.indicatorFocus.classList.toggle('hidden', !this.ambientFocusMode);
    }

    setFocusMode(enable) {
        if (this.ambientFocusMode && enable) {
            this.dom.appGrid.classList.add('ambient-focus-active');
        } else {
            this.dom.appGrid.classList.remove('ambient-focus-active');
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
        
        // Update Style Radios
        this.dom.tempFocused.checked = (this.style === 'focused');
        this.dom.tempBalanced.checked = (this.style === 'balanced');
        this.dom.tempCreative.checked = (this.style === 'creative');

        // Update Preference Checkboxes
        this.dom.chkStream.checked = this.streamResponses;
        this.dom.indicatorStreaming.classList.toggle('hidden', !this.streamResponses);
        this.dom.chkFocus.checked = this.ambientFocusMode;
        this.dom.indicatorFocus.classList.toggle('hidden', !this.ambientFocusMode);

        // Update Theme Toggle visual
        document.documentElement.setAttribute('data-theme', this.theme === 'system' 
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
            : this.theme);
        this.updateThemeToggleVisual();
        this.updateCommandInputButtons(); // Initial state for buttons
    }

    setStyle(style) {
        this.style = style;
        this.updateUI();
        this.saveSettings();
        this.toast(`Temperature set to: ${style}`, 'info');
    }

    toggleTheme() {
        const currentSystemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        let newTheme;
        if (this.theme === 'light') {
            newTheme = 'dark';
        } else if (this.theme === 'dark') {
            newTheme = 'system';
        } else { // currentTheme is 'system'
            newTheme = 'light';
        }
        this.theme = newTheme;
        this.applyTheme();
        this.saveSettings();
        this.toast(`Theme set to: ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`, 'info');
    }

    applyTheme() {
        let resolvedTheme = this.theme;
        if (this.theme === 'system') {
            resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', resolvedTheme);
        this.updateThemeToggleVisual();
    }

    updateThemeToggleVisual() {
        const toggle = this.dom.themeToggle;
        if (!toggle) return;

        toggle.innerHTML = ''; // Clear existing icons

        let lightActive = '';
        let darkActive = '';
        let systemActive = '';
        let justify = 'flex-start';

        if (this.theme === 'light') {
            lightActive = 'active';
        } else if (this.theme === 'dark') {
            darkActive = 'active';
            justify = 'center'; // Center dark icon
        } else { // system
            systemActive = 'active';
            justify = 'flex-end'; // End system icon
        }
        
        // Update the style of the themeToggle directly for positioning
        toggle.style.justifyContent = justify;

        toggle.innerHTML = `
            <span class="theme-icon light ${lightActive}" aria-hidden="true" title="Light Theme">☀️</span>
            <span class="theme-icon dark ${darkActive}" aria-hidden="true" title="Dark Theme">🌙</span>
            <span class="theme-icon system ${systemActive}" aria-hidden="true" title="System Theme">💻</span>
        `;
    }


    saveSettings() {
        localStorage.setItem('glyphos_settings', JSON.stringify({
            provider: this.provider,
            style: this.style,
            theme: this.theme,
            streamResponses: this.streamResponses,
            ambientFocusMode: this.ambientFocusMode,
            models: this.models // Save model preferences per provider
        }));
        localStorage.setItem('glyphos_command_history', JSON.stringify(this.commandHistory));

        // Save API keys separately (already handled on key input change)
    }

    loadSettings() {
        const data = localStorage.getItem('glyphos_settings');
        if (data) {
            try {
                const settings = JSON.parse(data);
                this.provider = settings.provider || 'ollama';
                this.style = settings.style || 'balanced';
                this.theme = settings.theme || 'system';
                this.streamResponses = settings.streamResponses !== undefined ? settings.streamResponses : true;
                this.ambientFocusMode = settings.ambientFocusMode !== undefined ? settings.ambientFocusMode : true;
                if (settings.models) this.models = { ...this.models, ...settings.models };
            } catch (e) {
                console.error("Error parsing settings from localStorage:", e);
                // Reset to defaults if parsing fails
                this.resetSettingsToDefaults();
            }
        }

        const cmdHistory = localStorage.getItem('glyphos_command_history');
        if (cmdHistory) {
            try {
                this.commandHistory = JSON.parse(cmdHistory);
            } catch (e) {
                console.error("Failed to parse command history:", e);
                this.commandHistory = [];
            }
        }

        this.history = JSON.parse(localStorage.getItem('glyphos_chat_history') || '[]');
        if (!Array.isArray(this.history)) {
            console.error("Invalid chat history in localStorage, resetting.");
            this.history = [];
            localStorage.removeItem('glyphos_chat_history');
        }
    }
    
    resetSettingsToDefaults() {
        this.provider = 'ollama';
        this.model = 'llama2';
        this.style = 'balanced';
        this.theme = 'system';
        this.streamResponses = true;
        this.ambientFocusMode = true;
        this.keys = { groq: '', openai: '', gemini: '', openrouter: '' };
        this.models = { // Reset default models too
            ollama: 'llama2',
            groq: 'llama-3.1-8b-instant',
            openai: 'gpt-3.5-turbo',
            gemini: 'gemini-pro',
            openrouter: 'mistralai/mistral-7b-instruct:free'
        };
        this.commandHistory = [];
        this.history = [];
        localStorage.removeItem('glyphos_settings');
        localStorage.removeItem('glyphos_command_history');
        localStorage.removeItem('glyphos_chat_history');
        Object.keys(this.keys).forEach(key => localStorage.removeItem(`glyphos_${key}_key`));
        this.toast('Settings reset to defaults.', 'info');
    }

    toast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container') || (() => {
            const div = document.createElement('div');
            div.id = 'toast-container';
            div.style.cssText = `
                position: fixed;
                top: var(--spacing-lg);
                right: var(--spacing-lg);
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
                z-index: 1000;
            `;
            document.body.appendChild(div);
            return div;
        })();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'status'); // Changed to status for better screen reader announcement
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close-btn" onclick="this.closest('.toast').remove()" aria-label="Close notification">&times;</button>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    // --- History Management ---
    createNewThread() {
        // Mark current active thread as saved if it exists
        const currentActive = this.history.find(thread => thread.status === 'active');
        if (currentActive) {
            currentActive.status = 'saved';
        }

        const newThread = {
            id: `thread-${Date.now()}`,
            title: 'New Thread',
            lastActivity: Date.now(),
            provider: this.provider,
            status: 'active', // can be 'active', 'saved', 'empty'
            messages: []
        };
        this.history.unshift(newThread); // Add to beginning
        this.saveSettings(); // Persist new thread
        this.renderHistoryList();
        this.loadThread(newThread.id);
        this.toast('New thread created.', 'info');
        this.dom.onboarding.classList.add('hidden'); // Hide onboarding when a new thread is created
    }

    saveThreadToHistory(userPrompt, assistantResponse, provider) {
        let activeThread = this.history.find(thread => thread.status === 'active');

        // If no active thread, or if it's an empty 'New Thread', create one
        if (!activeThread || activeThread.messages.length === 0) {
            this.createNewThread(); // This will make a new thread active
            activeThread = this.history[0]; // Get the newly created active thread
        }

        // Add messages to the active thread
        activeThread.messages.push(
            { type: 'user', content: userPrompt, timestamp: Date.now() },
            { type: 'assistant', content: assistantResponse, timestamp: Date.now() }
        );
        activeThread.lastActivity = Date.now();
        activeThread.provider = provider; // Update provider for the thread

        // Update thread title if it's still generic
        if (activeThread.title === 'New Thread' || activeThread.title === 'Welcome Session') {
            activeThread.title = userPrompt.substring(0, 30) + (userPrompt.length > 30 ? '...' : '');
            if (activeThread.title.trim() === '') { // Fallback if prompt is empty
                activeThread.title = "Empty Prompt Chat";
            }
        }

        this.saveSettings(); // Persist updated thread
        this.renderHistoryList();
    }

    renderHistoryList() {
        if (!this.dom.historyList) return;

        const fragment = document.createDocumentFragment();

        // Welcome Session is part of the initial HTML, not dynamically rendered here unless cleared
        if (this.history.length === 0 && !this.hasStarted) {
            this.dom.historyList.innerHTML = `
                <li class="history-item active" role="button" tabindex="0" aria-label="Welcome Session">
                    <span class="history-title">Welcome Session</span>
                    <span class="history-meta">Just now</span>
                    <span class="history-provider-icon">GlyphOS</span>
                </li>
            `;
            return;
        }

        this.dom.historyList.innerHTML = ''; // Clear previous, except for static welcome if present

        this.history.forEach(thread => {
            const li = document.createElement('li');
            li.className = `history-item ${thread.status === 'active' ? 'active' : ''}`;
            li.setAttribute('role', 'button');
            li.setAttribute('tabindex', '0');
            li.setAttribute('aria-label', `Chat thread: ${thread.title}, last activity ${this.formatTimeAgo(thread.lastActivity)}`);
            li.dataset.threadId = thread.id;
            li.innerHTML = `
                <span class="history-title">${thread.title}</span>
                <span class="history-meta">${this.formatTimeAgo(thread.lastActivity)}</span>
                <span class="history-provider-icon">${thread.provider.charAt(0).toUpperCase() + thread.provider.slice(1)}</span>
            `;
            li.addEventListener('click', () => this.loadThread(thread.id));
            fragment.appendChild(li);
        });

        this.dom.historyList.appendChild(fragment);
    }

    loadThread(threadId) {
        // Mark all other threads as saved, activate this one
        this.history.forEach(thread => {
            thread.status = (thread.id === threadId) ? 'active' : 'saved';
        });

        const activeThread = this.history.find(thread => thread.id === threadId);
        if (activeThread) {
            this.dom.canvas.innerHTML = ''; // Clear current view
            this.dom.onboarding.classList.add('hidden'); // Hide onboarding

            activeThread.messages.forEach(msg => {
                this.appendBlock(msg.type, msg.content);
            });
            this.scrollToBottom();
            this.toast(`Loaded thread: "${activeThread.title}"`, 'info');
            this.saveSettings(); // Save updated history status
            this.renderHistoryList();
            this.hasStarted = true; // Mark as started if loading a thread
        }
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const seconds = Math.floor((now - timestamp) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        
        return new Date(timestamp).toLocaleDateString();
    }


    handleFileUpload(files) {
        if (!files || files.length === 0) return;

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const fileBlock = `
                    
```text
File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)
Content:
${content.substring(0, 500)}${content.length > 500 ? '...' : ''}
```
`;
                this.appendBlock('system', `📄 Uploaded: **${file.name}**\n\n${fileBlock}`);
                this.toast(`File "${file.name}" uploaded.`, 'success');
            };
            reader.onerror = () => {
                this.toast(`Failed to read file: ${file.name}`, 'error');
            };
            reader.readAsText(file);
        }
        // Clear the file input's value to allow re-uploading the same file
        this.dom.fileUploadHidden.value = ''; 
    }

    // --- Onboarding and Welcome ---
    showWelcome() {
        const hasHistory = this.history.some(thread => thread.messages && thread.messages.length > 0);
        if (!hasHistory && !this.hasStarted) {
            this.dom.onboarding.classList.remove('hidden');
        } else {
            this.dom.onboarding.classList.add('hidden');
        }
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.os = new UnifiedOS();

    // Set global functions for external HTML calls if any (e.g. from onclick attributes)
    // These should ideally be avoided for better event handling but might exist in legacy HTML.
    window.toggleSidebar = (side) => {
        if (side === 'left') window.os.dom.appGrid.classList.toggle('left-collapsed');
        if (side === 'right') window.os.dom.appGrid.classList.toggle('right-collapsed');
    };
});