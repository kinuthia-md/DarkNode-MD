// ============================================
//  Autoreply Module
//  Automatically replies to messages with
//  custom messages when enabled
// ============================================

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'autoreply.json');

const botVcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:' + settings.botName + '\nORG:DarkNode MD;\nTEL;type=CELL;waid=' + settings.ownerNumber + ':+' + settings.ownerNumber + '\nURL:' + settings.channelLink + '\nEND:VCARD';

function initConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        const defaultConfig = { enabled: false, message: 'Hello! I am a bot.' };
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

async function autoreplyCommand(sock, chatId, message) {
    try {
        const isOwner = message.key.fromMe;

        if (!isOwner) {
            await sendWithContact(sock, chatId, '╭─── ⪨ ❌ AUTOREPLY ⪩───⟢\n│ 👤 Only the bot owner can use this.\n╰────────────⟢\n> © DarkNode MD', message);
            return;
        }

        const rawText = message.message?.conversation ||
            message.message?.extendedTextMessage?.text || '';
        const parts = rawText.trim().split(/\s+/);
        const sub = parts[1] ? parts[1].toLowerCase() : null;

        const config = initConfig();

        if (sub === 'on' || sub === 'enable') {
            config.enabled = true;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            await sendWithContact(sock, chatId, '╭─── ⪨ ✅ AUTOREPLY ⪩───⟢\n│ 💬 Auto-reply is now *ON*\n╰────────────⟢\n> © DarkNode MD', message);
        } else if (sub === 'off' || sub === 'disable') {
            config.enabled = false;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            await sendWithContact(sock, chatId, '╭─── ⪨ ✅ AUTOREPLY ⪩───⟢\n│ 💬 Auto-reply is now *OFF*\n╰────────────⟢\n> © DarkNode MD', message);
        } else if (sub === 'set' && parts.length >= 3) {
            const customMessage = parts.slice(2).join(' ');
            config.message = customMessage;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            await sendWithContact(sock, chatId, `╭─── ⪨ ✅ AUTOREPLY ⪩───⟢\n│ 💬 Reply message updated!\n│ 📝 ${customMessage}\n╰────────────⟢\n> © DarkNode MD`, message);
        } else {
            const status = config.enabled ? 'ON' : 'OFF';
            await sendWithContact(sock, chatId, `╭─── ⪨ ℹ️ AUTOREPLY ⪩───⟢\n│ 💬 Status: *${status}*\n│ 📝 Message: ${config.message}\n│ 📌 Usage:\n│   .autoreply on/off\n│   .autoreply set <message>\n╰────────────⟢\n> © DarkNode MD`, message);
        }
    } catch (e) {
        console.error('❌ Autoreply error:', e);
        try { await sock.sendMessage(chatId, { text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ ❌ Failed to process command.\n╰────────────⟢\n> © DarkNode MD' }, { quoted: message }); } catch {}
    }
}

function isAutoreplyEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (e) {
        return false;
    }
}

function getAutoreplyMessage() {
    try {
        const config = initConfig();
        return config.message || 'Hello! I am a bot.';
    } catch (e) {
        return 'Hello! I am a bot.';
    }
}

async function handleAutoreply(sock, chatId, message, senderId) {
    if (!isAutoreplyEnabled()) return false;
    if (message.key.fromMe) return false;

    try {
        const replyText = getAutoreplyMessage();
        const msg = await sock.sendMessage(chatId, {
            text: replyText,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: settings.newsletterJid,
                    newsletterName: settings.newsletterName,
                    serverMessageId: -1
                }
            }
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            contacts: {
                displayName: settings.botName,
                contacts: [{ vcard: botVcard }]
            }
        }, { quoted: msg });

        return true;
    } catch (e) {
        console.error('❌ Autoreply send error:', e);
        return false;
    }
}

module.exports = {
    autoreplyCommand,
    isAutoreplyEnabled,
    getAutoreplyMessage,
    handleAutoreply
};