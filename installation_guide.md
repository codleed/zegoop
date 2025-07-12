# 🛠 How to Install the Unpacked "Zegoop" Chrome Extension
## ✅ Step 1: Prepare the Extension Folder
Make sure your Zegoop extension folder contains the following files (example structure):

arduino
Copy
Edit
Zegoop/
├── manifest.json
├── content.js
├── background.js or service_worker.js
├── popup.html (if any)
├── icons/
│   └── icon128.png
└── style.css (optional)
⚠️ Ensure manifest.json is valid and includes "manifest_version": 3.

## ✅ Step 2: Open Chrome Extensions Page
Open Google Chrome.

In the address bar, type:

arduino
Copy
Edit
chrome://extensions
and press Enter.

## ✅ Step 3: Enable Developer Mode
Toggle Developer mode ON (top-right corner of the extensions page).

## ✅ Step 4: Load Your Extension
Click the “Load unpacked” button.

In the file dialog, select the Zegoop folder (not zipped).

Click Select Folder.

## ✅ Step 5: Done! 🎉
Zegoop is now installed as an unpacked extension.

You’ll see it in your Chrome toolbar.

You can now hover over words or select text to use the Define, Explain, or Simplify features.

## 🧪 Optional: Test & Debug
Visit any website and test the extension's functionality.

For logs/errors, go to:

arduino
Copy
Edit
chrome://extensions
→ Zegoop → Background page / Inspect views
🔄 Updating the Extension
If you make changes to your code:

Go back to chrome://extensions

Click Reload under the Zegoop extension
