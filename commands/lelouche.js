// commands/lelouche.js - Lelouch Quote
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

async function leloucheCommand(sock, chatId, message) {
    try {
        const quotes = [
            '"I am not a villain. I am a hero."',
            '"The only ones who should kill are those who are prepared to be killed."',
            '"If you are not strong enough to protect your ideals, then abandon them."',
            '"A world without pain and hardship is a world without meaning."'
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🎭 LELOUCH ⪩───⟢\n│ ${quote}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Lelouche] Error:', error);
    }
}

module.exports = leloucheCommand;