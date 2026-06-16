// commands/clear.js
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

async function clearCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '🗑️', key: message.key } });

        const chatMessages = await sock.store.loadMessages(chatId, 50);
        let deleted = 0;

        for (const msg of chatMessages) {
            if (msg.key.fromMe) {
                try {
                    await sock.sendMessage(chatId, { delete: msg.key });
                    deleted++;
                } catch {}
            }
        }

        const text = deleted > 0
            ? `╭─── 『 🗑️ CLEAR 』───⟢
│ ✅ Deleted ${deleted} of your messages
╰────────────⟢
> © DarkNode MD`
            : `╭─── 『 🗑️ CLEAR 』───⟢
│ ❌ No messages found to delete
╰────────────⟢
> © DarkNode MD`;

        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Clear error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── 『 ❌ ERROR 』───⟢
│ ❌ Failed to clear messages.
╰────────────⟢
> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = { clearCommand };