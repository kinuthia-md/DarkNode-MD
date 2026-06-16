// commands/claude.js
const axios = require('axios');
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

const SESSIONS_FILE = path.join(__dirname, '../data/claude_sessions.json');

if (!fs.existsSync(path.dirname(SESSIONS_FILE))) {
    fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
}

function loadSessions() {
    try {
        if (fs.existsSync(SESSIONS_FILE)) return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    } catch (e) { console.error('Error loading Claude sessions:', e.message); }
    return {};
}

function saveSessions(sessions) {
    try { fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2)); } catch (e) { console.error('Error saving Claude sessions:', e.message); }
}

async function claudeCommand(sock, chatId, message, args) {
    try {
        const userPrompt = args.join(' ').trim();
        if (!userPrompt) {
            await sock.sendMessage(chatId, {
                text: `╭─── 『 🤖 CLAUDE AI 』───⟢
│ 📌 Usage: .claude <message>
│ 💡 Example: .claude Hello!
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        const isGroup = chatId.endsWith('@g.us');
        const senderId = message.key.participant || message.key.remoteJid;
        const sessionKey = isGroup ? `${chatId}_${senderId}` : senderId;
        const sessions = loadSessions();
        const existingSessionId = sessions[sessionKey] || null;

        let apiUrl = `https://my-api-rzmb.onrender.com/api/ai/claude-pro?prompt=${encodeURIComponent(userPrompt)}`;
        if (existingSessionId) apiUrl += `&sessionId=${encodeURIComponent(existingSessionId)}`;

        const response = await axios.get(apiUrl, { timeout: 35000 });
        const data = response.data;

        if (data.statusCode === 200 && data.success && data.response) {
            if (data.sessionId && !existingSessionId) {
                sessions[sessionKey] = data.sessionId;
                saveSessions(sessions);
            }

            await sock.sendMessage(chatId, {
                text: `╭─── 『 🤖 CLAUDE 』───⟢
│ ${data.response}
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });

            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } else {
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('[Claude] Error:', error.message);
        await sock.sendMessage(chatId, {
            text: `╭─── 『 ❌ CLAUDE 』───⟢
│ ❌ Claude is busy. Try again later.
╰────────────⟢
> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = claudeCommand;