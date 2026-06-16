// commands/owner.js - Owner Information
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

async function ownerCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '👑', key: message.key } });

        const ownerInfo = `╭─── ⪨ 👑 OWNERS ⪩───⟢\n│\n│ 📱 DARKBOI: wa.me/2349049636843\n│ 📱 NABEES: wa.me/2347072182960\n│\n│ 💬 Contact for support\n╰────────────⟢\n\n> *© DarkNode MD*`;

        await sock.sendMessage(chatId, {
            text: ownerInfo,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Owner] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = ownerCommand;