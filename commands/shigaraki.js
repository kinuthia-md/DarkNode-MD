// commands/shigaraki.js - Shigaraki Quote
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

async function shigarakiCommand(sock, chatId, message) {
    try {
        const quotes = [
            '"I will become the symbol of peace!"',
            '"The world is not perfect, but I will make it better!"',
            '"I will destroy everything and rebuild it!"'
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 💀 SHIGARAKI ⪩───⟢\n│ ${quote}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Shigaraki] Error:', error);
    }
}

module.exports = shigarakiCommand;