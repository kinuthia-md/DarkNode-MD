// commands/ss.js - Screenshot Tool
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

async function ssCommand(sock, chatId, message, args) {
    try {
        const url = args?.join(' ')?.trim();

        if (!url) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 📸 SCREENSHOT ⪩───⟢\n│ 📌 Usage: .ss <url>\n│ 💡 Take website screenshot\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '📸', key: message.key } });

        const screenshotUrl = `https://api.popcat.xyz/v1/screenshot?url=${encodeURIComponent(url)}`;

        await sock.sendMessage(chatId, {
            image: { url: screenshotUrl },
            caption: `╭─── ⪨ 📸 SCREENSHOT ⪩───⟢\n│ ${url}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[SS] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = ssCommand;