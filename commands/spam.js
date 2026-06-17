// commands/spam.js - Spam Messages
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

async function spamCommand(sock, chatId, message, args) {
    try {
        const text = args?.join(' ')?.trim();
        const count = parseInt(args?.[0]) || 5;

        if (!text || isNaN(count)) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 📧 SPAM ⪩───⟢\n│ 📌 Usage: .spam <count> <text>\n│ 💡 Spam messages\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const spamText = args?.slice(1)?.join(' ') || 'Spam!';
        const maxCount = Math.min(count, 10);

        for (let i = 0; i < maxCount; i++) {
            await sock.sendMessage(chatId, {
                text: `${spamText}`,
                ...channelInfo
            });
        }

    } catch (error) {
        console.error('[Spam] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to spam.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = spamCommand;