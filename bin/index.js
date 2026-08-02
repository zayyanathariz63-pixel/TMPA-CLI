#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.tmpa_config.json');
const DEFAULT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const color = {
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  rgb: (r, g, b, t) => `\x1b[38;2;${r};${g};${b}m${t}\x1b[0m`
};

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (err) {
    return null;
  }
  return null;
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error(color.red('Gagal menyimpan konfigurasi!'));
  }
}

async function callTmpaApi(prompt, config) {
  const apiKey = config.apiKey;
  // Gunakan fallback defaultEndpoint jika config lama belum punya apiEndpoint
  const apiEndpoint = config.apiEndpoint || DEFAULT_ENDPOINT;

  if (apiEndpoint.includes('googleapis.com')) {
    const url = apiEndpoint.includes('key=') ? apiEndpoint : `${apiEndpoint}?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Respons kosong dari API.');
    return text.trim();
  } else {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey
      },
      body: JSON.stringify({ prompt: prompt, messages: [{ role: 'user', content: prompt }] })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `HTTP Error ${response.status}`);
    }

    const data = await response.json();
    const text = data.reply || data.response || data.choices?.[0]?.message?.content || data.text || (typeof data === 'string' ? data : JSON.stringify(data));
    return String(text).trim();
  }
}

function showBanner() {
  console.clear();
  const logoLines = [
    " ████████╗███╗   ███╗██████╗  █████╗ ",
    " ╚══██╔══╝████╗ ████║██╔══██╗██╔══██╗",
    "    ██║   ██╔████╔██║██████╔╝███████║",
    "    ██║   ██║╚██╔╝██║██╔═══╝ ██╔══██║",
    "    ██║   ██║ ╚═╝ ██║██║     ██║  ██║",
    "    ╚═╝   ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝"
  ];
  const colors = [[0, 210, 255], [35, 180, 252], [70, 150, 249], [105, 120, 246], [140, 90, 243], [180, 60, 240]];

  console.log("");
  logoLines.forEach((line, i) => {
    const [r, g, b] = colors[i];
    console.log(color.rgb(r, g, b, color.bold(line)));
  });

  console.log(color.gray(` ───────────────────────────────────────────────────`));
  console.log(`  ${color.bold('The Multi Platform AI')} ${color.green('[Interactive Mode]')}`);
  console.log(color.gray(`  /config : Ubah API | /clear : Hapus Layar | /exit : Keluar`));
  console.log(color.gray(` ───────────────────────────────────────────────────\n`));
}

function promptConfig(callback) {
  console.clear();
  console.log(color.rgb(0, 210, 255, color.bold('\n=== KONFIGURASI TMPA CLI ===\n')));
  console.log('Masukkan pengaturan API milik kamu untuk melanjutkan.\n');
  
  const rlConfig = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rlConfig.question(color.yellow('1. Masukkan API Key: '), (key) => {
    const cleanKey = key.trim();
    if (!cleanKey) {
      console.log(color.red('API Key tidak boleh kosong!\n'));
      rlConfig.close();
      return promptConfig(callback);
    }

    rlConfig.question(color.yellow(`2. Masukkan URL Endpoint API\n   (Tekan Enter untuk default Gemini API): `), (endpoint) => {
      const cleanEndpoint = endpoint.trim() || DEFAULT_ENDPOINT;

      saveConfig({
        apiKey: cleanKey,
        apiEndpoint: cleanEndpoint
      });

      console.log(color.green('\nKonfigurasi disimpan!'));
      rlConfig.close();
      setTimeout(callback, 1000);
    });
  });
}

async function startInteractiveSession() {
  const config = getConfig();

  if (!config || !config.apiKey) {
    promptConfig(startInteractiveSession);
    return;
  }

  showBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: color.rgb(0, 210, 255, color.bold('TMPA > '))
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (input === '/exit' || input === 'exit') {
      console.log(color.gray('\nSampai jumpa di TMPA CLI!\n'));
      process.exit(0);
    }

    if (input === '/clear' || input === 'clear') {
      showBanner();
      rl.prompt();
      return;
    }

    if (input === '/config') {
      rl.close();
      promptConfig(startInteractiveSession);
      return;
    }

    if (input === '') {
      rl.prompt();
      return;
    }

    const loadingFrames = [
      'TMPA CLI memproses.',
      'TMPA CLI memproses..',
      'TMPA CLI memproses...',
      'TMPA CLI memproses..'
    ];

    let frameIndex = 0;
    const loadingInterval = setInterval(() => {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(color.gray(loadingFrames[frameIndex]));
      frameIndex = (frameIndex + 1) % loadingFrames.length;
    }, 250);

    let answer = "";
    try {
      answer = await callTmpaApi(input, config);
    } catch (error) {
      answer = color.red(`Error: ${error.message}`);
    } finally {
      clearInterval(loadingInterval);
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
    }

    console.log(`${color.bold('TMPA CLI :')} ${answer}\n`);
    rl.prompt();
  });
}

startInteractiveSession();
