// commands/status.js - Bot Status
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

async function statusCommand(sock, chatId, message, args) {
    try {
        const statusText = args?.join(' ')?.trim() || 'Available';

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 📊 STATUS ⪩───⟢\n│\n│ 📝 Status: ${statusText}\n│\n│ ✅ Bot is running\n╰────────────⟢\n\n> *© DarkNode MD*`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Status] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to set status.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = statusCommand;