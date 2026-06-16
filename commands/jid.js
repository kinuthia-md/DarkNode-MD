// commands/jid.js - Get Chat JID Information
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

async function jidCommand(sock, chatId, message) {
    try {
        const senderJid = message.key.participant || message.key.remoteJid;
        let chatType = 'Private';

        if (chatId.endsWith('@g.us')) chatType = 'Group';
        else if (chatId.endsWith('@lid')) chatType = 'LID';
        else if (chatId.endsWith('@newsletter')) chatType = 'Newsletter';

        const text = `╭─── ⪨ 📋 JID INFO ⪩───⟢\n┃ 📌 *Chat JID:* \`${chatId}\`\n┃ 👤 *You:* \`${senderJid}\`\n┃ 🏷️ *Type:* ${chatType}\n╰━━━━━━━━━━━━━━━━━━━━⟢\n\n> *© DarkNode MD*`;

        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });

    } catch (error) {
        console.error('[JID] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to fetch JID.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = jidCommand;