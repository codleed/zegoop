// AI Cursor Extension - Options Page Script

class OptionsManager {
  constructor() {
    this.settings = {};
    this.defaultSettings = {
      aiMode: false,
      selectedLLM: '',
      apiKeys: {},
      shortcuts: {
        toggleMode: 'Alt+A'
      },
      settings: {
        autoMode: false,
        showTooltips: true,
        modalPosition: 'center',
        responseLength: 'medium',
        showIndicator: false
      },
      privacy: {
        analyticsOptOut: false
      },
      systemPrompts: {
        global: '',
        explain: '',
        simplify: '',
        define: '',
        tooltip: ''
      },
      indicatorPosition: null
    };
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
    this.setupProviderVisibility();
  }
  
  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      this.settings = { ...this.defaultSettings, ...response };
    } catch (error) {
      this.settings = { ...this.defaultSettings };
    }
  }
  
  setupEventListeners() {
    // LLM Provider Selection
    document.getElementById('llm-provider').addEventListener('change', this.handleProviderChange.bind(this));
    
    // API Key Visibility Toggles
    document.querySelectorAll('.btn-toggle-visibility').forEach(btn => {
      btn.addEventListener('click', this.togglePasswordVisibility.bind(this));
    });
    
    // Test API Connection
    document.getElementById('test-api').addEventListener('click', this.testAPIConnection.bind(this));
    
    // Save Settings
    document.getElementById('save-settings').addEventListener('click', this.saveSettings.bind(this));
    
    // Reset Settings
    document.getElementById('reset-settings').addEventListener('click', this.resetSettings.bind(this));
    
    // Shortcut Change
    document.getElementById('change-shortcut').addEventListener('click', this.changeShortcut.bind(this));
    
    // Footer Links
    document.getElementById('help-link').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/codleed/zegoop#readme' });
    });
    
    document.getElementById('github-link').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/codleed/zegoop' });
    });
    
    document.getElementById('feedback-link').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/codleed/zegoop/issues' });
    });
    
    // Auto-save on input changes
    this.setupAutoSave();
  }
  
  setupAutoSave() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        this.collectFormData();
        this.saveSettings(false); // Save without showing toast
      });
    });
  }
  
  updateUI() {
    // LLM Provider
    document.getElementById('llm-provider').value = this.settings.selectedLLM || '';
    
    // API Keys
    Object.keys(this.settings.apiKeys || {}).forEach(provider => {
      const input = document.getElementById(`${provider}-key`);
      if (input) {
        input.value = this.settings.apiKeys[provider] || '';
      }
    });
    
    // Behavior Settings
    document.getElementById('auto-mode').checked = this.settings.settings?.autoMode || false;
    document.getElementById('show-tooltips').checked = this.settings.settings?.showTooltips !== false;
    document.getElementById('show-indicator').checked = this.settings.settings?.showIndicator || false;
    document.getElementById('modal-position').value = this.settings.settings?.modalPosition || 'center';
    document.getElementById('response-length').value = this.settings.settings?.responseLength || 'medium';
    
    // Shortcuts
    document.getElementById('toggle-shortcut').value = this.settings.shortcuts?.toggleMode || 'Alt+A';
    
    // Privacy
    document.getElementById('analytics-opt-out').checked = this.settings.privacy?.analyticsOptOut || false;

    // System Prompts
    document.getElementById('global-prompt').value = this.settings.systemPrompts?.global || '';
    document.getElementById('explain-prompt').value = this.settings.systemPrompts?.explain || '';
    document.getElementById('simplify-prompt').value = this.settings.systemPrompts?.simplify || '';
    document.getElementById('define-prompt').value = this.settings.systemPrompts?.define || '';
    document.getElementById('tooltip-prompt').value = this.settings.systemPrompts?.tooltip || '';
  }
  
  setupProviderVisibility() {
    const provider = document.getElementById('llm-provider').value;
    const apiKeyGroups = document.querySelectorAll('.api-key-group');
    
    apiKeyGroups.forEach(group => {
      const groupProvider = group.getAttribute('data-provider');
      group.style.display = (groupProvider === provider) ? 'block' : 'none';
    });
  }
  
  handleProviderChange(event) {
    const selectedProvider = event.target.value;
    this.setupProviderVisibility();
    
    // Clear test results when provider changes
    const testResult = document.getElementById('test-result');
    testResult.style.display = 'none';
  }
  
  togglePasswordVisibility(event) {
    const targetId = event.target.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const button = event.target;
    
    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '🙈';
    } else {
      input.type = 'password';
      button.textContent = '👁️';
    }
  }
  
  async testAPIConnection() {
    const provider = document.getElementById('llm-provider').value;
    const apiKey = document.getElementById(`${provider}-key`).value;
    const testResult = document.getElementById('test-result');
    
    if (!provider || !apiKey) {
      this.showTestResult('Please select a provider and enter an API key first.', 'error');
      return;
    }
    
    try {
      // Show loading state
      const testButton = document.getElementById('test-api');
      const originalText = testButton.textContent;
      testButton.textContent = 'Testing...';
      testButton.disabled = true;
      
      // Test the API connection
      const response = await this.makeTestAPICall(provider, apiKey);
      
      if (response.success) {
        this.showTestResult('✅ API connection successful!', 'success');
      } else {
        this.showTestResult(`❌ API test failed: ${response.error}`, 'error');
      }
      
    } catch (error) {
      this.showTestResult(`❌ Connection failed: ${error.message}`, 'error');
    } finally {
      // Reset button state
      const testButton = document.getElementById('test-api');
      testButton.textContent = 'Test API Connection';
      testButton.disabled = false;
    }
  }
  
  async makeTestAPICall(provider, apiKey) {
    const testPrompt = 'Hello, this is a test. Please respond with "Test successful".';
    
    try {
      // Use the same API calling logic as background script
      const apis = {
        openai: {
          url: 'https://api.openai.com/v1/chat/completions',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 50
          }
        },
        anthropic: {
          url: 'https://api.anthropic.com/v1/messages',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: {
            model: 'claude-3-haiku-20240307',
            max_tokens: 50,
            messages: [{ role: 'user', content: testPrompt }]
          }
        },
        gemini: {
          url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            contents: [{ parts: [{ text: testPrompt }] }]
          }
        }
      };
      
      const config = apis[provider];
      if (!config) {
        throw new Error(`Unsupported provider: ${provider}`);
      }
      
      const response = await fetch(config.url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(config.body)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  showTestResult(message, type) {
    const testResult = document.getElementById('test-result');
    testResult.textContent = message;
    testResult.className = `test-result ${type}`;
    testResult.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      testResult.style.display = 'none';
    }, 5000);
  }
  
  collectFormData() {
    const formData = {
      selectedLLM: document.getElementById('llm-provider').value,
      apiKeys: {},
      settings: {
        autoMode: document.getElementById('auto-mode').checked,
        showTooltips: document.getElementById('show-tooltips').checked,
        showIndicator: document.getElementById('show-indicator').checked,
        modalPosition: document.getElementById('modal-position').value,
        responseLength: document.getElementById('response-length').value
      },
      shortcuts: {
        toggleMode: document.getElementById('toggle-shortcut').value
      },
      privacy: {
        analyticsOptOut: document.getElementById('analytics-opt-out').checked
      },
      systemPrompts: {
        global: document.getElementById('global-prompt').value.trim(),
        explain: document.getElementById('explain-prompt').value.trim(),
        simplify: document.getElementById('simplify-prompt').value.trim(),
        define: document.getElementById('define-prompt').value.trim(),
        tooltip: document.getElementById('tooltip-prompt').value.trim()
      }
    };
    
    // Collect API keys
    ['openai', 'anthropic', 'gemini', 'grok'].forEach(provider => {
      const input = document.getElementById(`${provider}-key`);
      if (input && input.value.trim()) {
        formData.apiKeys[provider] = input.value.trim();
      }
    });
    
    return formData;
  }
  
  async saveSettings(showToast = true) {
    try {
      const formData = this.collectFormData();
      
      // Merge with existing settings
      const updatedSettings = { ...this.settings, ...formData };
      
      // Save to storage
      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: updatedSettings
      });
      
      this.settings = updatedSettings;
      
      if (showToast) {
        this.showToast('Settings saved successfully!', 'success');
      }
      
    } catch (error) {
      this.showToast('Failed to save settings. Please try again.', 'error');
    }
  }
  
  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      try {
        await chrome.runtime.sendMessage({
          action: 'updateSettings',
          settings: this.defaultSettings
        });
        
        this.settings = { ...this.defaultSettings };
        this.updateUI();
        this.setupProviderVisibility();
        
        this.showToast('Settings reset to defaults.', 'success');
        
      } catch (error) {
        this.showToast('Failed to reset settings. Please try again.', 'error');
      }
    }
  }
  
  changeShortcut() {
    const input = document.getElementById('toggle-shortcut');
    const button = document.getElementById('change-shortcut');
    
    if (input.readOnly) {
      input.readOnly = false;
      input.focus();
      input.select();
      button.textContent = 'Save';
      
      const saveShortcut = () => {
        input.readOnly = true;
        button.textContent = 'Change';
        this.saveSettings(false);
      };
      
      input.addEventListener('blur', saveShortcut, { once: true });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveShortcut();
        }
      }, { once: true });
    }
  }
  
  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    
    // Set content
    messageEl.textContent = message;
    icon.textContent = type === 'success' ? '✅' : '❌';
    
    // Set type
    toast.className = `toast ${type}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
