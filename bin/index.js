#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CONFIG_FILE = path.join(os.homedir(), '.tmpa_config.json');

// Color Palette (TrueColor / ANSI Escape Codes)
const COLOR = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  blue: '\x1b[38;2;59;130;246m',      // #3B82F6
  purple: '\x1b[38;2;168;85;247m',    // #A855F7
  green: '\x1b[38;2;34;197;94m',      // #22C55E
  yellow: '\x1b[38;2;234;179;8m',     // #EAB308
  red: '\x1b[38;2;239;68;68m',        // #EF4444
  gray: '\x1b[38;2;100;116;139m'      // #64748B
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
  
  // ASCII Art Banner with Blue-to-Purple Gradient Effect
  const line1 = `${COLOR.blue} ████████╗███╗   ███╗██████╗  █████╗ ${COLOR.reset}`;
  const line2 = `${COLOR.blue} ╚══██╔══╝████╗ ████║██╔══██╗██╔══██╗${COLOR.reset}`;
  const line3 = `${COLOR.blue}    ██║   ██╔████╔██║██████╔╝███████║${COLOR.reset}`;
  const line4 = `${COLOR.purple}    ██║   ██║╚██╔╝██║██╔═══╝ ██╔══██║${COLOR.reset}`;
  const line5 = `${COLOR.purple}    ██║   ██║ ╚═╝ ██║██║     ██║  ██║${COLOR.reset}`;
  const line6 = `${COLOR.purple}    ╚═╝   ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝${COLOR.reset}`;

  console.log(`\n${line1}\n${line2}\n${line3}\n${line4}\n${line5}\n${line6}`);
  console.log(`${COLOR.gray}───────────────────────────────────────────────────${COLOR.reset}`);
  console.log(`  ${COLOR.green}The Multi Platform AI [Interactive Mode]${COLOR.reset}`);
  console.log(`  ${COLOR.gray}/config${COLOR.reset} : Set API Key | ${COLOR.gray}/connect${COLOR.reset} : Connect Web`);
  console.log(`  ${COLOR.gray}/uninstall${COLOR.reset} : Remove CLI | ${COLOR.gray}/exit${COLOR.reset} : Exit Session`);
  console.log(`${COLOR.gray}───────────────────────────────────────────────────${COLOR.reset}\n`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let config = loadConfig();

function askConfig(callback) {
  rl.question(`${COLOR.yellow}[>] Enter API Key:${COLOR.reset} `, (apiKey) => {
    rl.question(`${COLOR.yellow}[>] Enter Endpoint URL (Press Enter for Default Gemini):${COLOR.reset} `, (endpoint) => {
      config.apiKey = apiKey.trim();
      config.endpoint = endpoint.trim() || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
      saveConfig(config);
      console.log(`${COLOR.green}[+] Configuration saved successfully!${COLOR.reset}\n`);
      if (callback) callback();
    });
  });
}

async function handleChat(prompt) {
  if (!config.apiKey) {
    console.log(`${COLOR.yellow}[!] API Key is not set.${COLOR.reset}`);
    return askConfig(() => startPrompt());
  }

  if (!config.endpoint) {
    config.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  console.log(`${COLOR.yellow}TMPA CLI processing...${COLOR.reset}`);

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

    console.log(`\n${COLOR.blue}TMPA CLI :${COLOR.reset} ${reply}\n`);
  } catch (error) {
    console.log(`\n${COLOR.red}[x] Error: ${error.message}${COLOR.reset}\n`);
  }

  startPrompt();
}

function handleUninstall() {
  rl.question(`${COLOR.red}[!] Are you sure you want to uninstall TMPA CLI? (y/N):${COLOR.reset} `, (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log(`\n${COLOR.yellow}[...] Removing TMPA CLI and cleaning configuration...${COLOR.reset}`);
      try {
        if (fs.existsSync(CONFIG_FILE)) {
          fs.unlinkSync(CONFIG_FILE);
        }
        console.log(`${COLOR.green}[+] Local configuration cleared.${COLOR.reset}`);
        execSync('npm uninstall -g tmpa-cli', { stdio: 'inherit' });
        console.log(`\n${COLOR.green}[+] TMPA CLI uninstalled successfully. Goodbye!${COLOR.reset}\n`);
        process.exit(0);
      } catch (err) {
        console.log(`\n${COLOR.red}[x] Failed to uninstall automatically. Run: npm uninstall -g tmpa-cli manually.${COLOR.reset}\n`);
        process.exit(0);
      }
    } else {
      console.log(`${COLOR.gray}Uninstall process cancelled.${COLOR.reset}\n`);
      startPrompt();
    }
  });
}

function startPrompt() {
  rl.question(`${COLOR.cyan}TMPA >${COLOR.reset} `, (input) => {
    const cmd = input.trim();

    if (cmd === '/exit') {
      console.log(`${COLOR.gray}Goodbye!${COLOR.reset}`);
      process.exit(0);
    } else if (cmd === '/clear') {
      showBanner();
      startPrompt();
    } else if (cmd === '/config') {
      askConfig(() => startPrompt());
    } else if (cmd === '/connect') {
      console.log(`\n${COLOR.purple}[!] [COMING SOON] Web integration & auth login features will be available in the next release.${COLOR.reset}\n`);
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

// Program Entry Point
showBanner();
if (!config.apiKey) {
  askConfig(() => startPrompt());
} else {
  startPrompt();
}
