// commands/tagall.js - Tag All Members
const isAdmin = require('../lib/isAdmin');
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

async function tagAllCommand(sock, chatId, senderId, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, message);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ BOT NOT ADMIN ⪩───⟢\n│ Bot must be admin to tag all.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ ADMIN ONLY ⪩───⟢\n│ Only admins can use this command.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '📣', key: message.key } });

        const groupMetadata = await sock.groupMetadata(chatId);
        const members = groupMetadata.participants || [];
        const allJids = members.map(m => m.id);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const customText = text.split(' ').slice(1).join(' ') || '╭─── ⪨ 📣 TAG ALL ⪩───⟢\n│ Mentioning all members...\n╰────────────⟢\n> © DarkNode MD';

        await sock.sendMessage(chatId, {
            text: customText,
            mentions: allJids,
            ...channelInfo
        });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[TagAll] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = tagAllCommand;