// commands/cleartmp.js
const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

function clearDir(dirPath) {
    let count = 0;
    if (!fs.existsSync(dirPath)) return 0;
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        if (item === 'creds.json') continue;
        const fullPath = path.join(dirPath, item);
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                count += clearDir(fullPath);
                try { fs.rmdirSync(fullPath); } catch {}
            } else {
                fs.unlinkSync(fullPath);
                count++;
            }
        } catch {}
    }
    return count;
}

async function cleartmpCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const senderNumber = senderId.split('@')[0].replace(/[^0-9]/g, '');
        const ownerNumber = (settings.ownerNumber || '').replace(/[^0-9]/g, '');

        if (senderNumber !== ownerNumber && !message.key.fromMe) {
            await sock.sendMessage(chatId, {
                text: `╭─── 『 ❌ RESTRICTED 』───⟢
│ ❌ Only the bot owner can use this command.
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🗑️', key: message.key } });

        const osTmp = os.tmpdir();
        const localTmp = path.join(__dirname, '../temp');

        const osCount = clearDir(osTmp);
        const localCount = clearDir(localTmp);

        const text = `╭─── 『 🗑️ CLEAR TEMP 』───⟢
│ ✅ OS temp cleared: ${osCount} files
│ ✅ Local temp cleared: ${localCount} files
╰────────────⟢
> © DarkNode MD`;

        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('ClearTmp error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── 『 ❌ ERROR 』───⟢
│ ❌ Failed to clear temp.
╰────────────⟢
> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = { cleartmpCommand };