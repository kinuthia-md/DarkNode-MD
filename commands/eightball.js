// commands/eightball.js - Magic 8-Ball Command
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

const eightBallResponses = [
    'Yes, definitely!',
    'No, never.',
    'Ask again later.',
    'It is certain.',
    'Most likely.',
    'Reply hazy, try again.',
    'Outlook not so good.',
    'Signs point to yes.'
];

async function eightBallCommand(sock, chatId, message, args) {
    const question = args?.join(' ');
    
    if (!question) {
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ 🎱 MAGIC 8-BALL ⪩───⟢\n│ ❓ Please ask a question!\n│\n│ 💡 Usage: .8ball <question>\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: fakeMeta });
        return;
    }

    const randomResponse = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];

    await sock.sendMessage(chatId, {
        text: `╭─── ⪨ 🎱 MAGIC 8-BALL ⪩───⟢\n│ ❓ *Question:* ${question}\n│\n│ 🔮 *Answer:* ${randomResponse}\n╰────────────⟢\n> © DarkNode MD`,
        ...channelInfo
    }, { quoted: fakeMeta });
}

module.exports = { eightBallCommand };