// commands/tag.js - Tag Members
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

async function tagCommand(sock, chatId, message, text, mentionedJid) {
    try {
        if (!mentionedJid || mentionedJid.length === 0) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 📣 TAG ⪩───⟢\n│ 📌 Tag members to mention them\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const tagText = text || 'Hey!';

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 📣 TAG ⪩───⟢\n│ ${tagText}\n╰────────────⟢\n> © DarkNode MD`,
            mentions: mentionedJid,
            ...channelInfo
        });

    } catch (error) {
        console.error('[Tag] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to tag members.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = tagCommand;