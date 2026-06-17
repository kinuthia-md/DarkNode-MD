// commands/stupid.js - Stupid Command
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

async function stupidCommand(sock, chatId, message, mentionedJid) {
    try {
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg && !mentionedJid?.length) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🤪 STUPID ⪩───⟢\n│ 📌 Reply to a message or tag someone\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🤪', key: message.key } });

        const responses = [
            '🤪 Oops!',
            '😜 Silly!',
            '🙃 Funny!',
            '😝 Haha!'
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🤪 STUPID ⪩───⟢\n│ ${response}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Stupid] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = { stupidCommand };