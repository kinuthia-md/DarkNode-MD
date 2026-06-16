// commands/flirt.js - Flirt Quote Generator
const fetch = require('node-fetch');
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

async function flirtCommand(sock, chatId, message) {
    try {
        const apiKey = 'NIZO_API_KEY';
        const response = await fetch(`https://nizam-api.officializ.repl.co/api/flirt?apikey=${apiKey}`);

        if (!response.ok) throw await response.text();

        const data = await response.json();
        const quote = data.result;

        await sock.sendMessage(chatId, {
            text: `╭─── 『 💕 FLIRT 』───⟢\n│ ${quote}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Flirt] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ ERROR 』───⟢\n│ Failed to fetch flirt quote.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = { flirtCommand };