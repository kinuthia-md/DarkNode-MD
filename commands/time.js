// commands/time.js - World Time
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

async function timeCommand(sock, chatId, message, args) {
    try {
        const city = args?.join(' ')?.trim() || 'UTC';

        await sock.sendMessage(chatId, { react: { text: '🕐', key: message.key } });

        // Placeholder for world time
        const currentTime = new Date().toLocaleString();

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🕐 WORLD TIME ⪩───⟢\n│ 📍 Location: ${city}\n│ 🕐 Time: ${currentTime}\n╰────────────⟢\n\n> *© DarkNode MD*`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Time] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = timeCommand;