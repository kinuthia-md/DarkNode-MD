// commands/news.js - News Headlines
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

async function newsCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '📰', key: message.key } });

        const response = await axios.get('https://api.popcat.xyz/news');
        const news = response.data;

        if (!news || news.length === 0) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ 📰 NEWS ⪩───⟢\n│ No news available.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const headlines = news.slice(0, 5).map((item, i) => {
            return `│ ${i + 1}. ${item.title}\n│    📰 ${item.source}`;
        }).join('\n│\n');

        const text = `╭─── ⪨ 📰 NEWS ⪩───⟢\n│\n${headlines}\n│\n╰────────────⟢\n\n> *© DarkNode MD*`;

        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[News] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = newsCommand;