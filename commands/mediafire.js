// commands/mediafire.js - MediaFire Downloader
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

async function mediafireCommand(sock, chatId, message, args) {
    try {
        const url = args?.[0];

        if (!url) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 📦 MEDIAFIRE ⪩───⟢\n│ 📌 Usage: .mediafire <url>\n│ 💡 Download from MediaFire\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        if (!url.includes('mediafire.com')) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ INVALID URL ⪩───⟢\n│ Please provide a valid MediaFire link.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '📦', key: message.key } });

        const response = await axios.get(`https://api.downloader.wtf/api/mediafire?url=${encodeURIComponent(url)}`);
        const data = response.data;

        if (data?.data?.downloads) {
            const download = data.data.downloads[0];
            await sock.sendMessage(chatId, {
                document: { url: download.url },
                fileName: download.filename || 'file',
                mimetype: 'application/octet-stream',
                caption: `╭─── ⪨ 📦 MEDIAFIRE ⪩───⟢\n│ Downloaded successfully\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } else {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ ❌ FAILED ⪩───⟢\n│ Could not download file.\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        }

    } catch (error) {
        console.error('[MediaFire] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = mediafireCommand;