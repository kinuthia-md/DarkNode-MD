// ============================================
//  Autoread Module
//  Automatically marks messages as read
//  when enabled
// ============================================

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'autoread.json');

const botVcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:' + settings.botName + '\nORG:DarkNode MD;\nTEL;type=CELL;waid=' + settings.ownerNumber + ':+' + settings.ownerNumber + '\nURL:' + settings.channelLink + '\nEND:VCARD';

function initConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        const defaultConfig = { enabled: false };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    }
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

async function sendWithContact(sock, chatId, text, quotedMsg) {
    const msg = await sock.sendMessage(chatId, {
        text: text,
        contextInfo: {
            mentionedJid: [quotedMsg?.key?.participant || quotedMsg?.key?.remoteJid].filter(Boolean),
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: settings.newsletterJid,
                newsletterName: settings.newsletterName,
                serverMessageId: -1
            }
        }
    }, { quoted: quotedMsg });

    // Send contact card as a separate message for better visibility
    await sock.sendMessage(chatId, {
        contacts: {
            displayName: settings.botName,
            contacts: [{ vcard: botVcard }]
        }
    }, { quoted: msg });

    return msg;
}

async function autoreadCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe;

        if (!isOwner) {
            await sendWithContact(sock, chatId, '╭─── ⪨ ❌ AUTOREAD ⪩───⟢\n│ 👤 Only the bot owner can use this.\n╰────────────⟢\n> © DarkNode MD', message);
            return;
        }

        const args = message.message?.conversation ||
            message.message?.extendedTextMessage?.text || '';
        const parts = args.trim().split(/\s+/);
        const sub = parts[1] ? parts[1].toLowerCase() : null;

        const config = initConfig();

        if (sub === 'on' || sub === 'enable') {
            config.enabled = true;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            await sendWithContact(sock, chatId, '╭─── ⪨ ✅ AUTOREAD ⪩───⟢\n│ 📖 Auto-read is now *ON*\n╰────────────⟢\n> © DarkNode MD', message);
        } else if (sub === 'off' || sub === 'disable') {
            config.enabled = false;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            await sendWithContact(sock, chatId, '╭─── ⪨ ✅ AUTOREAD ⪩───⟢\n│ 📖 Auto-read is now *OFF*\n╰────────────⟢\n> © DarkNode MD', message);
        } else {
            const status = config.enabled ? 'ON' : 'OFF';
            await sendWithContact(sock, chatId, `╭─── ⪨ ℹ️ AUTOREAD ⪩───⟢\n│ 📖 Status: *${status}*\n│ 📌 Usage: .autoread on/off\n╰────────────⟢\n> © DarkNode MD`, message);
        }
    } catch (e) {
        console.error('❌ Autoread error:', e);
        try {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ ❌ Failed to process command.\n╰────────────⟢\n> © DarkNode MD'
            }, { quoted: message });
        } catch {}
    }
}

function isAutoreadEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (e) {
        console.error('❌ Error checking autoread status:', e);
        return false;
    }
}

async function handleAutoread(sock, message) {
    if (!isAutoreadEnabled()) return false;
    try {
        const key = {
            remoteJid: message.key.remoteJid,
            id: message.key.id,
            participant: message.key.participant
        };
        await sock.readMessages([key]);
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    autoreadCommand,
    isAutoreadEnabled,
    handleAutoread
};