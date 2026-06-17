// commands/ship.js - Ship Calculator
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

async function shipCommand(sock, chatId, message, args) {
    try {
        const text = args?.join(' ')?.trim();

        if (!text) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 💕 SHIP ⪩───⟢\n│ 📌 Usage: .ship <name1> <name2>\n│  Calculate love percentage\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const percentage = Math.floor(Math.random() * 100);
        const result = percentage >= 50 ? '💕 Perfect match!' : '💔 Not compatible';

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 💕 SHIP ⪩───⟢\n│ ${text}\n│\n│ ${result}\n│ 📊 Love: ${percentage}%\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Ship] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to calculate.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = shipCommand;