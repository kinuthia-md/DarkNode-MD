// commands/topmembers.js - Top Members
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

async function topMembers(sock, chatId, isGroup) {
    try {
        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ GROUPS ONLY ⪩───⟢\n│ This command is for groups only.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🏆', key: message.key } });

        // Placeholder for top members
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🏆 TOP MEMBERS ⪩───⟢\n│ Most active members\n│\n│ ⚠️ Feature under maintenance.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[TopMembers] Error:', error);
    }
}

module.exports = { topMembers };