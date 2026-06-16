// commands/github.js - GitHub Repository Info
const moment = require('moment');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
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

function formatGithubMessage(title, content, type = 'success') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        github: '🐙',
        package: '📦',
        code: '💻'
    };
    return `*⪨ ${emojis[type]} ${title} ⪩*\n╭─────⟢\n${content}\n╰────────────⟢\n\n> *© DarkNode MD*`;
}

async function githubCommand(sock, chatId, message) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        const response = await fetch('https://api.github.com/repos/kinuthia-md/DarkNode-MD');
        if (!response.ok) throw new Error('Failed to fetch repository data');

        const repo = await response.json();

        let text = `*⪨ 🐙 GITHUB REPOSITORY ⪩*\n╭─────⟢\n│ 📂 *Name:* ${repo.name}\n│ 📊 *Watchers:* ${repo.watchers_count}\n│ 📊 *Size:* ${(repo.size / 1024).toFixed(2)} KB\n│ 📅 *Created:* ${moment(repo.created_at).format('DD/MM/YYYY HH:mm')}\n│ 📝 *Description:* ${repo.description || 'No description'}\n│ 🍴 *Forks:* ${repo.forks_count}\n│ ⭐ *Stars:* ${repo.stargazers_count}\n╰────────────⟢\n\n> *© DarkNode MD*`;

        const botImage = path.join(__dirname, '../assets/bot_image.jpg');
        if (fs.existsSync(botImage)) {
            const img = fs.readFileSync(botImage);
            await sock.sendMessage(chatId, {
                image: img, caption: text, ...channelInfo
            }, { quoted: fakeMeta });
        } else {
            await sock.sendMessage(chatId, {
                text, ...channelInfo
            }, { quoted: fakeMeta });
        }

    } catch (error) {
        console.error('[Github] Error:', error);
        const text = formatGithubMessage('ERROR', `│ ❌ Error fetching info: ${error.message}`, 'error');
        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: fakeMeta });
    }
}

module.exports = githubCommand;