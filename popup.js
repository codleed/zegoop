// AI Cursor Extension - Popup Script

class PopupManager {
  constructor() {
    this.settings = {};
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
    this.checkAPIStatus();
  }
  
  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      this.settings = response || {};
    } catch (error) {
      this.settings = {};
    }
  }
  
  setupEventListeners() {
    // AI Mode Toggle
    const aiModeToggle = document.getElementById('ai-mode-toggle');
    aiModeToggle.addEventListener('change', this.handleModeToggle.bind(this));
    
    // Action Buttons
    document.getElementById('test-selection').addEventListener('click', this.testSelection.bind(this));
    document.getElementById('open-settings').addEventListener('click', this.openSettings.bind(this));
    
    // Footer Links
    document.getElementById('help-link').addEventListener('click', this.openHelp.bind(this));
    document.getElementById('feedback-link').addEventListener('click', this.openFeedback.bind(this));
  }
  
  updateUI() {
    // Update mode toggle
    const aiModeToggle = document.getElementById('ai-mode-toggle');
    const currentMode = document.getElementById('current-mode');
    
    aiModeToggle.checked = this.settings.aiMode || false;
    currentMode.textContent = this.settings.aiMode ? 'AI Mode' : 'Standard';
    
    // Update selected LLM
    const selectedLLM = document.getElementById('selected-llm');
    const llmName = this.getLLMDisplayName(this.settings.selectedLLM);
    selectedLLM.textContent = llmName;
    
    // Update usage count (placeholder for now)
    const usageCount = document.getElementById('usage-count');
    usageCount.textContent = this.settings.usageCount || 0;
  }
  
  getLLMDisplayName(llm) {
    const names = {
      'openai': 'OpenAI',
      'anthropic': 'Claude',
      'gemini': 'Gemini',
      'grok': 'Grok'
    };
    return names[llm] || 'None';
  }
  
  async handleModeToggle(event) {
    const aiMode = event.target.checked;
    
    try {
      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: { aiMode }
      });
      
      this.settings.aiMode = aiMode;
      
      // Update current mode text
      const currentMode = document.getElementById('current-mode');
      currentMode.textContent = aiMode ? 'AI Mode' : 'Standard';
      
      // Send message to active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleMode',
          aiMode: aiMode
        }).catch(() => {
          // Ignore errors if content script not loaded
        });
      }
      
    } catch (error) {
      // Revert toggle on error
      event.target.checked = !aiMode;
    }
  }
  
  async testSelection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        // Send test message to content script
        chrome.tabs.sendMessage(tab.id, {
          action: 'showAIResponse',
          response: 'This is a test response from the AI Cursor extension. The extension is working correctly!',
          originalText: 'test selection',
          type: 'test'
        }).catch(() => {
          alert('Please refresh the page and try again. The extension needs to be loaded on the current page.');
        });
      }
    } catch (error) {
      alert('Test failed. Please make sure you\'re on a web page and try again.');
    }
  }
  
  openSettings() {
    chrome.runtime.openOptionsPage();
    window.close();
  }
  
  openHelp() {
    chrome.tabs.create({
      url: 'https://github.com/codleed/zegoop#readme'
    });
    window.close();
  }
  
  openFeedback() {
    chrome.tabs.create({
      url: 'https://github.com/codleed/zegoop/issues'
    });
    window.close();
  }
  
  async checkAPIStatus() {
    const statusIndicator = document.getElementById('api-status');
    const statusText = document.getElementById('api-status-text');
    
    try {
      const { selectedLLM, apiKeys } = this.settings;
      
      if (!selectedLLM || !apiKeys || !apiKeys[selectedLLM]) {
        statusIndicator.className = 'status-indicator error';
        statusText.textContent = 'No API key configured';
        return;
      }
      
      // For now, just check if API key exists
      // In a real implementation, you might want to make a test API call
      statusIndicator.className = 'status-indicator connected';
      statusText.textContent = `${this.getLLMDisplayName(selectedLLM)} ready`;
      
    } catch (error) {
      statusIndicator.className = 'status-indicator error';
      statusText.textContent = 'Configuration error';
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
