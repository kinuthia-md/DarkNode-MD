const settings = require('../settings.js');

// Static contact (same as help.js)
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
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:DARKNODE MD;;;;\nFN:DARKNODE MD\nTEL;waid=254794119486:+254 794 119 486\nEND:VCARD`,
            sendEphemeral: true
        }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: 'DARKNODE MD'
};

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
}

async function pingCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🏓", key: message.key } });

        const start = Date.now();
        await sock.sendMessage(chatId, { text: "🏓" }, { quoted: message });
        const end = Date.now();
        const ping = end - start;

        const uptimeStr = formatUptime(process.uptime());
        const memory = Math.round(process.memoryUsage().rss / 1024 / 1024);

        const response = `🏓 *Pong!*

⏱️ Ping: *${ping}ms*
⏰ Uptime: *${uptimeStr}*
🧠 RAM: *${memory}MB*
🔄 Version: *${settings.version || '1.0'}*

> *© 404R.Society*`;

        await sock.sendMessage(chatId, {
            document: Buffer.from(' ', 'utf-8'),
            mimetype: 'application/msword',
            fileName: `ping.doc`,
            fileLength: 99999999999999999999999999,
            caption: response,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363426838586273@newsletter',
                    newsletterName: '404R>Society',
                    serverMessageId: 13
                 
                }
            }
        }, { quoted: fakeMeta });

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Ping error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { text: "❌ Failed to get ping status." }, { quoted: message });
    }
}

module.exports = pingCommand;