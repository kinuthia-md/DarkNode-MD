// commands/truth.js - Truth or Dare
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

const truths = [
    'What is your biggest fear?',
    'What is your most embarrassing moment?',
    'What is a secret you have never told anyone?',
    'What is your biggest regret?',
    'What is the most trouble you have been in?'
];

async function truthCommand(sock, chatId, message) {
    try {
        const truth = truths[Math.floor(Math.random() * truths.length)];

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 💬 TRUTH ⪩───⟢\n│\n│ ❓ ${truth}\n│\n│ Answer honestly!\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Truth] Error:', error);
    }
}

module.exports = truthCommand;