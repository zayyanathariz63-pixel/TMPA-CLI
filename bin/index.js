#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CONFIG_FILE = path.join(os.homedir(), '.tmpa_config.json');

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
  console.log(`\x1b[36m
 ████████╗███╗   ███╗██████╗  █████╗ 
 ╚══██╔══╝████╗ ████║██╔══██╗██╔══██╗
    ██║   ██╔████╔██║██████╔╝███████║
    ██║   ██║╚██╔╝██║██╔═══╝ ██╔══██║
    ██║   ██║ ╚═╝ ██║██║     ██║  ██║
    ╚═╝   ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝
 \x1b[0m───────────────────────────────────────────────────
  \x1b[32mThe Multi Platform AI [Interactive Mode]\x1b[0m
  /config : Ubah API | /connect : Hubungkan Web 
  /uninstall : Hapus CLI | /exit : Keluar
 ───────────────────────────────────────────────────\n`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let config = loadConfig();

function askConfig(callback) {
  rl.question('🔑 Masukkan API Key TMPA/Gemini: ', (apiKey) => {
    rl.question('🌐 Masukkan Endpoint API (Tekan Enter untuk Default Gemini): ', (endpoint) => {
      config.apiKey = apiKey.trim();
      config.endpoint = endpoint.trim() || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
      saveConfig(config);
      console.log('✅ Konfigurasi berhasil disimpan!\n');
      if (callback) callback();
    });
  });
}

async function handleChat(prompt) {
  if (!config.apiKey) {
    console.log('⚠️ API Key belum diset!');
    return askConfig(() => startPrompt());
  }

  if (!config.endpoint) {
    config.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  console.log('\x1b[33mTMPA CLI memproses...\x1b[0m');

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
    let reply = 'Tidak ada respon dari server.';

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      reply = data.candidates[0].content.parts[0].text;
    } else if (data.reply) {
      reply = data.reply;
    } else if (data.message) {
      reply = data.message;
    }

    console.log(`\n\x1b[34mTMPA CLI :\x1b[0m ${reply}\n`);
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}\n`);
  }

  startPrompt();
}

function handleUninstall() {
  rl.question('⚠️ Apakah Anda yakin ingin menghapus TMPA CLI? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'ya') {
      console.log('\n⏳ Menghapus TMPA CLI dan konfigurasi...');
      try {
        if (fs.existsSync(CONFIG_FILE)) {
          fs.unlinkSync(CONFIG_FILE);
        }
        console.log('✅ Konfigurasi lokal dibersihkan.');
        execSync('npm uninstall -g tmpa-cli', { stdio: 'inherit' });
        console.log('\n👋 TMPA CLI berhasil di-uninstall. Sampai jumpa!\n');
        process.exit(0);
      } catch (err) {
        console.log('\n❌ Gagal uninstall otomatis. Jalankan: npm uninstall -g tmpa-cli secara manual.\n');
        process.exit(0);
      }
    } else {
      console.log('Batal menghapus.\n');
      startPrompt();
    }
  });
}

function startPrompt() {
  rl.question('\x1b[36mTMPA >\x1b[0m ', (input) => {
    const cmd = input.trim();

    if (cmd === '/exit') {
      console.log('Sampai jumpa! 👋');
      process.exit(0);
    } else if (cmd === '/clear') {
      showBanner();
      startPrompt();
    } else if (cmd === '/config') {
      askConfig(() => startPrompt());
    } else if (cmd === '/connect') {
      console.log('\n🔗 [COMING SOON] Fitur login & integrasi website TMPA akan segera hadir pada update berikutnya!\n');
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

// Jalankan Program
showBanner();
if (!config.apiKey) {
  askConfig(() => startPrompt());
} else {
  startPrompt();
}
