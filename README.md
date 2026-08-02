# 🚀 TMPA CLI (The Multi Platform AI)

[![npm version](https://img.shields.io/npm/v/tmpa-cli.svg?color=blue)](https://www.npmjs.com/package/tmpa-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**TMPA CLI** adalah aplikasi *Command Line Interface* (CLI) interaktif berbasis Node.js yang memungkinkan kamu mengobrol dengan berbagai model AI (seperti Google Gemini API maupun Custom REST API) langsung dari terminal tanpa perlu membuka browser.

---

## ✨ Fitur Utama

- 🎨 **UI Terminal Modern**: Dilengkapi dengan banner ASCII Art bergradasi warna futuristik dan animasi *loading* titik-titik secara *real-time*.
- 🌐 **Multi-Endpoint API**: Mendukung **Google Gemini API** (*default*) maupun **Custom REST API Endpoint** milikmu sendiri.
- ⚙️ **Konfigurasi Fleksibel**: Pengaturan API Key dan Endpoint tersimpan dengan aman di direktori lokal (`~/.tmpa_config.json`).
- ⚡ **Perintah Instan**: Dukungan perintah internal seperti `/config`, `/clear`, dan `/exit`.
- 🪶 **Ringan & Cepat**: Tanpa *dependency* berat, berjalan sangat lancar di Termux (Android), Linux, macOS, maupun Windows Terminal.

---

## 📦 Instalasi

### 1. Instalasi Resmi via npm (Direkomendasikan)

Pastikan kamu sudah memiliki **Node.js** (versi 18+) terpasang di terminal kamu. Jalankan perintah global berikut:

```bash
npm install -g tmpa-cli

