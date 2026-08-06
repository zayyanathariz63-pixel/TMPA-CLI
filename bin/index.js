#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

// Base Paths
const TMPA_DIR = path.join(os.homedir(), '.tmpa');
const SKILLS_DIR = path.join(TMPA_DIR, 'skills');
const MCP_DIR = path.join(TMPA_DIR, 'mcp');
const CONFIG_FILE = path.join(os.homedir(), '.tmpa_config.json');
const REGISTRY_FILE = path.join(TMPA_DIR, 'registry.json');

// Ensure directories exist
if (!fs.existsSync(TMPA_DIR)) fs.mkdirSync(TMPA_DIR, { recursive: true });
if (!fs.existsSync(SKILLS_DIR)) fs.mkdirSync(SKILLS_DIR, { recursive: true });
if (!fs.existsSync(MCP_DIR)) fs.mkdirSync(MCP_DIR, { recursive: true });

const C = {
  reset: '\x1b[0m',
  c1: '\x1b[38;2;0;210;255m',
  c2: '\x1b[38;2;30;144;255m',
  c3: '\x1b[38;2;99;102;241m',
  c4: '\x1b[38;2;168;85;247m',
  green: '\x1b[38;2;34;197;94m',
  cyan: '\x1b[38;2;6;182;212m',
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

// Config & Registry Helpers
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch (e) { return {}; }
  }
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadRegistry() {
  if (fs.existsSync(REGISTRY_FILE)) {
    try { return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8')); } catch (e) { return { skills: {}, mcp: {} }; }
  }
  return { skills: {}, mcp: {} };
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
}

let rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let config = loadConfig();
let registry = loadRegistry();

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
 ${C.reset}The Multi Platform AI ${C.green}[Interactive Mode + Tool Runner]${C.reset}
 ${C.gray}/config | /models | /skill | /mcp | /connect | /scan | /exit${C.reset}
${C.darkGray}────────────────────────────────────────────────────────────${C.reset}
`);
}

// System Prompt Builder for Skills and MCPs
function getActiveToolsContext() {
  let contextParts = [];
  
  // Skills Context
  const activeSkills = Object.keys(registry.skills || {});
  if (activeSkills.length > 0) {
    contextParts.push("AVAILABLE SKILLS:");
    activeSkills.forEach(name => {
      const s = registry.skills[name];
      contextParts.push(`- Skill: ${name} (Path: ${s.path})`);
    });
  }

  // MCP Context
  const activeMCP = Object.keys(registry.mcp || {});
  if (activeMCP.length > 0) {
    contextParts.push("AVAILABLE MCP SERVERS:");
    activeMCP.forEach(name => {
      const m = registry.mcp[name];
      contextParts.push(`- MCP Server: ${name} (Target: ${m.target}, Type: ${m.type})`);
    });
  }

  if (contextParts.length === 0) return "";

  return "\n\n[SYSTEM CONTEXT: ACTIVE TOOLS & PROTOCOLS]\n" + contextParts.join("\n") +
         "\nIf you need to execute a connected JS skill or run local tools, specify standard instructions or output [EXEC_TOOL: tool_name(params)].\n";
}

// Handlers for Skills and MCP
function listSkills() {
  console.log(`\n${C.cyan}=== Registered Skills ===${C.reset}`);
  const keys = Object.keys(registry.skills || {});
  if (keys.length === 0) {
    console.log(`${C.gray}Belum ada skill yang terhubung. Gunakan ${C.yellow}/connect skill <path>${C.gray} untuk menghubungkan.${C.reset}\n`);
    return;
  }
  keys.forEach((name, i) => {
    const item = registry.skills[name];
    console.log(` ${C.yellow}${i + 1}.${C.reset} ${C.green}${name}${C.reset} -> ${C.gray}${item.path}${C.reset} [${item.status || 'Active'}]`);
  });
  console.log('');
}

function listMCP() {
  console.log(`\n${C.cyan}=== Registered MCP (Model Context Protocol) Servers ===${C.reset}`);
  const keys = Object.keys(registry.mcp || {});
  if (keys.length === 0) {
    console.log(`${C.gray}Belum ada MCP server terhubung. Gunakan ${C.yellow}/connect mcp <target>${C.gray} untuk menghubungkan.${C.reset}\n`);
    return;
  }
  keys.forEach((name, i) => {
    const item = registry.mcp[name];
    console.log(` ${C.yellow}${i + 1}.${C.reset} ${C.green}${name}${C.reset} -> ${C.gray}${item.target}${C.reset} [${item.type || 'local'}]`);
  });
  console.log('');
}

function connectResource(inputArgs) {
  const parts = inputArgs.trim().split(/\s+/);
  const type = parts[0]?.toLowerCase();
  const targetPath = parts.slice(1).join(' ');

  if (!type || !targetPath) {
    console.log(`${C.red}[x] Format salah! Gunakan:${C.reset}`);
    console.log(`  ${C.yellow}/connect skill <filepath_atau_folder>${C.reset}`);
    console.log(`  ${C.yellow}/connect mcp <filepath_atau_url>${C.reset}\n`);
    return;
  }

  const resolvedPath = path.resolve(targetPath);

  if (type === 'skill') {
    const skillName = path.basename(resolvedPath, path.extname(resolvedPath));
    registry.skills = registry.skills || {};
    registry.skills[skillName] = {
      path: resolvedPath,
      connectedAt: new Date().toISOString(),
      status: 'Active'
    };
    saveRegistry(registry);
    console.log(`${C.green}[+] Skill "${skillName}" berhasil dihubungkan dari: ${resolvedPath}${C.reset}\n`);
  } else if (type === 'mcp') {
    const mcpName = path.basename(resolvedPath, path.extname(resolvedPath));
    registry.mcp = registry.mcp || {};
    registry.mcp[mcpName] = {
      target: targetPath,
      type: targetPath.startsWith('http') ? 'remote' : 'local',
      connectedAt: new Date().toISOString(),
      status: 'Connected'
    };
    saveRegistry(registry);
    console.log(`${C.green}[+] MCP Server "${mcpName}" berhasil dihubungkan!${C.reset}\n`);
  } else {
    console.log(`${C.red}[x] Tipe tidak dikenal. Gunakan "skill" atau "mcp".${C.reset}\n`);
  }
}

function scanResources() {
  console.log(`${C.yellow}[...] Memindai folder ~/.tmpa/skills dan ~/.tmpa/mcp...${C.reset}`);
  registry = loadRegistry();

  if (fs.existsSync(SKILLS_DIR)) {
    const files = fs.readdirSync(SKILLS_DIR);
    files.forEach(file => {
      const fullPath = path.join(SKILLS_DIR, file);
      const name = path.basename(file, path.extname(file));
      if (!registry.skills[name]) {
        registry.skills[name] = { path: fullPath, connectedAt: new Date().toISOString(), status: 'Active' };
        console.log(`${C.green}[+] Auto-detected skill: ${name}${C.reset}`);
      }
    });
  }

  if (fs.existsSync(MCP_DIR)) {
    const files = fs.readdirSync(MCP_DIR);
    files.forEach(file => {
      const fullPath = path.join(MCP_DIR, file);
      const name = path.basename(file, path.extname(file));
      if (!registry.mcp[name]) {
        registry.mcp[name] = { target: fullPath, type: 'local', connectedAt: new Date().toISOString(), status: 'Connected' };
        console.log(`${C.green}[+] Auto-detected MCP: ${name}${C.reset}`);
      }
    });
  }

  saveRegistry(registry);
  console.log(`${C.green}[+] Pemindaian selesai.${C.reset}\n`);
}

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
          rl.question(`${C.yellow}[>] Enter Specific Model Name:${C.reset} `, (customModel) => {
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
        console.log(`${C.green}[+] Connected to ${selected.name}. Default model: ${selected.defaultModel}${C.reset}\n`);
        if (callback) callback();
      }
    });
  });
}

function selectModelCLI(allModels) {
  let filteredModels = [...allModels];
  let currentPage = 0;
  const pageSize = 12;

  function displayList() {
    console.clear();
    const totalPages = Math.ceil(filteredModels.length / pageSize) || 1;
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (currentPage < 0) currentPage = 0;

    const startIdx = currentPage * pageSize;
    const pageItems = filteredModels.slice(startIdx, startIdx + pageSize);

    console.log(`${C.cyan}=== Models Selector for ${config.provider} (${filteredModels.length} models) ===${C.reset}`);
    console.log(`${C.gray}Current Active: ${C.green}${config.model || 'None'}${C.reset}`);
    console.log(`${C.darkGray}────────────────────────────────────────────────────────────${C.reset}`);

    if (pageItems.length === 0) {
      console.log(`${C.red} No models found matching filter.${C.reset}`);
    } else {
      pageItems.forEach((m, idx) => {
        const itemNum = startIdx + idx + 1;
        const isCurrent = m.id === config.model;
        const bullet = isCurrent ? `${C.green}●${C.reset}` : `${C.gray}○${C.reset}`;
        console.log(` ${bullet} ${C.yellow}${itemNum.toString().padStart(3, ' ')}.${C.reset} ${m.id}`);
      });
    }

    console.log(`${C.darkGray}────────────────────────────────────────────────────────────${C.reset}`);
    console.log(`${C.cyan}Page ${currentPage + 1}/${totalPages}${C.reset} | ${C.gray}Commands: [n]ext | [p]rev | [f]ilter <keyword> | [q]uit${C.reset}`);

    rl.question(`\n${C.yellow}[>] Enter Number / Model ID / Command:${C.reset} `, (answer) => {
      const input = answer.trim();

      if (input.toLowerCase() === 'n') {
        if (currentPage < totalPages - 1) currentPage++;
        displayList();
      } else if (input.toLowerCase() === 'p') {
        if (currentPage > 0) currentPage--;
        displayList();
      } else if (input.toLowerCase() === 'q' || input.toLowerCase() === 'exit') {
        console.log(`${C.gray}Model selection cancelled.${C.reset}\n`);
        startPrompt();
      } else if (input.toLowerCase().startsWith('f ')) {
        const query = input.slice(2).trim().toLowerCase();
        filteredModels = allModels.filter(m => m.id.toLowerCase().includes(query));
        currentPage = 0;
        displayList();
      } else if (!isNaN(input) && input !== '') {
        const num = parseInt(input);
        if (num >= 1 && num <= filteredModels.length) {
          const selected = filteredModels[num - 1].id;
          config.model = selected;
          saveConfig(config);
          console.log(`\n${C.green}[+] Model changed to: ${config.model}${C.reset}\n`);
          startPrompt();
        } else {
          console.log(`${C.red}[x] Invalid number!${C.reset}`);
          setTimeout(displayList, 1000);
        }
      } else if (input.length > 0) {
        config.model = input;
        saveConfig(config);
        console.log(`\n${C.green}[+] Custom Model ID set to: ${config.model}${C.reset}\n`);
        startPrompt();
      } else {
        startPrompt();
      }
    });
  }

  displayList();
}

async function fetchAvailableModels() {
  if (!config.apiKey) {
    console.log(`${C.red}[x] API Key is not set. Use /config first.${C.reset}\n`);
    return startPrompt();
  }

  console.log(`${C.yellow}[...] Fetching models list from ${config.provider || 'Provider'}...${C.reset}`);

  try {
    let url = config.endpoint;
    if (url.includes('googleapis.com')) {
      console.log(`${C.yellow}[!] Gemini Default REST API uses fixed model: ${config.model}${C.reset}\n`);
      return startPrompt();
    }

    let modelsUrl = url.endsWith('/models') ? url : `${url.replace(/\/chat\/completions$/, '')}/models`;

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      selectModelCLI(data.data);
    } else {
      console.log(`${C.red}[x] Could not retrieve models list automatically from ${config.provider}.${C.reset}`);
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

    // Combine User Prompt + Active Tools Context
    const toolsContext = getActiveToolsContext();
    const fullPrompt = prompt + toolsContext;

    if (url.includes('googleapis.com')) {
      url = `${url}?key=${config.apiKey}`;
      bodyData = { contents: [{ parts: [{ text: fullPrompt }] }] };
    } else {
      if (!url.endsWith('/chat/completions')) {
        url = `${url.replace(/\/$/, '')}/chat/completions`;
      }
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      bodyData = {
        model: config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: fullPrompt }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bodyData)
    });

    const data = await response.json();

    let aiResponse = "";
    if (data.choices && data.choices[0]?.message?.content) {
      aiResponse = data.choices[0].message.content;
    } else if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      aiResponse = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      console.log(`\n${C.red}[x] API Error: ${data.error.message || JSON.stringify(data.error)}${C.reset}\n`);
      return startPrompt();
    } else {
      console.log(`\n${C.red}[x] Response: ${JSON.stringify(data)}${C.reset}\n`);
      return startPrompt();
    }

    console.log(`\n${C.c1}TMPA CLI (${config.model || 'AI'}) :${C.reset} ${aiResponse}\n`);

    // Check if AI requested execution of a local tool/skill
    if (aiResponse.includes('[EXEC_TOOL:')) {
      console.log(`${C.cyan}[+] Detected Tool Execution Request from AI...${C.reset}`);
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
    } else if (cmd === '/skill' || cmd === '/skills') {
      listSkills();
      startPrompt();
    } else if (cmd === '/mcp') {
      listMCP();
      startPrompt();
    } else if (cmd.startsWith('/connect')) {
      connectResource(cmd.replace('/connect', ''));
      startPrompt();
    } else if (cmd === '/scan') {
      scanResources();
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

showBanner();
if (!config.apiKey) {
  askConfig(() => startPrompt());
} else {
  startPrompt();
}
