// commands/kaguya.js - Kaguya Quote Generator
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

async function kaguyaCommand(sock, chatId, message) {
    try {
        const response = await axios.get('https://api.animechan.xyz/v1/random');
        const quote = response.data;

        const text = `╭─── ⪨ 🌸 KAGUYA ⪩───⟢\n│ *"${quote.quote}"*\n│\n│ - ${quote.character}\n│ (${quote.anime})\n╰────────────⟢\n> © DarkNode MD`;

        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });

    } catch (error) {
        console.error('[Kaguya] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to fetch anime quote.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = { kaguyaCommand };