// commands/leaks.js - Content Leak Search
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

async function leaksCommand(sock, chatId, message, args) {
    try {
        const query = args?.join(' ')?.trim();

        if (!query) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🔍 LEAKS ⪩───⟢\n│ 📌 Usage: .leaks <search>\n│ 💡 Search for content\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        const response = await axios.get(`https://api.popcat.xyz/search?q=${encodeURIComponent(query)}`);
        const results = response.data;

        if (!results || results.length === 0) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🔍 LEAKS ⪩───⟢\n│ No results found for: ${query}\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const resultText = results.slice(0, 3).map((r, i) => `│ ${i + 1}. ${r.title}\n│    🔗 ${r.url}`).join('\n│\n');

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🔍 LEAKS ⪩───⟢\n│ Search: ${query}\n│\n${resultText}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Leaks] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = leaksCommand;