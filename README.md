# 🚀 TMPA CLI (The Multi Platform AI)

[![npm version](https://img.shields.io/npm/v/tmpa-cli.svg?color=blue)](https://www.npmjs.com/package/tmpa-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**TMPA CLI** is an interactive Node.js-based Command Line Interface (CLI) application that allows you to chat with various AI models (such as Google Gemini API or your own Custom REST API) directly from your terminal without opening a browser.

---

## ✨ Key Features

- 🎨 **Modern Terminal UI**: Features a colorful futuristic ASCII Art banner and real-time loading indicators.
- 🌐 **Multi-Endpoint API**: Supports **Google Gemini API** (*default*) as well as your own **Custom REST API Endpoint**.
- ⚙️ **Flexible Configuration**: Your API Key and Endpoint settings are securely saved in a local configuration file (`~/.tmpa_config.json`).
- ⚡ **Instant Commands**: Internal command support such as `/config`, `/clear`, and `/exit`.
- 🪶 **Lightweight & Fast**: Zero heavy dependencies, runs smoothly on Termux (Android), Linux, macOS, and Windows Terminal.

---

## 📦 Installation

### 1. Official Installation via npm (Recommended)

Make sure you have **Node.js** (v18+) installed in your terminal. Run the following global command:

```bash
npm install -g tmpa-cli

2. Installation via GitHub
​You can also install directly from the GitHub repository:

npm install -g git+[https://github.com/zayyanathariz63-pixel/TMPA-CLI.git](https://github.com/zayyanathariz63-pixel/TMPA-CLI.git)

🚀 Usage
​Once installed, simply open your terminal and type:

bash :
tmpa

🔑 First-Time Setup
​When you run the application for the first time, you will be prompted to enter:

1. API Key: Your API Key (e.g., from Google AI Studio).
2. API Endpoint URL:
​Press Enter to use the default Gemini API (gemini-2.5-flash).
​Or enter your own Custom REST API URL.

​🕹️ In-CLI Commands
​While inside the TMPA > chat session, you can use the following control commands:

Command Description
/config --> Update or change stored API Key and API Endpoint
/clear --> Clear the terminal screen and display the main banner
/exit --> Exit the TMPA CLI application

Preview Example :
 ████████╗███╗   ███╗██████╗  █████╗ 
 ╚══██╔══╝████╗ ████║██╔══██╗██╔══██╗
    ██║   ██╔████╔██║██████╔╝███████║
    ██║   ██║╚██╔╝██║██╔═══╝ ██╔══██║
    ██║   ██║ ╚═╝ ██║██║     ██║  ██║
    ╚═╝   ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝
 ───────────────────────────────────────────────────
  The Multi Platform AI [Interactive Mode]
  /config : Change API | /clear : Clear Screen | /exit : Exit
 ───────────────────────────────────────────────────

TMPA > hello, who are you?
TMPA CLI processing...
TMPA CLI : I am an AI assistant ready to help you!

📁 Project Structure :
tmpa-cli/
├── bin/
│   └── index.js      # Main CLI script (Node.js)
├── .gitignore        # Git ignore rules
├── package.json      # npm package manifest
└── README.md         # Official project documentation

📄 License
​This project is licensed under the MIT License.
​👤 Developer
​Developed by Zayyan Athariz - GitHub: @zayyanathariz63-pixel
​npm: tmpa-cli
