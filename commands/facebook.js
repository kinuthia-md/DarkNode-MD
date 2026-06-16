// commands/facebook.js - Facebook Video Downloader
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

async function facebookCommand(sock, chatId, message, args) {
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const url = text.split(' ').slice(1).join(' ').trim();

    if (!url) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 📹 FACEBOOK VIDEO 』───⟢\n│ 📌 Usage: .fb <url>\n│ 💡 Send a Facebook video link\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: fakeMeta });
        return;
    }

    if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ INVALID LINK 』───⟢\n│ Please provide a valid Facebook video link.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: fakeMeta });
        return;
    }

    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

    try {
        const apiUrl = `https://api.downloader.wtf/api/facebook?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 20000 });

        if (response.status !== 200 || !response.data?.data?.downloads) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        const downloads = response.data.data.downloads;
        let downloadUrl = null;
        let quality = 'SD';

        const hdVideo = downloads.find(d => d.quality === 'HD' && d.type === 'video');
        const sdVideo = downloads.find(d => d.quality === 'SD' && d.type === 'video');

        if (hdVideo) { downloadUrl = hdVideo.download_url; quality = 'HD (720p)'; }
        else if (sdVideo) { downloadUrl = sdVideo.download_url; quality = 'SD (480p)'; }
        else { await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }); return; }

        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });

        await sock.sendMessage(chatId, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: `╭─── 『 📹 FACEBOOK VIDEO 』───⟢\n│ 📊 Quality: ${quality}\n│ 📱 Powered by DarkNode MD\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Facebook] Error:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = facebookCommand;