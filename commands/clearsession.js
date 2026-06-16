// commands/clearsession.js
const settings = require('../settings');
const fs = require('fs');
const path = require('path');

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

async function clearsessionCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const senderNumber = senderId.split('@')[0].replace(/[^0-9]/g, '');
        const ownerNumber = (settings.ownerNumber || '').replace(/[^0-9]/g, '');

        if (senderNumber !== ownerNumber && !message.key.fromMe) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ ❌ RESTRICTED ⪩───⟢
│ ❌ Only the bot owner can use this command.
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🗑️', key: message.key } });

        const sessionDir = path.join(__dirname, '../session');
        let deleted = 0;

        if (fs.existsSync(sessionDir)) {
            const files = fs.readdirSync(sessionDir);
            for (const file of files) {
                if (file === 'creds.json') continue;
                try {
                    fs.unlinkSync(path.join(sessionDir, file));
                    deleted++;
                } catch {}
            }
        }

        const text = deleted > 0
            ? `╭─── ⪨ 🗑️ CLEAR SESSION ⪩───⟢
│ ✅ Deleted ${deleted} session files
│ 📁 Session folder cleared
╰────────────⟢
> © DarkNode MD`
            : `╭─── ⪨ 🗑️ CLEAR SESSION ⪩───⟢
│ ❌ No session files found to delete
╰────────────⟢
> © DarkNode MD`;

        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('ClearSession error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢
│ ❌ Failed to clear session.
╰────────────⟢
> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = { clearsessionCommand };