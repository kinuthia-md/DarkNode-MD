// commands/lyrics.js - Song Lyrics Search
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

async function lyricsCommand(sock, chatId, message, args) {
    try {
        const query = args?.join(' ')?.trim();

        if (!query) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🎵 LYRICS ⪩───⟢\n│ 📌 Usage: .lyrics <song>\n│ 💡 Search song lyrics\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });

        const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(query)}`);
        const lyrics = response.data.lyrics;

        if (!lyrics) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🎵 LYRICS ⪩───⟢\n│ ❌ Lyrics not found for: ${query}\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const truncatedLyrics = lyrics.length > 500 ? lyrics.substring(0, 500) + '...' : lyrics;

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🎵 LYRICS ⪩───⟢\n│ *${query}*\n│\n│ ${truncatedLyrics}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Lyrics] Error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to fetch lyrics.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = lyricsCommand;