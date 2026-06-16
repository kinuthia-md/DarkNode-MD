// commands/muzan.js - Muzan Quote
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

async function muzanCommand(sock, chatId, message) {
    try {
        const quotes = [
            '"I am the strongest demon in existence!"',
            '"Fear is the foundation of my power."',
            '"You will all bow before me."'
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🦇 MUZAN ⪩───⟢\n│ ${quote}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Muzan] Error:', error);
    }
}

module.exports = muzanCommand;