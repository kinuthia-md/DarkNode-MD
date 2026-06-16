// commands/http.js - HTTP Request Tool
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

async function httpCommand(sock, chatId, message, args) {
    try {
        const url = args?.[0];

        if (!url) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🌐 HTTP ⪩───⟢\n│ 📌 Usage: .http <url>\n│ 💡 Make HTTP requests\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🌐', key: message.key } });

        const response = await axios.get(url, { timeout: 15000 });
        const status = response.status;
        const data = JSON.stringify(response.data, null, 2);

        const text = `╭─── ⪨ 🌐 HTTP RESPONSE ⪩───⟢\n│ 📊 Status: ${status}\n│ 📦 Data:\n│ \`\`\`${data.substring(0, 500)}${data.length > 500 ? '...' : ''}\`\`\`\n╰────────────⟢\n> © DarkNode MD`;

        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[HTTP] Error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢\n│ ${error.message}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = httpCommand;