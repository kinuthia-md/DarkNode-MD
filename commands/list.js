// commands/list.js - List All Commands
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

async function listCommand(sock, chatId, message) {
    const commands = [
        '🎮 .hangman - Play hangman game',
        '😂 .joke - Random joke',
        '🧠 .fact - Random fact',
        '💕 .flirt - Flirt quote',
        '😄 .compliment - Compliment',
        '🎱 .8ball - Magic 8-ball',
        '🎨 .imagine - AI image gen',
        '📸 .instagram - Instagram dl',
        '📹 .fb - Facebook video',
        '📦 .gitclone - GitHub clone',
        '🐙 .github - GitHub info',
        '🎬 .gif - GIF search',
        '😎 .emojimix - Mix emojis',
        '🖼️ .img-blur - Blur image',
        '📱 .fakenumber - Temp number',
        '👥 .groupinfo - Group info',
        '💀 .groupkill - Group kill',
        '📊 .gcstatus - Group status',
        '👻 .hidetag - Hidden tag',
        '🗑️ .del - Delete messages',
        '📋 .jid - Get JID info',
        '🌸 .kaguya - Anime quote',
        '😈 .insult - Random insult',
        '👻 .invis - Invis exploit',
        '🌐 .http - HTTP request',
        '🔍 .leaks - Search leaks',
        '🎭 .lelouche - Lelouch quote'
    ];

    const text = `╭─── ⪨ 📚 COMMAND LIST ⪩───⟢\n│\n${commands.map(c => `│ ${c}`).join('\n')}\n│\n│ 📊 Total: ${commands.length} commands\n╰────────────⟢\n\n> *© DarkNode MD*`;

    await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
}

module.exports = listCommand;