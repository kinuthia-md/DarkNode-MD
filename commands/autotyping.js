// ============================================
//  Autotyping Module
//  Shows fake typing indicator when enabled
//  No mention requirement - works on any message
// ============================================

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'autotyping.json');

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

    await sock.sendMessage(chatId, {
        contacts: {
            displayName: settings.botName,
            contacts: [{ vcard: botVcard }]
        }
    }, { quoted: msg });

    return msg;
}

async function autotypingCommand(sock, chatId, message) {
    try {
        const isOwner = message.key.fromMe;

        if (!isOwner) {
            await sendWithContact(sock, chatId, '╭─── 『 ❌ AUTOTYPING 』───⟢\n│ 👤 Only the bot owner can use this.\n╰────────────⟢\n> © DarkNode MD', message);
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
            await sendWithContact(sock, chatId, '╭─── 『 ✅ AUTOTYPING 』───⟢\n│ ⌨️ Auto-typing is now *ON*\n╰────────────⟢\n> © DarkNode MD', message);
        } else if (sub === 'off' || sub === 'disable') {
            config.enabled = false;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            await sendWithContact(sock, chatId, '╭─── 『 ✅ AUTOTYPING 』───⟢\n│ ⌨️ Auto-typing is now *OFF*\n╰────────────⟢\n> © DarkNode MD', message);
        } else {
            const status = config.enabled ? 'ON' : 'OFF';
            await sendWithContact(sock, chatId, `╭─── 『 ℹ️ AUTOTYPING 』───⟢\n│ ⌨️ Status: *${status}*\n│ 📌 Usage: .autotyping on/off\n╰────────────⟢\n> © DarkNode MD`, message);
        }
    } catch (e) {
        console.error('❌ Autotyping error:', e);
        try { await sock.sendMessage(chatId, { text: '╭─── 『 ❌ ERROR 』───⟢\n│ ❌ Failed to process command.\n╰────────────⟢\n> © DarkNode MD' }, { quoted: message }); } catch {}
    }
}

function isAutotypingEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (e) {
        console.error('❌ Error checking autotyping status:', e);
        return false;
    }
}

async function handleAutotypingForMessage(sock, chatId, messageText) {
    if (!isAutotypingEnabled()) return false;
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        const typingDuration = Math.min(30000, Math.max(10000, messageText.length * 40));
        await new Promise(resolve => setTimeout(resolve, typingDuration));
        await sock.sendPresenceUpdate('paused', chatId);
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    } catch (e) {
        console.error('❌ Autotyping message error:', e);
        return false;
    }
}

async function handleAutotypingForCommand(sock, chatId) {
    if (!isAutotypingEnabled()) return false;
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, 1500));
        await sock.sendPresenceUpdate('paused', chatId);
        return true;
    } catch (e) {
        console.error('❌ Autotyping command error:', e);
        return false;
    }
}

async function showTypingAfterCommand(sock, chatId) {
    if (!isAutotypingEnabled()) return false;
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await sock.sendPresenceUpdate('paused', chatId);
        return true;
    } catch (e) {
        console.error('❌ Post-command typing error:', e);
        return false;
    }
}

module.exports = {
    autotypingCommand,
    isAutotypingEnabled,
    handleAutotypingForMessage,
    handleAutotypingForCommand,
    showTypingAfterCommand
};