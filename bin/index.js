#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CONFIG_FILE = path.join(os.homedir(), '.tmpa_config.json');

// Exact RGB Gradient Colors (Cyan -> Light Blue -> Deep Blue -> Purple)
const C = {
  reset: '\x1b[0m',
  c1: '\x1b[38;2;0;210;255m',   // Bright Cyan
  c2: '\x1b[38;2;30;144;255m',  // Light Blue
  c3: '\x1b[38;2;99;102;241m',  // Indigo Blue
  c4: '\x1b[38;2;168;85;247m',  // Purple
  green: '\x1b[38;2;34;197;94m',
  cyan: '\x1b[38;2;6x;182;212m',
  yellow: '\x1b[38;2;234;179;8m',
  red: '\x1b[38;2;239;68;68m',
  gray: '\x1b[38;2;148;163;184m',
  darkGray: '\x1b[38;2;71;85;105m'
};

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (!data.endpoint) {
        data.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
      }
      return data;
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
  
  // Exact Banner matching the image structure
  console.log(`
${C.c1}████████╗███╗   ███╗██████╗  █████╗ ${C.reset}
${C.c2}╚══██╔══╝████╗ ████║██╔══██╗██╔══██╗${C.reset}
${C.c2}   ██║   ██╔████╔██║██████╔╝███████║${C.reset}
${C.c3}   ██║   ██║╚██╔╝██║██╔═══╝ ██╔══██║${C.reset}
${C.c4}   ██║   ██║ ╚═╝ ██║██║     ██║  ██║${C.reset}
${C.c4}   ╚═╝   ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝${C.reset}
${C.darkGray}────────────────────────────────────────────────────────────${C.reset}
 ${C.reset}The Multi Platform AI ${C.green}[Interactive Mode]${C.reset}
 ${C.gray}/config : Set API | /connect : Web Integration | /uninstall : Remove | /exit : Exit${C.reset}
${C.darkGray}────────────────────────────────────────────────────────────${C.reset}
`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let config = loadConfig();

function askConfig(callback) {
  rl.question(`${C.yellow}[>] Enter API Key:${C.reset} `, (apiKey) => {
    rl.question(`${C.yellow}[>] Enter Endpoint URL (Press Enter for Default Gemini):${C.reset} `, (endpoint) => {
      config.apiKey = apiKey.trim();
      config.endpoint = endpoint.trim() || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
      saveConfig(config);
      console.log(`${C.green}[+] Configuration saved successfully!${C.reset}\n`);
      if (callback) callback();
    });
  });
}

async function handleChat(prompt) {
  if (!config.apiKey) {
    console.log(`${C.yellow}[!] API Key is not set.${C.reset}`);
    return askConfig(() => startPrompt());
  }

  if (!config.endpoint) {
    config.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  console.log(`${C.yellow}TMPA CLI processing...${C.reset}`);

  try {
    const url = config.endpoint.includes('googleapis.com') 
      ? `${config.endpoint}?key=${config.apiKey}` 
      : config.endpoint;

    const bodyData = config.endpoint.includes('googleapis.com')
      ? { contents: [{ parts: [{ text: prompt }] }] }
      : { prompt: prompt, apiKey: config.apiKey };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    const data = await response.json();
    let reply = 'No response from server.';

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      reply = data.candidates[0].content.parts[0].text;
    } else if (data.reply) {
      reply = data.reply;
    } else if (data.message) {
      reply = data.message;
    }

    console.log(`\n${C.c1}TMPA CLI :${C.reset} ${reply}\n`);
  } catch (error) {
    console.log(`\n${C.red}[x] Error: ${error.message}${C.reset}\n`);
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
    } else if (cmd === '/connect') {
      console.log(`\n${C.c4}[!] [COMING SOON] Web integration & auth login features will be available in the next release.${C.reset}\n`);
      startPrompt();
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
