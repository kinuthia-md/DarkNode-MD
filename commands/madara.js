// commands/madara.js - Madara Quote
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

async function madaraCommand(sock, chatId, message) {
    try {
        const quotes = [
            '"Wake up to reality!"',
            '"In this world, there are only two kinds of people: those who are strong and those who are weak."',
            '"Power is not will, it is the result of struggle."'
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 👁️ MADARA ⪩───⟢\n│ ${quote}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Madara] Error:', error);
    }
}

module.exports = madaraCommand;