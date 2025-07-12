# Zegoop: AI Cursor - Smart Text Selection Chrome Extension

A powerful Chrome extension that transforms your cursor into an AI-powered text selection tool. Switch between traditional cursor mode and AI mode to get instant explanations, simplifications, and definitions of any text on the web.

## 🚀 Features

### Dual Cursor Modes
- **Standard Mode**: Traditional text selection and cursor behavior
- **AI Mode**: Smart text selection with AI-powered analysis

### AI-Powered Text Analysis
- **Explain**: Get clear explanations of complex text
- **Simplify**: Rephrase difficult content in simple terms
- **Define**: Get definitions of words or phrases
- **Context Menu**: Right-click selected text for quick AI actions

### Multiple LLM Support
- **OpenAI** (GPT-3.5/GPT-4)
- **Anthropic** (Claude)
- **Google** (Gemini)
- **xAI** (Grok)

### Smart Features
- Visual mode indicator
- Customizable keyboard shortcuts
- Responsive modal design
- Privacy-focused (data stays between you and your chosen LLM)

## 📦 Installation

### From Source (Developer Mode)

1. **Download or Clone**
   ```bash
   git clone https://github.com/codleed/zegoop.git
   cd zegoop
   ```

2. **Create Icons** (Optional)
   - Add icon files to the `icons/` directory:
     - `icon16.png` (16x16)
     - `icon32.png` (32x32) 
     - `icon48.png` (48x48)
     - `icon128.png` (128x128)

3. **Load Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the extension directory

4. **Pin Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Pin "AI Cursor" for easy access

## ⚙️ Setup

### 1. Configure Your LLM

1. Click the AI Cursor extension icon
2. Click "Full Settings" or go to extension options
3. Choose your preferred LLM provider
4. Enter your API key:

#### Getting API Keys:
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)
- **Google Gemini**: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- **xAI Grok**: [console.x.ai](https://console.x.ai/)

### 2. Test Your Setup

1. Click "Test API Connection" in settings
2. If successful, you're ready to go!

## 🎯 How to Use

### Method 1: AI Cursor Mode

1. **Toggle AI Mode**
   - Press `Alt + A` or
   - Click the extension icon and toggle AI mode

2. **Select Text**
   - In AI mode, click and drag to select text
   - Choose an action from the popup menu:
     - **Explain** - Get a clear explanation
     - **Simplify** - Make it easier to understand
     - **Define** - Get definitions

3. **View Results**
   - AI response appears in a modal
   - Copy the response if needed
   - Press `Esc` to close

### Method 2: Context Menu (Any Mode)

1. **Select Text** (traditional selection)
2. **Right-click** on selected text
3. **Choose AI Action**:
   - "Explain with AI"
   - "Simplify with AI"

### Method 3: Extension Popup

1. **Click Extension Icon**
2. **Use Quick Actions**:
   - Test Selection
   - Open Full Settings

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + A` | Toggle between Standard and AI cursor modes |
| `Esc` | Close any open modals or menus |
| Right-click | Context menu with AI options (when text selected) |

## 🔧 Customization

### Settings Options

- **LLM Provider**: Choose your preferred AI service
- **Auto Mode**: Automatically enable AI mode on supported sites
- **Modal Position**: Where AI responses appear
- **Response Length**: Short, medium, or detailed responses
- **Keyboard Shortcuts**: Customize hotkeys

### Privacy Settings

- **Local Storage**: API keys stored securely in your browser
- **No Data Collection**: Extension doesn't collect or store your data
- **Direct Communication**: Text sent only to your chosen LLM provider
- **Opt-out Analytics**: Disable usage analytics

## 🛠️ Development

### Project Structure
```
ai-cursor-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Content script
├── content.css           # Content styles
├── popup.html            # Extension popup
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── options.html          # Settings page
├── options.css           # Settings styles
├── options.js            # Settings functionality
├── icons/                # Extension icons
└── README.md             # This file
```

### Key Components

1. **Background Script** (`background.js`)
   - Handles API calls to LLM providers
   - Manages extension settings
   - Context menu creation

2. **Content Script** (`content.js`)
   - Text selection handling
   - AI mode cursor behavior
   - Modal display and interaction

3. **Popup** (`popup.html/js/css`)
   - Quick settings and mode toggle
   - Usage statistics
   - Quick actions

4. **Options Page** (`options.html/js/css`)
   - Full configuration interface
   - API key management
   - Advanced settings

## 🔒 Privacy & Security

- **API Keys**: Stored locally using Chrome's secure storage API
- **No Tracking**: Extension doesn't track or collect user data
- **Secure Communication**: All API calls use HTTPS
- **Minimal Permissions**: Only requests necessary permissions
- **Open Source**: Code is transparent and auditable

## 🐛 Troubleshooting

### Common Issues

1. **Extension Not Working**
   - Refresh the page after installing
   - Check if extension is enabled
   - Verify API key is configured

2. **API Errors**
   - Check API key validity
   - Verify internet connection
   - Test API connection in settings

3. **Selection Not Working**
   - Make sure you're in AI mode (`Alt + A`)
   - Try refreshing the page
   - Check browser console for errors

### Getting Help

- **Documentation**: Check this README
- **Issues**: [GitHub Issues](https://github.com/codleed/zegoop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/codleed/zegoop/discussions)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Chrome Extensions API documentation
- LLM providers for their APIs
- Open source community for inspiration

---

**Made with ❤️ for better web browsing**
