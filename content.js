// Zegoop AI Cursor Extension - Content Script

class AICursor {
  constructor() {
    this.aiMode = false;
    this.isSelecting = false;
    this.selectedText = '';
    this.selectionStart = null;
    this.modal = null;
    this.settings = {};

    // Hover tooltip properties
    this.hoverTimeout = null;
    this.currentTooltip = null;
    this.lastHoveredWord = '';
    this.hoverDelay = 800; // 800ms delay before showing tooltip

    // Indicator drag properties
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };

    this.init();
  }
  
  async init() {
    // Get initial settings
    await this.loadSettings();

    // Create cursor indicator
    this.createCursorIndicator();

    // Set up event listeners
    this.setupEventListeners();

    // Listen for messages from background script
    this.setupMessageListener();

    // Update UI to show current mode
    this.updateCursorMode();
  }
  
  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      this.settings = response;
      this.aiMode = response.aiMode || false;
      this.updateCursorMode();
    } catch (error) {
      // Failed to load settings, use defaults
    }
  }
  
  createCursorIndicator() {
    // Remove any existing indicator
    const existing = document.getElementById('ai-cursor-indicator');
    if (existing) existing.remove();

    // Only create indicator if enabled in settings
    if (!this.settings?.settings?.showIndicator) {
      return;
    }

    // Create floating indicator to show current mode
    this.indicator = document.createElement('div');
    this.indicator.id = 'ai-cursor-indicator';
    this.indicator.innerHTML = `
      <div class="ai-cursor-icon">
        <span class="mode-text">STD</span>
        <span class="status-dot"></span>
      </div>
    `;

    // Make it draggable
    this.setupIndicatorDrag();

    // Make sure it's added to body and visible
    if (document.body) {
      document.body.appendChild(this.indicator);
      // Restore saved position after a brief delay to ensure element is rendered
      setTimeout(() => this.restoreIndicatorPosition(), 100);
    } else {
      // If body not ready, wait for it
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.indicator);
        setTimeout(() => this.restoreIndicatorPosition(), 100);
      });
    }
  }
  
  setupEventListeners() {
    // Mouse events for AI selection mode
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Selection events
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Prevent default selection in AI mode
    document.addEventListener('selectstart', this.handleSelectStart.bind(this));

    // Hover events for word tooltips
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'toggleMode':
          this.aiMode = message.aiMode;
          this.updateCursorMode();
          break;

        case 'showAIResponse':
          this.showResponseModal(message.response, message.originalText, message.type);
          break;

        case 'showError':
          this.showErrorModal(message.error);
          break;

        case 'settingsUpdated':
          this.loadSettings();
          break;
      }
    });
  }
  
  handleMouseDown(event) {
    // Don't close action menu if clicking on the menu itself
    const actionMenu = document.getElementById('ai-cursor-action-menu');
    if (actionMenu && actionMenu.contains(event.target)) {
      return; // Let the menu handle its own clicks
    }

    // Close any existing action menu when starting new selection
    this.closeActionMenu();
    this.isSelecting = true;
  }

  handleMouseMove(event) {
    // No special handling needed - browser handles selection
  }

  handleMouseUp(event) {
    // Small delay to let selection complete, then check for text
    setTimeout(() => {
      this.isSelecting = false;
      this.checkForSelection();
    }, 50);
  }
  
  handleSelectionChange() {
    // Don't handle during active selection to avoid conflicts
    if (this.isSelecting) return;

    this.checkForSelection();
  }

  checkForSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 0) {
      this.selectedText = selectedText;

      // In AI mode, show action menu when text is selected
      if (this.aiMode) {
        try {
          // Get the selection position for menu placement
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Show menu near the end of selection
            this.showActionMenu(rect.right + 10, rect.bottom + 10);
          } else {
            // Fallback to center of screen
            this.showActionMenu(window.innerWidth / 2, window.innerHeight / 2);
          }
        } catch (error) {
          // Fallback to center of screen
          this.showActionMenu(window.innerWidth / 2, window.innerHeight / 2);
        }
      }
    } else {
      // Close action menu if no text is selected
      this.closeActionMenu();
    }
  }
  
  handleKeyDown(event) {
    // Toggle AI mode with Alt+A
    if (event.altKey && event.key === 'a') {
      event.preventDefault();
      this.toggleAIMode();
    }

    // Escape to close modals and tooltips
    if (event.key === 'Escape') {
      this.closeModal();
      this.closeActionMenu();
      this.hideTooltip();
    }
  }
  
  handleSelectStart(event) {
    // Allow text selection in both modes
    return true;
  }

  handleMouseOver(event) {
    // Only show tooltips in AI mode and if tooltips are enabled
    if (!this.aiMode || !this.settings?.settings?.showTooltips) {
      return;
    }

    // Don't show tooltips during text selection
    if (this.isSelecting) {
      return;
    }

    // Don't show tooltips over UI elements
    if (this.isUIElement(event.target)) {
      return;
    }

    const word = this.getWordAtPosition(event.target, event.clientX, event.clientY);
    if (word && word.length > 2 && word !== this.lastHoveredWord) {
      this.lastHoveredWord = word;
      this.scheduleTooltip(word, event.clientX, event.clientY);
    }
  }

  handleMouseOut(event) {
    // Cancel any pending tooltip
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    // Hide tooltip if mouse leaves the word area
    const relatedTarget = event.relatedTarget;
    if (!relatedTarget || !this.currentTooltip || !this.currentTooltip.contains(relatedTarget)) {
      this.hideTooltip();
    }
  }
  
  // Helper methods for tooltip functionality

  isUIElement(element) {
    // Check if element is part of extension UI or common UI elements
    if (!element) return true;

    const uiSelectors = [
      '#ai-cursor-indicator',
      '#ai-cursor-action-menu',
      '#ai-cursor-modal',
      '#ai-cursor-tooltip',
      'button',
      'input',
      'select',
      'textarea',
      '.ai-cursor-ui'
    ];

    return uiSelectors.some(selector => {
      try {
        return element.matches && element.matches(selector) ||
               element.closest && element.closest(selector);
      } catch (e) {
        return false;
      }
    });
  }

  getWordAtPosition(element, x, y) {
    // Get the text content and find word at cursor position
    if (!element || element.nodeType !== Node.TEXT_NODE) {
      // If not a text node, try to find text node at position
      const range = document.caretRangeFromPoint(x, y);
      if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
        return null;
      }
      element = range.startContainer;
    }

    const text = element.textContent;
    if (!text) return null;

    // Create a range to find the exact position
    const range = document.caretRangeFromPoint(x, y);
    if (!range) return null;

    const offset = range.startOffset;

    // Find word boundaries
    const wordRegex = /\b\w+\b/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      if (offset >= match.index && offset <= match.index + match[0].length) {
        return match[0];
      }
    }

    return null;
  }

  scheduleTooltip(word, x, y) {
    // Cancel any existing timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    // Hide any existing tooltip
    this.hideTooltip();

    // Schedule new tooltip
    this.hoverTimeout = setTimeout(() => {
      this.showTooltip(word, x, y);
    }, this.hoverDelay);
  }

  setupIndicatorDrag() {
    if (!this.indicator) return;

    this.indicator.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      const rect = this.indicator.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;

      // Prevent text selection while dragging
      e.preventDefault();

      // Add dragging class for visual feedback
      this.indicator.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.indicator) return;

      e.preventDefault();

      // Calculate new position
      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;

      // Keep indicator within viewport bounds
      const maxX = window.innerWidth - this.indicator.offsetWidth;
      const maxY = window.innerHeight - this.indicator.offsetHeight;

      const clampedX = Math.max(0, Math.min(x, maxX));
      const clampedY = Math.max(0, Math.min(y, maxY));

      this.indicator.style.left = `${clampedX}px`;
      this.indicator.style.top = `${clampedY}px`;
      this.indicator.style.right = 'auto'; // Override CSS right positioning
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging && this.indicator) {
        this.isDragging = false;
        this.indicator.classList.remove('dragging');

        // Save indicator position
        this.saveIndicatorPosition();
      }
    });
  }

  async saveIndicatorPosition() {
    if (!this.indicator) return;

    const rect = this.indicator.getBoundingClientRect();
    const position = {
      left: rect.left,
      top: rect.top
    };

    try {
      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: {
          indicatorPosition: position
        }
      });
    } catch (error) {
      // Failed to save position
    }
  }

  restoreIndicatorPosition() {
    if (!this.indicator || !this.settings?.indicatorPosition) return;

    const { left, top } = this.settings.indicatorPosition;

    // Ensure position is within viewport bounds
    const maxX = window.innerWidth - this.indicator.offsetWidth;
    const maxY = window.innerHeight - this.indicator.offsetHeight;

    const clampedX = Math.max(0, Math.min(left, maxX));
    const clampedY = Math.max(0, Math.min(top, maxY));

    this.indicator.style.left = `${clampedX}px`;
    this.indicator.style.top = `${clampedY}px`;
    this.indicator.style.right = 'auto';
  }

  updateSelectionPreview(event) {
    // Visual feedback for selection area
    // Could add a selection rectangle overlay here
  }
  
  showActionMenu(x, y) {
    this.closeActionMenu(); // Close any existing menu

    const menu = document.createElement('div');
    menu.id = 'ai-cursor-action-menu';
    menu.innerHTML = `
      <div class="action-menu">
        <button class="action-btn" data-action="explain">Explain</button>
        <button class="action-btn" data-action="simplify">Simplify</button>
        <button class="action-btn" data-action="define">Define</button>
        <button class="action-btn cancel-btn" data-action="cancel">Cancel</button>
      </div>
    `;

    // Position menu
    menu.style.position = 'fixed';
    menu.style.left = `${Math.min(x, window.innerWidth - 200)}px`;
    menu.style.top = `${Math.min(y, window.innerHeight - 150)}px`;
    menu.style.zIndex = '10000';

    document.body.appendChild(menu);

    // Add event listeners with proper delegation
    menu.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const button = event.target.closest('.action-btn');
      if (!button) {
        return;
      }

      const action = button.dataset.action;

      if (action && action !== 'cancel') {
        this.processWithAI(this.selectedText, action);
      }

      this.closeActionMenu();
    });

    // Auto-close after 10 seconds
    setTimeout(() => this.closeActionMenu(), 10000);
  }
  
  closeActionMenu() {
    const menu = document.getElementById('ai-cursor-action-menu');
    if (menu) {
      menu.remove();
    }
  }

  async showTooltip(word, x, y) {
    // Don't show tooltip if already showing for the same word
    if (this.currentTooltip && this.lastHoveredWord === word) {
      return;
    }

    this.hideTooltip();

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'ai-cursor-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-content">
        <div class="tooltip-loading">
          <div class="tooltip-spinner"></div>
          <span>Getting definition...</span>
        </div>
      </div>
    `;

    // Position tooltip near cursor
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${Math.min(x + 10, window.innerWidth - 250)}px`;
    tooltip.style.top = `${Math.max(y - 40, 10)}px`;
    tooltip.style.zIndex = '10001';

    document.body.appendChild(tooltip);
    this.currentTooltip = tooltip;

    // Get definition from AI
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'processText',
        text: word,
        type: 'tooltip'
      });

      if (response && response.response && this.currentTooltip === tooltip) {
        tooltip.innerHTML = `
          <div class="tooltip-content">
            <div class="tooltip-word">${word}</div>
            <div class="tooltip-definition">${response.response}</div>
          </div>
        `;
      } else if (this.currentTooltip === tooltip) {
        tooltip.innerHTML = `
          <div class="tooltip-content">
            <div class="tooltip-word">${word}</div>
            <div class="tooltip-error">Definition not available</div>
          </div>
        `;
      }
    } catch (error) {
      if (this.currentTooltip === tooltip) {
        tooltip.innerHTML = `
          <div class="tooltip-content">
            <div class="tooltip-word">${word}</div>
            <div class="tooltip-error">Definition not available</div>
          </div>
        `;
      }
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (this.currentTooltip === tooltip) {
        this.hideTooltip();
      }
    }, 5000);
  }

  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
    this.lastHoveredWord = '';
  }
  
  async processWithAI(text, type) {
    try {
      // Show loading indicator
      this.showLoadingModal();

      // Send to background script for processing
      const response = await chrome.runtime.sendMessage({
        action: 'processText',
        text: text,
        type: type
      });

      this.closeModal();

      if (response && response.error) {
        this.showErrorModal(response.error);
      } else if (response && response.response) {
        this.showResponseModal(response.response, text, type);
      } else {
        this.showErrorModal('Unexpected response format from AI service');
      }
    } catch (error) {
      this.closeModal();
      this.showErrorModal('Failed to process text: ' + error.message);
    }
  }
  
  showResponseModal(response, originalText, type) {
    this.closeModal();
    
    const modal = document.createElement('div');
    modal.id = 'ai-cursor-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>AI Response - ${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
            <button class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="original-text">
              <strong>Selected text:</strong>
              <p>"${originalText}"</p>
            </div>
            <div class="ai-response">
              <strong>AI Response:</strong>
              <p>${response}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="copy-btn">Copy Response</button>
            <button class="close-btn">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.addEventListener('click', (event) => {
      if (event.target.classList.contains('close-btn') || 
          event.target.classList.contains('modal-overlay')) {
        this.closeModal();
      }
      
      if (event.target.classList.contains('copy-btn')) {
        navigator.clipboard.writeText(response);
        event.target.textContent = 'Copied!';
        setTimeout(() => {
          event.target.textContent = 'Copy Response';
        }, 2000);
      }
    });
  }
  
  showLoadingModal() {
    this.closeModal();
    
    const modal = document.createElement('div');
    modal.id = 'ai-cursor-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content loading">
          <div class="loading-spinner"></div>
          <p>Processing with AI...</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  showErrorModal(error) {
    this.closeModal();
    
    const modal = document.createElement('div');
    modal.id = 'ai-cursor-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content error">
          <div class="modal-header">
            <h3>Error</h3>
            <button class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <p>${error}</p>
          </div>
          <div class="modal-footer">
            <button class="close-btn">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (event) => {
      if (event.target.classList.contains('close-btn') || 
          event.target.classList.contains('modal-overlay')) {
        this.closeModal();
      }
    });
  }
  
  closeModal() {
    const modal = document.getElementById('ai-cursor-modal');
    if (modal) {
      modal.remove();
    }
  }
  
  async toggleAIMode() {
    this.aiMode = !this.aiMode;

    // Update settings
    try {
      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: { aiMode: this.aiMode }
      });
    } catch (error) {
      // Settings update failed
    }

    this.updateCursorMode();
  }
  
  updateCursorMode() {
    // Handle indicator visibility based on settings
    const shouldShowIndicator = this.settings?.settings?.showIndicator;
    const indicator = document.getElementById('ai-cursor-indicator');

    if (shouldShowIndicator && !indicator) {
      // Create indicator if it should be shown but doesn't exist
      this.createCursorIndicator();
    } else if (!shouldShowIndicator && indicator) {
      // Remove indicator if it shouldn't be shown but exists
      indicator.remove();
      return;
    }

    // Update indicator if it exists
    const currentIndicator = document.getElementById('ai-cursor-indicator');
    if (currentIndicator) {
      currentIndicator.classList.toggle('ai-active', this.aiMode);

      const statusDot = currentIndicator.querySelector('.status-dot');
      const modeText = currentIndicator.querySelector('.mode-text');

      if (this.aiMode) {
        statusDot.style.backgroundColor = '#4CAF50';
        modeText.textContent = 'AI';
      } else {
        statusDot.style.backgroundColor = '#757575';
        modeText.textContent = 'STD';
        document.body.style.cursor = '';
      }
    }

    // Add/remove AI mode class to body for global styling
    document.body.classList.toggle('ai-cursor-mode', this.aiMode);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AICursor());
} else {
  new AICursor();
}
