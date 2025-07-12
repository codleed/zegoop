// AI Cursor Extension - Background Service Worker

// Extension installation and setup
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    await chrome.storage.sync.set({
      aiMode: false,
      selectedLLM: 'openai',
      apiKeys: {},
      shortcuts: {
        toggleMode: 'Alt+A'
      },
      settings: {
        autoMode: false,
        showTooltips: true,
        modalPosition: 'center',
        showIndicator: false
      },
      systemPrompts: {
        global: '',
        explain: '',
        simplify: '',
        define: '',
        tooltip: 'Provide brief, single-sentence definitions. Keep responses under 20 words.'
      },
      indicatorPosition: null
    });
    
    // Open options page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html')
    });
  }
});

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ai-explain',
    title: 'Explain with AI',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'ai-simplify',
    title: 'Simplify with AI',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'toggle-ai-mode',
    title: 'Toggle AI Cursor Mode',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'ai-explain':
      await handleAIRequest(tab.id, info.selectionText, 'explain');
      break;
    case 'ai-simplify':
      await handleAIRequest(tab.id, info.selectionText, 'simplify');
      break;
    case 'toggle-ai-mode':
      await toggleAIMode(tab.id);
      break;
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'processText':
      processTextRequest(sender.tab.id, request.text, request.type)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep message channel open for async response

    case 'getSettings':
      chrome.storage.sync.get()
        .then(settings => sendResponse(settings))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'updateSettings':
      chrome.storage.sync.set(request.settings)
        .then(() => {
          // Notify all content scripts about settings update
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {
                // Ignore errors for tabs without content script
              });
            });
          });
          sendResponse({ success: true });
        })
        .catch(error => sendResponse({ error: error.message }));
      return true;
  }
});

// AI request handler for context menu (sends messages to tab)
async function handleAIRequest(tabId, text, type) {
  try {
    const settings = await chrome.storage.sync.get();
    const { selectedLLM, apiKeys } = settings;

    if (!apiKeys[selectedLLM]) {
      throw new Error(`No API key configured for ${selectedLLM}`);
    }

    const prompt = await generatePrompt(text, type);
    const response = await callLLM(selectedLLM, prompt, apiKeys[selectedLLM]);

    // Send response to content script
    chrome.tabs.sendMessage(tabId, {
      action: 'showAIResponse',
      response: response,
      originalText: text,
      type: type
    });

    return { success: true, response };
  } catch (error) {
    chrome.tabs.sendMessage(tabId, {
      action: 'showError',
      error: error.message
    });
    return { error: error.message };
  }
}

// AI request handler for content script messages (returns response directly)
async function processTextRequest(tabId, text, type) {
  try {
    const settings = await chrome.storage.sync.get();
    const { selectedLLM, apiKeys } = settings;

    if (!selectedLLM) {
      throw new Error('No LLM provider selected. Please configure in extension settings.');
    }

    if (!apiKeys || !apiKeys[selectedLLM]) {
      throw new Error(`No API key configured for ${selectedLLM}. Please add your API key in extension settings.`);
    }

    const prompt = await generatePrompt(text, type);
    const response = await callLLM(selectedLLM, prompt, apiKeys[selectedLLM]);

    return { success: true, response: response };
  } catch (error) {
    return { error: error.message };
  }
}

// Generate appropriate prompt based on request type
async function generatePrompt(text, type) {
  // Get user's system prompt settings
  const settings = await chrome.storage.sync.get(['systemPrompts']);
  const systemPrompts = settings.systemPrompts || {};

  const basePrompts = {
    explain: `Please explain the meaning of the following text in simple terms: "${text}"`,
    simplify: `Please simplify and rephrase the following text to make it easier to understand: "${text}"`,
    define: `Please provide a clear definition of: "${text}"`,
    translate: `Please translate the following text to English: "${text}"`,
    tooltip: `Provide a brief, concise definition of the word "${text}" in one sentence. Keep it under 20 words.`
  };

  const basePrompt = basePrompts[type] || basePrompts.explain;

  // Add system prompt if configured
  const systemPrompt = systemPrompts[type] || systemPrompts.global || '';

  if (systemPrompt) {
    return `${systemPrompt}\n\n${basePrompt}`;
  }

  return basePrompt;
}

// LLM API caller
async function callLLM(provider, prompt, apiKey) {
  const apis = {
    openai: {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7
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
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      }
    },
    gemini: {
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        contents: [{ parts: [{ text: prompt }] }]
      }
    }
  };
  
  const config = apis[provider];
  if (!config) {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }
  
  const response = await fetch(config.url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify(config.body)
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return extractResponse(provider, data);
}

// Extract response text from different API formats
function extractResponse(provider, data) {
  switch (provider) {
    case 'openai':
      return data.choices[0]?.message?.content || 'No response received';
    case 'anthropic':
      return data.content[0]?.text || 'No response received';
    case 'gemini':
      return data.candidates[0]?.content?.parts[0]?.text || 'No response received';
    default:
      return 'Unknown response format';
  }
}

// Toggle AI mode
async function toggleAIMode(tabId) {
  const settings = await chrome.storage.sync.get(['aiMode']);
  const newMode = !settings.aiMode;
  
  await chrome.storage.sync.set({ aiMode: newMode });
  
  chrome.tabs.sendMessage(tabId, {
    action: 'toggleMode',
    aiMode: newMode
  });
}
