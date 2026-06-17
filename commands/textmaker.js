// commands/textmaker.js - Text Style Maker
const axios = require('axios');
const settings = require('../settings');

const fakeMeta = {
    key: {
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: 'DARKNODE_META_' + Date.now()
    },
    message: {
        contactMessage: {
            displayName: 'DARKNODE MD',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:DARKNODE MD;;;;\nFN:DARKNODE MD\nTEL;waid=${settings.ownerNumber}:+${settings.ownerNumber}\nEND:VCARD`,
            sendEphemeral: true
        }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: 'DARKNODE MD'
};

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid,
            newsletterName: settings.newsletterName,
            serverMessageId: -1
        }
    }
};

async function textmakerCommand(sock, chatId, message, text, style) {
    try {
        if (!text) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ ✨ TEXT MAKER ⪩───⟢\n│ 📌 Usage: .textmaker <style> <text>\n│ 💡 Create styled text\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '✨', key: message.key } });

        // Placeholder for text maker
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ✨ TEXT MAKER ⪩───⟢\n│ Style: ${style || 'default'}\n│ Text: ${text}\n│\n│ ⚠️ Feature under maintenance.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '⚠️', key: message.key } });

    } catch (error) {
        console.error('[TextMaker] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = textmakerCommand;