// commands/tempmail.js - Temporary Email
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

async function tempmailCommand(sock, chatId, message, args) {
    try {
        const action = args?.[0]?.toLowerCase();

        if (!action || !['new', 'check', 'inbox'].includes(action)) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 📧 TEMP MAIL ⪩───⟢\n│ 📌 Usage: .tempmail <new/check>\n│ 💡 Temporary email service\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '📧', key: message.key } });

        // Placeholder for temp mail
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 📧 TEMP MAIL ⪩───⟢\n│ Action: ${action}\n│\n│ ⚠️ Feature under maintenance.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '⚠️', key: message.key } });

    } catch (error) {
        console.error('[TempMail] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = tempmailCommand;