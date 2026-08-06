#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

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
  darkGray: '\x1b[38;2;71;85;105m',
  bold: '\x1b[1m'
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

// 100+ POPULAR MCP PRESETS LIST
const MCP_PRESETS = [
  { id: 'custom', name: '🛠️ Custom / Lainnya', category: 'General', type: 'custom', desc: 'Input Manual Name, Target, & Key' },
  
  // Cloud, AI & UI
  { id: 'google-stitch', name: '⚡ Google Stitch', category: 'Cloud & AI', type: 'direct-api', endpoint: 'https://stitch.googleapis.com/v1', reqAuth: 'GOOGLE_STITCH_API_KEY', desc: 'UI & App Prototyping MCP by Google' },
  { id: 'supabase', name: '⚡ Supabase MCP', category: 'Cloud & AI', type: 'direct-api', endpoint: 'https://api.supabase.com/mcp', reqAuth: 'SUPABASE_ACCESS_TOKEN', desc: 'Database, Auth & Storage Management' },
  { id: 'cloudflare-workers', name: '☁️ Cloudflare Workers', category: 'Cloud & AI', type: 'stdio', command: 'npx -y @cloudflare/mcp-server-cloudflare', reqAuth: 'CLOUDFLARE_API_TOKEN', desc: 'Deploy & manage edge functions' },
  { id: 'vercel', name: '▲ Vercel MCP', category: 'Cloud & AI', type: 'direct-api', endpoint: 'https://api.vercel.com/v1/mcp', reqAuth: 'VERCEL_TOKEN', desc: 'Manage projects & deployments' },
  { id: 'railway', name: '🚂 Railway MCP', category: 'Cloud & AI', type: 'direct-api', endpoint: 'https://backboard.railway.app/mcp', reqAuth: 'RAILWAY_API_TOKEN', desc: 'Cloud infrastructure & DB runner' },
  { id: 'firebase', name: '🔥 Firebase MCP', category: 'Cloud & AI', type: 'stdio', command: 'npx -y firebase-mcp-server', reqAuth: 'FIREBASE_TOKEN', desc: 'Firestore, Auth & Realtime DB' },
  { id: 'huggingface', name: '🤗 HuggingFace Spaces', category: 'Cloud & AI', type: 'direct-api', endpoint: 'https://huggingface.co/api/mcp', reqAuth: 'HF_TOKEN', desc: 'Run open-source AI models & spaces' },
  { id: 'replicate', name: '🌀 Replicate MCP', category: 'Cloud & AI', type: 'stdio', command: 'npx -y @replicate/mcp-server', reqAuth: 'REPLICATE_API_TOKEN', desc: 'Run image/video AI generation models' },
  
  // Developer Tools & VCS
  { id: 'github', name: '🐙 GitHub Official', category: 'Developer Tools', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-github', reqAuth: 'GITHUB_PERSONAL_ACCESS_TOKEN', desc: 'Repository, Issues, PRs & Gists' },
  { id: 'gitlab', name: '🦊 GitLab MCP', category: 'Developer Tools', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-gitlab', reqAuth: 'GITLAB_PERSONAL_ACCESS_TOKEN', desc: 'GitLab projects & CI/CD pipelines' },
  { id: 'postman', name: '🚀 Postman MCP', category: 'Developer Tools', type: 'stdio', command: 'npx -y @postman/mcp-server', reqAuth: 'POSTMAN_API_KEY', desc: 'API Collection testing & documentation' },
  { id: 'sentry', name: '🛡️ Sentry Error Tracker', category: 'Developer Tools', type: 'stdio', command: 'npx -y @sentry/mcp-server', reqAuth: 'SENTRY_AUTH_TOKEN', desc: 'Inspect application bugs & stacktraces' },
  { id: 'docker', name: '🐳 Docker Local MCP', category: 'Developer Tools', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-docker', desc: 'Manage local containers & images' },

  // Databases & Storage
  { id: 'postgresql', name: '🗄️ PostgreSQL', category: 'Databases', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-postgres', reqAuth: 'DATABASE_URL', desc: 'Direct SQL query execution' },
  { id: 'mysql', name: '🐬 MySQL MCP', category: 'Databases', type: 'stdio', command: 'npx -y mysql-mcp-server', reqAuth: 'MYSQL_CONNECTION_STRING', desc: 'MySQL relational database runner' },
  { id: 'sqlite', name: '📦 SQLite Local', category: 'Databases', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-sqlite', desc: 'Lightweight local database query tool' },
  { id: 'mongodb', name: '🍃 MongoDB MCP', category: 'Databases', type: 'stdio', command: 'npx -y mongodb-mcp-server', reqAuth: 'MONGODB_URI', desc: 'NoSQL collection queries & aggregation' },
  { id: 'redis', name: '🔴 Redis Cache', category: 'Databases', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-redis', reqAuth: 'REDIS_URL', desc: 'Key-value data structure store' },
  { id: 'pinecone', name: '🌲 Pinecone Vector DB', category: 'Databases', type: 'direct-api', endpoint: 'https://api.pinecone.io/mcp', reqAuth: 'PINECONE_API_KEY', desc: 'Vector database for AI embeddings' },

  // Search & Web Scraping
  { id: 'brave-search', name: '🦁 Brave Search', category: 'Search & Scraping', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-brave-search', reqAuth: 'BRAVE_API_KEY', desc: 'Real-time global web search engine' },
  { id: 'tavily', name: '🔍 Tavily AI Search', category: 'Search & Scraping', type: 'stdio', command: 'npx -y tavily-mcp', reqAuth: 'TAVILY_API_KEY', desc: 'Optimized search engine for LLMs' },
  { id: 'puppeteer', name: '🌐 Puppeteer Scraper', category: 'Search & Scraping', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-puppeteer', desc: 'Headless browser web automation & screenshot' },
  { id: 'firecrawl', name: '🔥 Firecrawl Scraper', category: 'Search & Scraping', type: 'direct-api', endpoint: 'https://api.firecrawl.dev/v1/mcp', reqAuth: 'FIRECRAWL_API_KEY', desc: 'Convert entire websites to clean Markdown' },
  { id: 'fetch', name: '📡 Fetch HTTP Utility', category: 'Search & Scraping', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-fetch', desc: 'HTTP request & web page parser' },

  // Productivity & Communication
  { id: 'notion', name: '📄 Notion Workspace', category: 'Productivity', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-notion', reqAuth: 'NOTION_API_TOKEN', desc: 'Read & edit Notion pages and databases' },
  { id: 'slack', name: '💬 Slack Channel', category: 'Productivity', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-slack', reqAuth: 'SLACK_BOT_TOKEN', desc: 'Send messages & read channels' },
  { id: 'discord', name: '🎮 Discord Bot MCP', category: 'Productivity', type: 'stdio', command: 'npx -y discord-mcp-server', reqAuth: 'DISCORD_BOT_TOKEN', desc: 'Interact with Discord servers & channels' },
  { id: 'linear', name: '📐 Linear Issue Tracker', category: 'Productivity', type: 'stdio', command: 'npx -y @linear/mcp-server', reqAuth: 'LINEAR_API_KEY', desc: 'Manage project issues & sprint cycles' },
  { id: 'google-drive', name: '📁 Google Drive', category: 'Productivity', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-gdrive', reqAuth: 'GDRIVE_CLIENT_ID', desc: 'Access Drive documents & sheets' }
];

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

function drawBox(title, contentLines, borderColor = C.cyan) {
  const width = 64;
  console.log(`${borderColor}┌${'─'.repeat(width - 2)}┐${C.reset}`);
  console.log(`${borderColor}│ ${C.bold}${title.padEnd(width - 4)}${C.reset}${borderColor} │${C.reset}`);
  console.log(`${borderColor}├${'─'.repeat(width - 2)}┤${C.reset}`);
  contentLines.forEach(line => {
    console.log(`${borderColor}│${C.reset} ${line.padEnd(width - 4)} ${borderColor}│${C.reset}`);
  });
  console.log(`${borderColor}└${'─'.repeat(width - 2)}┘${C.reset}`);
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
 ${C.reset}The Multi Platform AI ${C.green}[MCP Hub & Interactive Provider Engine]${C.reset}
 ${C.gray}/config | /models | /skill | /mcp | /new-mcp | /scan | /uninstall | /exit${C.reset}
${C.darkGray}────────────────────────────────────────────────────────────${C.reset}
`);
}

function readResourceContent(targetPath) {
  if (!fs.existsSync(targetPath)) return "[Resource file/directory not found on local system]";

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    try {
      return fs.readFileSync(targetPath, 'utf8');
    } catch (e) {
      return `[Error reading file: ${e.message}]`;
    }
  } else if (stat.isDirectory()) {
    const candidateFiles = ['SKILL.md', 'skill.md', 'PROMPT.md', 'README.md', 'index.js', 'index.ts', 'main.py'];
    for (const file of candidateFiles) {
      const full = path.join(targetPath, file);
      if (fs.existsSync(full)) {
        try {
          return `--- Content from ${file} ---\n` + fs.readFileSync(full, 'utf8');
        } catch (e) {}
      }
    }

    try {
      const files = fs.readdirSync(targetPath);
      let combinedText = `Directory Contents for ${path.basename(targetPath)}:\n`;
      files.slice(0, 5).forEach(f => {
        const fp = path.join(targetPath, f);
        if (fs.statSync(fp).isFile()) {
          combinedText += `\n--- File: ${f} ---\n` + fs.readFileSync(fp, 'utf8').slice(0, 2000);
        }
      });
      return combinedText;
    } catch (e) {
      return `[Directory found at ${targetPath}, but unable to parse files]`;
    }
  }
  return "[Unknown resource format]";
}

function getActiveToolsContext(forcedTool = null) {
  if (forcedTool) {
    let rawContent = "";
    if (forcedTool.type === 'mcp' || forcedTool.type === 'stdio' || forcedTool.type === 'direct-api') {
      rawContent = `MCP Server Info:
Name: ${forcedTool.name}
Target/Endpoint: ${forcedTool.target}
Type: ${forcedTool.mcpType || 'stdio/api'}
Auth Token: ${forcedTool.authToken ? 'Provided' : 'None'}`;
    } else {
      rawContent = readResourceContent(forcedTool.target);
    }
    
    return `\n\n[STRICT TOOL EXECUTION SYSTEM DIRECTIVE]
YOU ARE NOW STRICTLY ACTING AS THE FOLLOWING ${forcedTool.type.toUpperCase()} TOOL: "${forcedTool.name}".
DO NOT REFER TO OTHER TOOLS OR GENERAL ASSISTANT CAPABILITIES. FOCUS 100% ON EXECUTING THIS TOOL INSTRUCTION.

--- TOOL INSTRUCTION & CODE CONTENT ---
${rawContent}
--- END TOOL INSTRUCTION ---

Executing User Prompt under this tool context only:\n`;
  }

  let contextParts = [];
  const activeSkills = Object.keys(registry.skills || {});
  if (activeSkills.length > 0) {
    contextParts.push("AVAILABLE SKILLS:");
    activeSkills.forEach(name => contextParts.push(`- /skill-${name}`));
  }

  const activeMCP = Object.keys(registry.mcp || {});
  if (activeMCP.length > 0) {
    contextParts.push("AVAILABLE MCP SERVERS:");
    activeMCP.forEach(name => contextParts.push(`- /mcp-${name}`));
  }

  if (contextParts.length === 0) return "";
  return "\n\n[SYSTEM ENVIRONMENT SUMMARY]\n" + contextParts.join("\n") + "\n";
}

// RUANGAN KHUSUS MCP CENTER
function showMCPHub() {
  console.log(`\n${C.c4}============================================================${C.reset}`);
  console.log(`${C.c4}          🔌 MCP (MODEL CONTEXT PROTOCOL) CENTER           ${C.reset}`);
  console.log(`${C.c4}============================================================${C.reset}\n`);

  const keys = Object.keys(registry.mcp || {});

  if (keys.length === 0) {
    console.log(`${C.yellow}  [!] Belum ada MCP Server yang terhubung saat ini.${C.reset}`);
    console.log(`${C.gray}      Gunakan perintah ${C.green}/new-mcp${C.gray} untuk mendaftarkan MCP baru.${C.reset}\n`);
  } else {
    console.log(`${C.bold}Daftar MCP Server Aktif:${C.reset}`);
    keys.forEach((name, i) => {
      const m = registry.mcp[name];
      const typeBadge = m.type === 'remote' || m.type === 'direct-api' ? `${C.cyan}[${m.type}]${C.reset}` : `${C.green}[stdio]${C.reset}`;
      console.log(` ${C.yellow}${i + 1}.${C.reset} ${C.bold}${name}${C.reset} ${typeBadge}`);
      console.log(`    ↳ Target: ${C.gray}${m.target}${C.reset}`);
      if (m.authToken) console.log(`    ↳ Auth  : ${C.green}Encrypted/Token set${C.reset}`);
    });
    console.log('');
  }

  const lines = [
    `${C.bold}Command Instan MCP:${C.reset}`,
    `${C.yellow}/new-mcp${C.reset}           👉 Tambah MCP Server Baru (Interactive Selector)`,
    `${C.yellow}/mcp-<nama>${C.reset} <prompt> 👉 Eksekusi MCP secara spesifik`,
    `${C.yellow}/scan${C.reset}              👉 Pindai folder .mcp otomatis`
  ];

  drawBox("💡 PETUNJUK RUANG MCP", lines, C.c4);
  console.log('');
}

// INTERACTIVE ARROW-KEY SELECTOR UNTUK MCP PROVIDERS
function interactiveProviderSelector(allItems, onSelect, onCancel) {
  let filteredItems = [...allItems];
  let selectedIndex = 0;
  let currentPage = 0;
  const pageSize = 8;

  const wasRaw = process.stdin.isRaw;

  function cleanup() {
    process.stdin.removeListener('keypress', handleKeypress);
    if (process.stdin.setRawMode) process.stdin.setRawMode(wasRaw || false);
  }

  function renderMenu() {
    console.clear();
    const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (currentPage < 0) currentPage = 0;

    const startIdx = currentPage * pageSize;
    const pageItems = filteredItems.slice(startIdx, startIdx + pageSize);

    if (selectedIndex >= pageItems.length) selectedIndex = Math.max(0, pageItems.length - 1);

    console.log(`${C.c4}============================================================${C.reset}`);
    console.log(`${C.c4}       🔌 SETUP & INTEGRASI MCP SERVER PROVIDER           ${C.reset}`);
    console.log(`${C.c4}============================================================${C.reset}\n`);

    if (pageItems.length === 0) {
      console.log(`${C.red}  Tidak ada provider yang cocok dengan pencarian.${C.reset}\n`);
    } else {
      pageItems.forEach((item, idx) => {
        const globalNum = startIdx + idx;
        const isFocused = idx === selectedIndex;
        const pointer = isFocused ? `${C.cyan}❯${C.reset}` : ' ';
        const numStr = globalNum.toString().padStart(2, ' ');
        const badge = item.type ? `${C.gray}[${item.type}]${C.reset}` : '';
        const nameStyled = isFocused ? `${C.bold}${C.green}${item.name}${C.reset}` : item.name;

        console.log(`${pointer} ${C.yellow}${numStr}.${C.reset} • ${nameStyled} ${badge}`);
        console.log(`     ${C.darkGray}${item.desc || item.category}${C.reset}`);
      });
    }

    console.log(`\n${C.darkGray}────────────────────────────────────────────────────────────${C.reset}`);
    console.log(`${C.cyan}Halaman ${currentPage + 1}/${totalPages}${C.reset} | Total: ${filteredItems.length} Provider`);
    console.log(`${C.gray}🎮 Navigasi: [▲/▼] Panah Termux/Keyboard | [Enter] Pilih${C.reset}`);
    console.log(`${C.gray}⌨️  Atau: Ketik Angka | [f] Cari Nama | [n] Next | [p] Prev | [q] Batal${C.reset}`);
    console.log(`${C.darkGray}────────────────────────────────────────────────────────────${C.reset}\n`);
  }

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.setRawMode) process.stdin.setRawMode(true);

  function handleKeypress(str, key) {
    const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
    const startIdx = currentPage * pageSize;
    const pageItems = filteredItems.slice(startIdx, startIdx + pageSize);

    if (key.name === 'up') {
      if (selectedIndex > 0) {
        selectedIndex--;
      } else if (currentPage > 0) {
        currentPage--;
        selectedIndex = pageSize - 1;
      }
      renderMenu();
    } else if (key.name === 'down') {
      if (selectedIndex < pageItems.length - 1) {
        selectedIndex++;
      } else if (currentPage < totalPages - 1) {
        currentPage++;
        selectedIndex = 0;
      }
      renderMenu();
    } else if (key.name === 'return') {
      cleanup();
      const selectedObj = pageItems[selectedIndex];
      if (selectedObj) onSelect(selectedObj);
    } else if (str === 'q' || str === 'Q' || (key.ctrl && key.name === 'c')) {
      cleanup();
      onCancel();
    } else if (str === 'n' || str === 'N') {
      if (currentPage < totalPages - 1) currentPage++;
      selectedIndex = 0;
      renderMenu();
    } else if (str === 'p' || str === 'P') {
      if (currentPage > 0) currentPage--;
      selectedIndex = 0;
      renderMenu();
    } else if (str === 'f' || str === 'F') {
      cleanup();
      rl.question(`\n${C.yellow}[>] Ketik kata kunci pencarian provider:${C.reset} `, (query) => {
        const q = query.trim().toLowerCase();
        filteredItems = allItems.filter(item => item.name.toLowerCase().includes(q) || (item.desc && item.desc.toLowerCase().includes(q)));
        currentPage = 0;
        selectedIndex = 0;
        interactiveProviderSelector(filteredItems, onSelect, onCancel);
      });
    } else if (!isNaN(str) && str !== ' ' && str !== '') {
      cleanup();
      const num = parseInt(str);
      if (num >= 0 && num < allItems.length) {
        onSelect(allItems[num]);
      } else {
        console.log(`${C.red}Nomor tidak valid.${C.reset}`);
        setTimeout(() => interactiveProviderSelector(allItems, onSelect, onCancel), 800);
      }
    }
  }

  process.stdin.on('keypress', handleKeypress);
  renderMenu();
}

// INTERACTIVE ARROW-KEY SELECTOR UNTUK MODEL AI (/models)
function interactiveModelSelector(allModels, onSelect, onCancel) {
  let filteredModels = [...allModels];
  let selectedIndex = 0;
  let currentPage = 0;
  const pageSize = 10;

  const wasRaw = process.stdin.isRaw;

  function cleanup() {
    process.stdin.removeListener('keypress', handleKeypress);
    if (process.stdin.setRawMode) process.stdin.setRawMode(wasRaw || false);
  }

  function renderMenu() {
    console.clear();
    const totalPages = Math.ceil(filteredModels.length / pageSize) || 1;
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (currentPage < 0) currentPage = 0;

    const startIdx = currentPage * pageSize;
    const pageItems = filteredModels.slice(startIdx, startIdx + pageSize);

    if (selectedIndex >= pageItems.length) selectedIndex = Math.max(0, pageItems.length - 1);

    console.log(`${C.c1}============================================================${C.reset}`);
    console.log(`${C.c1}       🤖 PILIH MODEL AI (${config.provider || 'Provider'})             ${C.reset}`);
    console.log(`${C.c1}============================================================${C.reset}`);
    console.log(`${C.gray}Model Aktif Saat Ini: ${C.green}${config.model || 'Belum Diatur'}${C.reset}\n`);

    if (pageItems.length === 0) {
      console.log(`${C.red}  Tidak ada model yang cocok dengan pencarian.${C.reset}\n`);
    } else {
      pageItems.forEach((m, idx) => {
        const globalNum = startIdx + idx;
        const isFocused = idx === selectedIndex;
        const isCurrentActive = m.id === config.model;
        
        const pointer = isFocused ? `${C.cyan}❯${C.reset}` : ' ';
        const activeBadge = isCurrentActive ? `${C.green}(Aktif)${C.reset}` : '';
        const numStr = globalNum.toString().padStart(3, ' ');
        const modelNameStyled = isFocused ? `${C.bold}${C.yellow}${m.id}${C.reset}` : m.id;

        console.log(`${pointer} ${C.gray}${numStr}.${C.reset} • ${modelNameStyled} ${activeBadge}`);
      });
    }

    console.log(`\n${C.darkGray}────────────────────────────────────────────────────────────${C.reset}`);
    console.log(`${C.cyan}Halaman ${currentPage + 1}/${totalPages}${C.reset} | Total: ${filteredModels.length} Model AI`);
    console.log(`${C.gray}🎮 Navigasi: [▲/▼] Panah Termux/Keyboard | [Enter] Pilih${C.reset}`);
    console.log(`${C.gray}⌨️  Atau: [f] Cari Nama Model | [n] Next | [p] Prev | [q] Batal${C.reset}`);
    console.log(`${C.darkGray}────────────────────────────────────────────────────────────${C.reset}\n`);
  }

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.setRawMode) process.stdin.setRawMode(true);

  function handleKeypress(str, key) {
    const totalPages = Math.ceil(filteredModels.length / pageSize) || 1;
    const startIdx = currentPage * pageSize;
    const pageItems = filteredModels.slice(startIdx, startIdx + pageSize);

    if (key.name === 'up') {
      if (selectedIndex > 0) {
        selectedIndex--;
      } else if (currentPage > 0) {
        currentPage--;
        selectedIndex = pageSize - 1;
      }
      renderMenu();
    } else if (key.name === 'down') {
      if (selectedIndex < pageItems.length - 1) {
        selectedIndex++;
      } else if (currentPage < totalPages - 1) {
        currentPage++;
        selectedIndex = 0;
      }
      renderMenu();
    } else if (key.name === 'return') {
      cleanup();
      const selectedModelObj = pageItems[selectedIndex];
      if (selectedModelObj) onSelect(selectedModelObj.id);
    } else if (str === 'q' || str === 'Q' || (key.ctrl && key.name === 'c')) {
      cleanup();
      onCancel();
    } else if (str === 'n' || str === 'N') {
      if (currentPage < totalPages - 1) currentPage++;
      selectedIndex = 0;
      renderMenu();
    } else if (str === 'p' || str === 'P') {
      if (currentPage > 0) currentPage--;
      selectedIndex = 0;
      renderMenu();
    } else if (str === 'f' || str === 'F') {
      cleanup();
      rl.question(`\n${C.yellow}[>] Ketik kata kunci nama model (misal: llama, gemini, claude):${C.reset} `, (query) => {
        const q = query.trim().toLowerCase();
        filteredModels = allModels.filter(m => m.id.toLowerCase().includes(q));
        currentPage = 0;
        selectedIndex = 0;
        interactiveModelSelector(filteredModels, onSelect, onCancel);
      });
    }
  }

  process.stdin.on('keypress', handleKeypress);
  renderMenu();
}

// WIZARD KONFIGURASI MCP BARU (/new-mcp)
function createNewMCPWizard(callback) {
  interactiveProviderSelector(
    MCP_PRESETS,
    (selectedProvider) => {
      console.clear();

      // CASE 1: CUSTOM MCP INPUT MANUAL
      if (selectedProvider.id === 'custom') {
        console.log(`\n${C.cyan}=== 🛠️ SETUP MCP MANUAL (CUSTOM) ===${C.reset}\n`);
        rl.question(`${C.yellow}[1/4] Masukkan Nama MCP Server (misal: my-mcp):${C.reset} `, (nameInput) => {
          const mcpName = nameInput.trim().toLowerCase().replace(/\s+/g, '-');
          if (!mcpName) {
            console.log(`${C.red}[x] Nama MCP tidak boleh kosong.${C.reset}\n`);
            return callback();
          }

          console.log(`\n${C.cyan}Pilih Tipe Koneksi MCP:${C.reset}`);
          console.log(`  ${C.yellow}1.${C.reset} Direct REST API / Endpoint`);
          console.log(`  ${C.yellow}2.${C.reset} Local Stdio Command / Path`);

          rl.question(`\n${C.yellow}[2/4] Pilih Tipe (1/2):${C.reset} `, (typeChoice) => {
            const isApi = typeChoice.trim() === '1';

            rl.question(`${C.yellow}[3/4] Masukkan Target URL / Command Executable:${C.reset} `, (targetInput) => {
              const target = targetInput.trim();
              if (!target) {
                console.log(`${C.red}[x] Target tidak boleh kosong.${C.reset}\n`);
                return callback();
              }

              rl.question(`${C.yellow}[4/4] Masukkan Auth Token / API Key (Opsional - Press Enter to skip):${C.reset} `, (tokenInput) => {
                const authToken = tokenInput.trim();

                registry.mcp = registry.mcp || {};
                registry.mcp[mcpName] = {
                  target: target,
                  type: isApi ? 'direct-api' : 'stdio',
                  authToken: authToken || null,
                  connectedAt: new Date().toISOString(),
                  status: 'Connected'
                };

                saveRegistry(registry);

                console.log(`\n${C.green}[✔] MCP Server "${mcpName}" berhasil ditambahkan!${C.reset}`);
                console.log(`${C.gray}Gunakan perintah instan: ${C.yellow}/mcp-${mcpName} <prompt kamu>${C.reset}\n`);
                callback();
              });
            });
          });
        });
      } 
      // CASE 2: PRESET PROVIDER POPULER
      else {
        console.log(`\n${C.cyan}=== ⚡ SETUP PROVIDER: ${selectedProvider.name} ===${C.reset}`);
        console.log(`${C.gray}${selectedProvider.desc}${C.reset}\n`);

        const mcpName = selectedProvider.id;

        if (selectedProvider.reqAuth) {
          rl.question(`${C.yellow}[>] Masukkan ${selectedProvider.reqAuth}: ${C.reset}`, (authVal) => {
            const token = authVal.trim();
            
            registry.mcp = registry.mcp || {};
            registry.mcp[mcpName] = {
              target: selectedProvider.endpoint || selectedProvider.command,
              type: selectedProvider.type,
              authToken: token || null,
              connectedAt: new Date().toISOString(),
              status: 'Connected'
            };

            saveRegistry(registry);

            console.log(`\n${C.green}[✔] Preset MCP "${selectedProvider.name}" berhasil terhubung!${C.reset}`);
            console.log(`${C.gray}Akses instan via: ${C.yellow}/mcp-${mcpName} <prompt kamu>${C.reset}\n`);
            callback();
          });
        } else {
          registry.mcp = registry.mcp || {};
          registry.mcp[mcpName] = {
            target: selectedProvider.endpoint || selectedProvider.command,
            type: selectedProvider.type,
            authToken: null,
            connectedAt: new Date().toISOString(),
            status: 'Connected'
          };

          saveRegistry(registry);

          console.log(`\n${C.green}[✔] Preset MCP "${selectedProvider.name}" berhasil terhubung!${C.reset}`);
          console.log(`${C.gray}Akses instan via: ${C.yellow}/mcp-${mcpName} <prompt kamu>${C.reset}\n`);
          callback();
        }
      }
    },
    () => {
      console.log(`\n${C.gray}Setup MCP dibatalkan.${C.reset}\n`);
      callback();
    }
  );
}

function listSkills() {
  console.log(`\n${C.cyan}=== Registered Skills ===${C.reset}`);
  const keys = Object.keys(registry.skills || {});
  
  if (keys.length === 0) {
    console.log(`${C.gray}Belum ada skill terhubung. Ketik ${C.yellow}/scan${C.gray} atau ${C.yellow}/connect skill <path>${C.reset}\n`);
    return;
  }

  keys.forEach((name, i) => {
    const item = registry.skills[name];
    console.log(` ${C.yellow}${i + 1}.${C.reset} ${C.green}${name}${C.reset} -> ${C.gray}${item.path}${C.reset}`);
  });
  console.log('');

  const lines = [
    `${C.bold}Perintah Instan Skill:${C.reset}`
  ];

  keys.forEach(name => {
    lines.push(` ${C.yellow}/skill-${name}${C.reset} <prompt kamu>`);
  });

  drawBox("⚡ COMMAND INSTAN SKILL TERSEDIA", lines, C.c1);
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
    console.log(`${C.green}[+] Skill "${skillName}" terhubung! Akses instan: /skill-${skillName}${C.reset}\n`);
  } else if (type === 'mcp') {
    const mcpName = path.basename(resolvedPath, path.extname(resolvedPath));
    registry.mcp = registry.mcp || {};
    registry.mcp[mcpName] = {
      target: targetPath,
      type: targetPath.startsWith('http') ? 'direct-api' : 'stdio',
      connectedAt: new Date().toISOString(),
      status: 'Connected'
    };
    saveRegistry(registry);
    console.log(`${C.green}[+] MCP "${mcpName}" terhubung! Akses instan: /mcp-${mcpName}${C.reset}\n`);
  } else {
    console.log(`${C.red}[x] Tipe tidak dikenal. Gunakan "skill" atau "mcp".${C.reset}\n`);
  }
}

function scanResources() {
  console.log(`\n${C.yellow}[...] Memindai lokasi internal, home user, Gemini CLI & Claude Desktop...${C.reset}`);
  registry = loadRegistry();
  registry.skills = registry.skills || {};
  registry.mcp = registry.mcp || {};

  const home = os.homedir();
  const searchTargets = [
    { type: 'skill', dir: SKILLS_DIR },
    { type: 'mcp', dir: MCP_DIR },
    { type: 'skill', dir: path.join(home, 'skills') },
    { type: 'mcp', dir: path.join(home, 'mcp') },
    { type: 'mcp', dir: path.join(home, '.mcp') },
    { type: 'skill', dir: path.join(home, '.gemini', 'skills') },
    { type: 'mcp', dir: path.join(home, '.gemini', 'mcp') },
    { type: 'skill', dir: path.join(home, '.config', 'gemini', 'skills') },
    { type: 'mcp', dir: path.join(home, '.config', 'gemini', 'mcp') },
    { type: 'mcp', dir: path.join(home, '.claude', 'mcp') },
    { type: 'mcp', dir: path.join(home, '.config', 'claude', 'mcp') }
  ];

  let newDetected = [];

  searchTargets.forEach(({ type, dir }) => {
    if (fs.existsSync(dir)) {
      try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const name = path.basename(item, path.extname(item));

          if (type === 'skill' && !registry.skills[name]) {
            registry.skills[name] = { path: fullPath, connectedAt: new Date().toISOString(), status: 'Active' };
            newDetected.push(`/skill-${name}`);
          } else if (type === 'mcp' && !registry.mcp[name]) {
            registry.mcp[name] = { target: fullPath, type: 'stdio', connectedAt: new Date().toISOString(), status: 'Connected' };
            newDetected.push(`/mcp-${name}`);
          }
        });
      } catch (e) {}
    }
  });

  saveRegistry(registry);
  console.log(`${C.green}[+] Pemindaian selesai.${C.reset}\n`);

  if (newDetected.length > 0) {
    drawBox("🎉 COMMAND INSTAN BARU TERDETEKSI!", [
      `${C.green}Kamu sekarang bisa langsung menggunakan perintah ini:${C.reset}`,
      ...newDetected.slice(0, 5).map(cmd => ` • ${C.yellow}${cmd}${C.reset} <prompt>`),
      newDetected.length > 5 ? ` ...dan ${newDetected.length - 5} command lainnya.` : '',
      ``,
      `${C.cyan}Ketik /skill atau /mcp untuk melihat semua command.${C.reset}`
    ], C.green);
  } else {
    drawBox("ℹ️ HASIL PEMINDAIAN", [
      `Tidak ada Skill atau MCP baru yang terdeteksi.`,
      `Ketik ${C.yellow}/skill${C.reset} atau ${C.yellow}/mcp${C.reset} untuk melihat command instan yang aktif.`
    ], C.gray);
  }
  console.log('');
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
      interactiveModelSelector(
        data.data,
        (selectedModelId) => {
          config.model = selectedModelId;
          saveConfig(config);
          console.clear();
          console.log(`${C.green}[✔] Model berhasil diubah ke: ${config.model}${C.reset}\n`);
          startPrompt();
        },
        () => {
          console.clear();
          console.log(`${C.gray}Pemilihan model dibatalkan.${C.reset}\n`);
          startPrompt();
        }
      );
    } else {
      console.log(`${C.red}[x] Could not retrieve models list automatically from ${config.provider}.${C.reset}`);
      startPrompt();
    }
  } catch (err) {
    console.log(`${C.red}[x] Error fetching models: ${err.message}${C.reset}\n`);
    startPrompt();
  }
}

async function handleChat(prompt, forcedTool = null) {
  if (!config.apiKey) {
    console.log(`${C.yellow}[!] API Key is not set.${C.reset}`);
    return askConfig(() => startPrompt());
  }

  if (forcedTool) {
    console.log(`${C.cyan}[🚀 Executing via ${forcedTool.type.toUpperCase()}: ${forcedTool.name}]${C.reset}`);
  }

  console.log(`${C.yellow}TMPA CLI processing...${C.reset}`);

  try {
    let url = config.endpoint;
    let headers = { 'Content-Type': 'application/json' };
    let bodyData = {};

    const toolsContext = getActiveToolsContext(forcedTool);
    const fullPrompt = (prompt || "Jalankan instruksi tool ini.") + toolsContext;

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

    // DUKUNGAN UNTUK REASONING MODELS & STANDAR OPENAI/GEMINI
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const msg = data.choices[0].message;
      aiResponse = msg.content || msg.reasoning || msg.reasoning_content || "";
    } else if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      aiResponse = data.candidates[0].content.parts[0].text;
    }

    if (aiResponse) {
      console.log(`\n${C.c1}TMPA CLI (${config.model || 'AI'}) :${C.reset}\n${aiResponse}\n`);
    } else if (data.error) {
      console.log(`\n${C.red}[x] API Error: ${data.error.message || JSON.stringify(data.error)}${C.reset}\n`);
    } else {
      console.log(`\n${C.red}[x] Response Unrecognized: ${JSON.stringify(data)}${C.reset}\n`);
    }

  } catch (error) {
    console.log(`\n${C.red}[x] Fetch Error: ${error.message}${C.reset}\n`);
  }

  startPrompt();
}

function handleUninstall() {
  rl.question(`${C.red}[!] Apakah kamu yakin ingin menghapus TMPA CLI? (y/N):${C.reset} `, (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log(`\n${C.yellow}[...] Membersihkan konfigurasi dan menghapus TMPA CLI...${C.reset}`);
      try {
        if (fs.existsSync(CONFIG_FILE)) {
          fs.unlinkSync(CONFIG_FILE);
        }
        console.log(`${C.green}[+] Konfigurasi lokal berhasil dibersihkan.${C.reset}`);
        execSync('npm uninstall -g tmpa-cli', { stdio: 'inherit' });
        console.log(`\n${C.green}[+] TMPA CLI berhasil di-uninstall sepenuhnya. Sampai jumpa!${C.reset}\n`);
        process.exit(0);
      } catch (err) {
        console.log(`\n${C.red}[x] Gagal uninstall otomatis. Silakan jalankan: npm uninstall -g tmpa-cli secara manual.${C.reset}\n`);
        process.exit(0);
      }
    } else {
      console.log(`${C.gray}Proses uninstall dibatalkan.${C.reset}\n`);
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
      showMCPHub();
      startPrompt();
    } else if (cmd === '/new-mcp') {
      createNewMCPWizard(() => startPrompt());
    } else if (cmd.startsWith('/connect')) {
      connectResource(cmd.replace('/connect', ''));
      startPrompt();
    } else if (cmd === '/scan') {
      scanResources();
      startPrompt();
    } else if (cmd === '/uninstall') {
      handleUninstall();
    } else if (cmd.startsWith('/skill-')) {
      const fullCmd = cmd.slice(7).trim();
      const spaceIdx = fullCmd.indexOf(' ');
      let skillName = fullCmd;
      let userPrompt = '';

      if (spaceIdx !== -1) {
        skillName = fullCmd.slice(0, spaceIdx);
        userPrompt = fullCmd.slice(spaceIdx + 1).trim();
      }

      if (registry.skills && registry.skills[skillName]) {
        handleChat(userPrompt, { type: 'skill', name: skillName, target: registry.skills[skillName].path });
      } else {
        console.log(`${C.red}[x] Skill "${skillName}" tidak ditemukan di registry. Ketik /skill untuk melihat daftar.${C.reset}\n`);
        startPrompt();
      }
    } else if (cmd.startsWith('/mcp-')) {
      const fullCmd = cmd.slice(5).trim();
      const spaceIdx = fullCmd.indexOf(' ');
      let mcpName = fullCmd;
      let userPrompt = '';

      if (spaceIdx !== -1) {
        mcpName = fullCmd.slice(0, spaceIdx);
        userPrompt = fullCmd.slice(spaceIdx + 1).trim();
      }

      if (registry.mcp && registry.mcp[mcpName]) {
        handleChat(userPrompt, {
          type: 'mcp',
          name: mcpName,
          target: registry.mcp[mcpName].target,
          mcpType: registry.mcp[mcpName].type,
          authToken: registry.mcp[mcpName].authToken
        });
      } else {
        console.log(`${C.red}[x] MCP "${mcpName}" tidak ditemukan di registry. Ketik /mcp untuk melihat daftar.${C.reset}\n`);
        startPrompt();
      }
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
