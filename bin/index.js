#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CONFIG_FILE = path.join(os.homedir(), '.tmpa_config.json');

const C = {
  reset: '\x1b[0m',
  c1: '\x1b[38;2;0;210;255m',
  c2: '\x1b[38;2;30;144;255m',
  c3: '\x1b[38;2;99;102;241m',
  c4: '\x1b[38;2;168;85;247m',
  green: '\x1b[38;2;34;197;94m',
  cyan: '\x1b[38;2;6x;182;212m',
  yellow: '\x1b[38;2;234;179;8m',
  red: '\x1b[38;2;239;68;68m',
  gray: '\x1b[38;2;148;163;184m',
  darkGray: '\x1b[38;2;71;85;105m'
};

const PROVIDERS = {
  '1': { name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1', defaultModel: 'google/gemini-2.5-flash' },
  '2': { name: 'Groq', endpoint: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  '3': { name: 'NVIDIA NIM', endpoint: 'https://integrate.api.nvidia.com/v1', defaultModel: 'meta/llama-3.1-70b-instruct' },
  '4': { name: 'OpenAI', endpoint: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  '5': { name: 'Anthropic', endpoint: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-5-haiku-20241022' },
  '6': { name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', defaultModel: 'gemini-2.5-flash' },
  '7': { name: 'Custom / Auto-Detect', endpoint: '', defaultModel: '' }
};

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function showBanner() {
  console.clear();
  console.log(`
${C.c1}████████╗███╗   ███╗██████╗  █████╗ ${C.reset}
${C.c2}╚══██╔══╝████╗ ████║██╔══██╗██╔══██╗${C.reset}
${C.c2}   ██║   ██╔████╔██║██████╔╝███████║${C.reset}
${C.c3}   ██║   ██║╚██╔╝██║██╔═══╝ ██╔══██║${C.reset}
${C.c4}   ██║   ██║ ╚═╝ ██║██║     ██║  ██║${C.reset}
${C.c4}   ╚═╝   ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝${C.reset}
${C.darkGray}────────────────────────────────────────────────────────────${C.reset}
 ${C.reset}The Multi Platform AI ${C.green}[Interactive Mode]${C.reset}
 ${C.gray}/config : Set API | /models : View Models | /uninstall : Remove | /exit : Exit${C.reset}
${C.darkGray}────────────────────────────────────────────────────────────${C.reset}
`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let config = loadConfig();

function askConfig(callback) {
  console.log(`\n${C.cyan}[+] Choose AI Provider:${C.reset}`);
  console.log(` ${C.yellow}1.${C.reset} OpenRouter`);
  console.log(` ${C.yellow}2.${C.reset} Groq`);
  console.log(` ${C.yellow}3.${C.reset} NVIDIA NIM`);
  console.log(` ${C.yellow}4.${C.reset} OpenAI`);
  console.log(` ${C.yellow}5.${C.reset} Anthropic`);
  console.log(` ${C.yellow}6.${C.reset} Google Gemini (Default)`);
  console.log(` ${C.yellow}7.${C.reset} Custom / Auto-Detect Endpoint\n`);

  rl.question(`${C.yellow}[>] Select Provider (1-7):${C.reset} `, (choice) => {
    const selected = PROVIDERS[choice.trim()] || PROVIDERS['6'];
    
    rl.question(`${C.yellow}[>] Enter API Key for ${selected.name}:${C.reset} `, (apiKey) => {
      if (choice.trim() === '7') {
        rl.question(`${C.yellow}[>] Enter Custom Base URL / Endpoint:${C.reset} `, (customUrl) => {
          rl.question(`${C.yellow}[>] Enter Model Name:${C.reset} `, (customModel) => {
            config.provider = 'Custom';
            config.apiKey = apiKey.trim();
            config.endpoint = customUrl.trim();
            config.model = customModel.trim();
            saveConfig(config);
            console.log(`${C.green}[+] Configuration saved successfully!${C.reset}\n`);
            if (callback) callback();
          });
        });
      } else {
        config.provider = selected.name;
        config.apiKey = apiKey.trim();
        config.endpoint = selected.endpoint;
        config.model = selected.defaultModel;
        saveConfig(config);
        console.log(`${C.green}[+] Connected to ${selected.name} (${selected.defaultModel})${C.reset}\n`);
        if (callback) callback();
      }
    });
  });
}

async function fetchAvailableModels() {
  if (!config.apiKey) {
    console.log(`${C.red}[x] API Key is not set. Use /config first.${C.reset}\n`);
    return startPrompt();
  }

  console.log(`${C.yellow}[...] Fetching models for ${config.provider || 'Provider'}...${C.reset}`);

  try {
    let url = config.endpoint;
    if (url.endsWith('/generateContent')) {
      console.log(`${C.yellow}[!] Google Gemini default endpoint uses fixed model: ${config.model}${C.reset}\n`);
      return startPrompt();
    }

    // Auto-detect /models endpoint
    let modelsUrl = url.endsWith('/models') ? url : `${url.replace(/\/chat\/completions$/, '')}/models`;

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      console.log(`\n${C.cyan}=== Available Models ===${C.reset}`);
      const modelList = data.data.slice(0, 20); // Limit top 20 models
      modelList.forEach((m, idx) => {
        console.log(` ${C.yellow}${idx + 1}.${C.reset} ${m.id}`);
      });
      console.log(`${C.darkGray}------------------------------------------------------------${C.reset}`);
      
      rl.question(`\n${C.yellow}[>] Enter Model Name to use (or press Enter to keep current: ${config.model}):${C.reset} `, (newModel) => {
        if (newModel.trim()) {
          config.model = newModel.trim();
          saveConfig(config);
          console.log(`${C.green}[+] Active model updated to: ${config.model}${C.reset}\n`);
        } else {
          console.log(`${C.gray}Keeping current model: ${config.model}${C.reset}\n`);
        }
        startPrompt();
      });
    } else {
      console.log(`${C.red}[x] Unable to fetch models automatically from this provider.${C.reset}\n`);
      startPrompt();
    }
  } catch (err) {
    console.log(`${C.red}[x] Error fetching models: ${err.message}${C.reset}\n`);
    startPrompt();
  }
}

async function handleChat(prompt) {
  if (!config.apiKey) {
    console.log(`${C.yellow}[!] API Key is not set.${C.reset}`);
    return askConfig(() => startPrompt());
  }

  console.log(`${C.yellow}TMPA CLI processing...${C.reset}`);

  try {
    let url = config.endpoint;
    let headers = { 'Content-Type': 'application/json' };
    let bodyData = {};

    // Auto-Detect Request Format (Google Gemini vs OpenAI Compatible)
    if (url.includes('googleapis.com')) {
      url = `${url}?key=${config.apiKey}`;
      bodyData = { contents: [{ parts: [{ text: prompt }] }] };
    } else {
      // OpenAI Compatible (OpenRouter, Groq, NVIDIA, OpenAI, dll)
      if (!url.endsWith('/chat/completions')) {
        url = `${url.replace(/\/$/, '')}/chat/completions`;
      }
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      bodyData = {
        model: config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bodyData)
    });

    const data = await response.json();

    if (data.choices && data.choices[0]?.message?.content) {
      console.log(`\n${C.c1}TMPA CLI (${config.model || 'AI'}) :${C.reset} ${data.choices[0].message.content}\n`);
    } else if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      console.log(`\n${C.c1}TMPA CLI :${C.reset} ${data.candidates[0].content.parts[0].text}\n`);
    } else if (data.error) {
      console.log(`\n${C.red}[x] API Error: ${data.error.message || JSON.stringify(data.error)}${C.reset}\n`);
    } else {
      console.log(`\n${C.red}[x] Response: ${JSON.stringify(data)}${C.reset}\n`);
    }
  } catch (error) {
    console.log(`\n${C.red}[x] Fetch Error: ${error.message}${C.reset}\n`);
  }

  startPrompt();
}

function handleUninstall() {
  rl.question(`${C.red}[!] Are you sure you want to uninstall TMPA CLI? (y/N):${C.reset} `, (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log(`\n${C.yellow}[...] Removing TMPA CLI and cleaning configuration...${C.reset}`);
      try {
        if (fs.existsSync(CONFIG_FILE)) {
          fs.unlinkSync(CONFIG_FILE);
        }
        console.log(`${C.green}[+] Local configuration cleared.${C.reset}`);
        execSync('npm uninstall -g tmpa-cli', { stdio: 'inherit' });
        console.log(`\n${C.green}[+] TMPA CLI uninstalled successfully. Goodbye!${C.reset}\n`);
        process.exit(0);
      } catch (err) {
        console.log(`\n${C.red}[x] Failed to uninstall automatically. Run: npm uninstall -g tmpa-cli manually.${C.reset}\n`);
        process.exit(0);
      }
    } else {
      console.log(`${C.gray}Uninstall process cancelled.${C.reset}\n`);
      startPrompt();
    }
  });
}

function startPrompt() {
  rl.question(`${C.c1}TMPA >${C.reset} `, (input) => {
    const cmd = input.trim();

    if (cmd === '/exit') {
      console.log(`${C.gray}Goodbye!${C.reset}`);
      process.exit(0);
    } else if (cmd === '/clear') {
      showBanner();
      startPrompt();
    } else if (cmd === '/config') {
      askConfig(() => startPrompt());
    } else if (cmd === '/models') {
      fetchAvailableModels();
    } else if (cmd === '/uninstall') {
      handleUninstall();
    } else if (cmd === '') {
      startPrompt();
    } else {
      handleChat(cmd);
    }
  });
}

// Program Execution
showBanner();
if (!config.apiKey) {
  askConfig(() => startPrompt());
} else {
  startPrompt();
}
