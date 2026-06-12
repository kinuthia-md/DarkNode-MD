/**
 * Telegram pairing + commands gate for DarkNode MD
 */

const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

// -------------------- CONFIG --------------------
const TELEGRAM_BOT_TOKEN = '8657795846:AAHFzRAQRANH9dAzzJdJ1VFNEiFGK70CRrQ';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'telegram_users.json');

// -------------------- HELPERS --------------------
function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({ approved: {} }, null, 2));
}

function loadUsers() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return { approved: {} };
  }
}

function isApproved(users, tgUserId) {
  return Boolean(users.approved[String(tgUserId)]);
}

function approveUser(users, tgUserId) {
  users.approved[String(tgUserId)] = { approvedAt: Date.now() };
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getMenuText() {
  return (
    `(╭━━━〔 ⚡ 𝐃𝐀𝐑𝐊𝐍𝐎𝐃𝐄 𝐌𝐃 ⚡ 〕━━━⬣\n` +
    `┃\n` +
    `┣━━━〔 👑 OWNER 〕━━━⬣\n` +
    `┃ ➜ /owner\n` +
    `┃ View owner details and support.\n` +
    `┣━━━〔 🔗 PAIR ACCOUNT 〕━━━⬣\n` +
    `┃ ➜ /pair <whatsapp_number>\n` +
    `┃ Connect your WhatsApp account\n` +
    `┃ using a secure pairing code.\n` +
    `┃\n` +
    `┃ Example:\n` +
    `┃ /pair 254712345678\n` +
    `┣━━━〔 📡 BOT STATUS 〕━━━⬣\n` +
    `┃ ➜ /status\n` +
    `┃ Check uptime, sessions,\n` +
    `┃ performance and connectivity.\n` +
    `┣━━━〔 🧭 MAIN MENU 〕━━━⬣\n` +
    `┃ ➜ /menu\n` +
    `┃ Display available commands\n` +
    `┃ and bot information.\n` +
    `┣━━━〔 🚀 QUICK START 〕━━━⬣\n` +
    `┃ 1. Send /pair number\n` +
    `┃ 2. Get pairing< code\n` +
    `┃ 3. Open WhatsApp\n` +
    `┃ 4. Linked Devices\n` +
    `┃ 5. Enter code\n` +
    `┃ 6. Connected ✅\n` +
    `┣━━━〔 🔰 FEATURES 〕━━━⬣\n` +
    `┃ ◈ WhatsApp MD Pairing\n` +
    `┃ ◈ Secure Authentication\n` +
    `┃ ◈ Session Management\n` +
    `┃ ◈ Telegram Control\n` +
    `┃ ◈ Fast Deployment\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━━⬣\n` +
    `      🌙 DarkNode MD\n` +
    `   Telegram ↔ WhatsApp Bridge\n` +
    `` +
    `)`
  );
}

async function ensureApproved(msg) {
  const tgUserId = msg.from.id;
  const users = loadUsers();
  if (!isApproved(users, tgUserId)) approveUser(users, tgUserId);
}

function extractNumber(raw) {
  return String(raw || '').replace(/[^0-9]/g, '');
}

// -------------------- BOT --------------------
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/^\/menu$/i, async (msg) => {
  await ensureApproved(msg);
  const logoPath = path.join(__dirname, 'assets', 'logo.jpg');

  try {
    return await bot.sendPhoto(
      msg.chat.id,
      logoPath,
      {
        caption: getMenuText(),
        parse_mode: 'HTML',
      }
    );
  } catch (e) {
    return bot.sendMessage(msg.chat.id, getMenuText());
  }
});

bot.onText(/^\/start$/i, async (msg) => {
  await ensureApproved(msg);
  return bot.sendMessage(msg.chat.id, 'Use /menu to view all available commands.');
});

bot.onText(/^\/help$/i, async (msg) => {
  await ensureApproved(msg);
  return bot.sendMessage(msg.chat.id, getMenuText());
});

bot.onText(/^\/status$/i, async (msg) => {
  await ensureApproved(msg);
  return bot.sendMessage(msg.chat.id, '✅ Telegram bot is running.');
});

bot.onText(/^\/owner$/i, async (msg) => {
  await ensureApproved(msg);
  return bot.sendMessage(msg.chat.id, '👑 DarkNode MD');
});

bot.onText(/^\/pair\s+(.+)/i, async (msg, match) => {
  await ensureApproved(msg);

  const chatId = msg.chat.id;
  const number = extractNumber(match[1]);

  if (!number || number.length < 10) {
    return bot.sendMessage(chatId, '❌ Invalid number. Usage: /pair <whatsapp_number>');
  }

  // Use the SAME sub-bot auth folder layout as WhatsApp .pair: subbots/<number>
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
  } = require('@whiskeysockets/baileys');

  const pino = require('pino');
  const { Boom } = require('@hapi/boom');

  const { SUBBOTS_DIR, createSubBotFolder, deleteSubBotFolder, launchSubBot, activeSubBots, subBotExists, hasValidCreds } = require('./lib/subbotManager');
  // Note: subBotExists/hasValidCreds/activeSubBots are used to prevent duplicate work.

  (async () => {
    try {
      if (activeSubBots.has(number)) {
        return bot.sendMessage(chatId, `✅ Bot for ${number} is already active.`);
      }

      if (subBotExists(number) && hasValidCreds(number)) {
        await bot.sendMessage(chatId, `✅ Existing session found for ${number}. Launching your bot...`);
        launchSubBot(number);
        return;
      }

      const availableSlots = require('./lib/subbotManager').getAvailableSlots();
      if (availableSlots <= 0) {
        return bot.sendMessage(chatId, '❌ Server full. Cannot create new session.');
      }

      if (subBotExists(number)) deleteSubBotFolder(number);

      const sessionPath = createSubBotFolder(number); // this creates subbots/<number>
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      const { version } = await fetchLatestBaileysVersion();

      const userSock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: 'fatal' }).child({ level: 'fatal' })
          ),
        },
        markOnlineOnConnect: false,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
      });

      let paired = false;
      let timeoutId = null;

      userSock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open' && !paired) {
          paired = true;
          if (timeoutId) clearTimeout(timeoutId);

          await saveCreds();

          setTimeout(() => {
            try { userSock.end(); } catch (_) {}
          }, 2000);

          setTimeout(() => {
            launchSubBot(number);
          }, 3000);

          return bot.sendMessage(chatId, `✅ Connected! Sub-bot is starting for ${number}...`);
        }

        if (connection === 'close' && !paired) {
          const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
          if (statusCode === DisconnectReason.loggedOut) {
            if (timeoutId) clearTimeout(timeoutId);
            deleteSubBotFolder(number);
          }
        }
      });

      if (!userSock.authState.creds.registered) {
        // Send pairing code
        const code = await userSock.requestPairingCode(number);
        const codeFormatted = code?.match(/.{1,4}/g)?.join('-') || code;

        timeoutId = setTimeout(() => {
          if (!paired) {
            deleteSubBotFolder(number);
            try { userSock.end(); } catch (_) {}
            bot.sendMessage(chatId, `⏰ Pairing timeout for ${number}. Please try again.`);
          }
        }, 300000);

        return bot.sendMessage(
          chatId,
          `┌❏ *PAIRING CODE* ❏\n` +
            `├❏\n` +
            `├❏ 📱 Number: ${number}\n` +
            `├❏ 🔑 Code: ${codeFormatted}\n` +
            `├❏\n` +
            `├❏ Steps to link:\n` +
            `├❏ 1. Open WhatsApp → Settings\n` +
            `├❏ 2. Linked Devices → Link a Device\n` +
            `├❏ 3. Choose "Link with phone number"\n` +
            `├❏ 4. Enter this code: ${codeFormatted}\n` +
            `├❏\n` +
            `└❏ ❏`
        );
      }

      // If registered already, wait for open to launch (or launch immediately)
      if (userSock.authState.creds.registered) {
        launchSubBot(number);
        return bot.sendMessage(chatId, `✅ Session already registered. Launching ${number}...`);
      }
    } catch (e) {
      return bot.sendMessage(chatId, `❌ Failed: ${e.message}`);
    }
  })();
});

bot.on('polling_error', (err) => console.error('Telegram polling error:', err));

console.log('Telegram bot started.');

