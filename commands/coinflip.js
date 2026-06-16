// commands/coinflip.js
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

const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

async function coinflipCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '🎲', key: message.key } });
        const isHeads = Math.random() > 0.5;
        const emoji = isHeads ? '👑' : '💀';
        const result = isHeads ? 'HEADS' : 'TAILS';
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🪙 COIN FLIP ⪩───⟢\n│ ${emoji} *Result:* ${result}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (error) {
        console.error('Coinflip error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢\n│ ❌ Failed to process command.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

async function diceCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '🎲', key: message.key } });
        const num = Math.floor(Math.random() * 6);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🎲 DICE ⪩───⟢\n│ ${DICE[num]} *Result:* ${num + 1}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (error) {
        console.error('Dice error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢\n│ ❌ Failed to process command.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

async function rollCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '🎲', key: message.key } });
        const num = Math.floor(Math.random() * 100) + 1;
        const filled = Math.round(num / 5);
        const empty = 20 - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🎲 ROLL ⪩───⟢\n│ 🎯 *Result:* ${num}/100\n│ ${bar}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (error) {
        console.error('Roll error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢\n│ ❌ Failed to process command.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = { coinflipCommand, diceCommand, rollCommand };