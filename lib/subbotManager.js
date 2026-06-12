const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const SUBBOTS_DIR = path.join(process.cwd(), 'subbots');
if (!fs.existsSync(SUBBOTS_DIR)) {
  fs.mkdirSync(SUBBOTS_DIR, { recursive: true });
}

const activeSubBots = new Set();
const subBotProcesses = new Map();

function getAvailableSlots() {
  const MAX_SUBBOTS = 10;
  return Math.max(0, MAX_SUBBOTS - activeSubBots.size);
}

function subBotExists(botNumber) {
  const folder = path.join(SUBBOTS_DIR, String(botNumber));
  return fs.existsSync(folder);
}

function hasValidCreds(botNumber) {
  const folder = path.join(SUBBOTS_DIR, String(botNumber));
  const credsPath = path.join(folder, 'creds.json');
  try {
    return fs.existsSync(credsPath) && fs.statSync(credsPath).size > 100;
  } catch {
    return false;
  }
}

function createSubBotFolder(botNumber) {
  const folder = path.join(SUBBOTS_DIR, String(botNumber));
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  return folder;
}

function deleteSubBotFolder(botNumber) {
  const folder = path.join(SUBBOTS_DIR, String(botNumber));
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
  }
  if (activeSubBots.has(String(botNumber))) {
    activeSubBots.delete(String(botNumber));
  }
  if (subBotProcesses.has(String(botNumber))) {
    const proc = subBotProcesses.get(String(botNumber));
    try {
      proc.kill();
    } catch (error) {}
    subBotProcesses.delete(String(botNumber));
  }
}

function launchSubBot(botNumber) {
  const folder = path.join(SUBBOTS_DIR, String(botNumber));
  if (!fs.existsSync(folder)) {
    throw new Error(`Sub-bot folder not found: ${folder}`);
  }

  if (activeSubBots.has(String(botNumber))) {
    return;
  }

  const entry = path.join(process.cwd(), 'index.js');
  const child = spawn(process.execPath, [entry], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      IS_SUB_BOT: 'true',
      SUB_BOT_NUMBER: String(botNumber),
      SUB_BOT_FOLDER: folder,
    },
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
  activeSubBots.add(String(botNumber));
  subBotProcesses.set(String(botNumber), child);

  child.on('exit', () => {
    activeSubBots.delete(String(botNumber));
    subBotProcesses.delete(String(botNumber));
  });
}

function stopSubBot(botNumber) {
  const key = String(botNumber);
  if (!subBotProcesses.has(key)) {
    activeSubBots.delete(key);
    return;
  }

  const proc = subBotProcesses.get(key);
  try {
    proc.kill();
  } catch (error) {}
  subBotProcesses.delete(key);
  activeSubBots.delete(key);
}

module.exports = {
  SUBBOTS_DIR,
  getAvailableSlots,
  subBotExists,
  hasValidCreds,
  createSubBotFolder,
  deleteSubBotFolder,
  launchSubBot,
  stopSubBot,
  activeSubBots,
};
