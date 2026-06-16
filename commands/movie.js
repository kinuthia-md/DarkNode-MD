// commands/movie.js - Movie Information
const axios = require('axios');
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

async function movieCommand(sock, chatId, message, args) {
    try {
        const query = args?.join(' ')?.trim();

        if (!query) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🎬 MOVIE ⪩───⟢\n│ 📌 Usage: .movie <name>\n│ 💡 Search movie info\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🎬', key: message.key } });

        const response = await axios.get(`https://api.popcat.xyz/v1/movie?query=${encodeURIComponent(query)}`);
        const movie = response.data;

        if (!movie || !movie.title) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🎬 MOVIE ⪩───⟢\n│ ❌ Movie not found: ${query}\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const text = `╭─── ⪨ 🎬 MOVIE ⪩───⟢\n│ *${movie.title}*\n│\n│ 📅 Year: ${movie.year}\n│ ⭐ Rating: ${movie.rating}\n│ 📝 Plot: ${movie.plot?.substring(0, 200)}...\n│ 🎭 Genre: ${movie.genre}\n╰────────────⟢\n> © DarkNode MD`;

        await sock.sendMessage(chatId, {
            text,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Movie] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = movieCommand;