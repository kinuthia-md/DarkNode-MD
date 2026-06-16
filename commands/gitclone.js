// commands/gitclone.js - GitHub Repository Downloader
const fetch = require('node-fetch');
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

async function gitcloneCommand(sock, chatId, message, args) {
    try {
        const repoUrl = args?.trim();

        if (!repoUrl) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 📦 GITCLONE ⪩───⟢\n│ 📌 Usage: .gitclone <github_url>\n│ 💡 Example: .gitclone https://github.com/user/repo\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        if (!/^https:\/\/github\.com\/[^\/]+\/[^\/]+/.test(repoUrl)) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ INVALID URL ⪩───⟢\n│ Invalid GitHub link.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/i);
        if (!match) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        const owner = match[1];
        let repo = match[2].replace(/\.git$/, '');

        const downloadUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/HEAD`;
        const response = await fetch(downloadUrl, { method: 'HEAD' });

        if (!response.ok) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        const disposition = response.headers.get('content-disposition');
        const filename = disposition ? disposition.match(/filename="?(.+?)"?$/)?.[1] || `${repo}.zip` : `${repo}.zip`;

        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });

        await sock.sendMessage(chatId, {
            document: { url: downloadUrl },
            fileName: filename,
            mimetype: 'application/zip',
            caption: `╭─── ⪨ 📦 GITCLONE ⪩───⟢\n│ 📂 ${owner}/${repo}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[GitClone] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = gitcloneCommand;