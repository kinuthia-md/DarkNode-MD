// commands/trivia.js - Trivia Game
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

const questions = [
    { q: 'What is the capital of France?', a: 'Paris' },
    { q: 'What is 2 + 2?', a: '4' },
    { q: 'What is the largest planet?', a: 'Jupiter' }
];

async function startTrivia(sock, chatId) {
    try {
        const question = questions[Math.floor(Math.random() * questions.length)];

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🧠 TRIVIA ⪩───⟢\n│\n│ ❓ ${question.q}\n│\n│ 💡 Use .answer <answer>\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        });

    } catch (error) {
        console.error('[Trivia] Error:', error);
    }
}

async function answerTrivia(sock, chatId, answer) {
    try {
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🧠 TRIVIA ⪩───⟢\n│ Answer: ${answer}\n│\n│ ⚠️ Feature under maintenance.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        });
    } catch (error) {
        console.error('[AnswerTrivia] Error:', error);
    }
}

module.exports = { startTrivia, answerTrivia };