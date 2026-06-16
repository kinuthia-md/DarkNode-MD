// ============================================
//  Antidelete Module - Enhanced Version
//  Captures deleted messages (including media)
//  and sends them to the owner's personal chat
//  with the actual image/video/file attached,
//  plus sender info, time, and group name.
// ============================================

const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');
const isOwnerOrSudo = require('../lib/isOwner');
const settings = require('../settings');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '..', 'temp', 'antidelete_media');

if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}

const stats = {
    messagesStored: 0,
    viewOnceCaptured: 0,
    deletionsCaught: 0,
    mediaSaved: 0,
    startTime: Date.now()
};

const messageStore = new Map();

function getFolderSizeInMB(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);
        let totalSize = 0;
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isFile()) {
                totalSize += fs.statSync(filePath).size;
            }
        }
        return totalSize / (1024 * 1024);
    } catch (e) { return 0; }
}

function cleanTempFolderIfLarge() {
    try {
        const size = getFolderSizeInMB(TEMP_MEDIA_DIR);
        if (size > 200) {
            const files = fs.readdirSync(TEMP_MEDIA_DIR);
            for (const file of files) {
                try { fs.unlinkSync(path.join(TEMP_MEDIA_DIR, file)); } catch {}
            }
            console.log(`🧹 Cleaned antidelete temp (${size.toFixed(2)}MB)`);
        }
    } catch {}
}

setInterval(cleanTempFolderIfLarge, 3 * 60 * 1000);

function loadAntideleteConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch {}
    return { enabled: false };
}

function saveAntideleteConfig(config) {
    try {
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (e) { console.error('Error saving antidelete config:', e.message); }
}

function getUptime() {
    const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getFormattedTime() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Africa/Nairobi',
        hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

/**
 * Download media from a message and save to temp directory
 */
async function downloadMedia(sock, message, msgId) {
    try {
        const msg = message.message;
        if (!msg) return null;

        let stream = null;
        let ext = '.bin';
        let mediaType = 'unknown';

        if (msg.imageMessage) {
            stream = await downloadContentFromMessage(msg.imageMessage, 'image');
            ext = '.jpg'; mediaType = 'image';
        } else if (msg.videoMessage) {
            stream = await downloadContentFromMessage(msg.videoMessage, 'video');
            ext = '.mp4'; mediaType = 'video';
        } else if (msg.audioMessage) {
            stream = await downloadContentFromMessage(msg.audioMessage, 'audio');
            ext = msg.audioMessage.ptt ? '.ogg' : '.mp3'; mediaType = 'audio';
        } else if (msg.documentMessage) {
            stream = await downloadContentFromMessage(msg.documentMessage, 'document');
            ext = '.' + (msg.documentMessage.mimetype?.split('/')[1] || 'bin'); mediaType = 'document';
        } else if (msg.stickerMessage) {
            stream = await downloadContentFromMessage(msg.stickerMessage, 'sticker');
            ext = '.webp'; mediaType = 'sticker';
        }

        if (!stream) return null;

        const fileName = `${msgId}${ext}`;
        const filePath = path.join(TEMP_MEDIA_DIR, fileName);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        await writeFile(filePath, buffer);
        stats.mediaSaved++;
        console.log(`💾 Saved media: ${fileName} (${(buffer.length / 1024).toFixed(1)}KB)`);
        return { filePath, mediaType };
    } catch (e) {
        console.error('downloadMedia error:', e.message);
        return null;
    }
}

/**
 * Send a deleted message report to the owner's personal chat with media
 */
async function sendDeletedReport(sock, ownerJid, stored, deletedBy, chatId) {
    try {
        const senderId = stored.sender;
        const senderName = senderId.split('@')[0];
        const deletedByName = deletedBy.split('@')[0];

        let groupDisplayName = 'Private Chat';
        if (chatId?.endsWith('@g.us')) {
            try {
                const groupMeta = await sock.groupMetadata(chatId);
                groupDisplayName = groupMeta.subject || chatId;
            } catch { groupDisplayName = chatId; }
        }

        const reportText = `╭─── 『 🗑️ DELETED MESSAGE 』───⟢
│
│ 👤 *Sent by:* @${senderName}
│ 🚫 *Deleted by:* @${deletedByName}
│ 💬 *Chat:* ${groupDisplayName}
│ 📅 *Time:* ${stored.time}
│ ⏱️ *Deleted at:* ${getFormattedTime()}
│ 🆔 *Msg ID:* ${stored.msgId}
${stored.content ? `│ 📄 *Content:* ${stored.content.substring(0, 200)}` : ''}
${stored.mediaType ? `│ 🖼️ *Media:* ${stored.mediaType}` : ''}
│
╰────────────⟢
> © DarkNode MD`;

        // If we have saved media, send it with the report as caption
        if (stored.mediaPath && fs.existsSync(stored.mediaPath)) {
            const mediaBuffer = fs.readFileSync(stored.mediaPath);

            if (stored.mediaType === 'image') {
                await sock.sendMessage(ownerJid, {
                    image: mediaBuffer, caption: reportText,
                    mentions: [senderId, deletedBy], ...channelInfo
                });
            } else if (stored.mediaType === 'video') {
                await sock.sendMessage(ownerJid, {
                    video: mediaBuffer, caption: reportText,
                    mentions: [senderId, deletedBy], ...channelInfo
                });
            } else if (stored.mediaType === 'audio') {
                await sock.sendMessage(ownerJid, {
                    text: reportText, mentions: [senderId, deletedBy], ...channelInfo
                });
                await sock.sendMessage(ownerJid, {
                    audio: mediaBuffer, mimetype: 'audio/mpeg',
                    ptt: stored.fullMessage?.audioMessage?.ptt || false
                });
            } else if (stored.mediaType === 'sticker') {
                await sock.sendMessage(ownerJid, {
                    text: reportText, mentions: [senderId, deletedBy], ...channelInfo
                });
                await sock.sendMessage(ownerJid, { sticker: mediaBuffer });
            } else {
                await sock.sendMessage(ownerJid, {
                    document: mediaBuffer,
                    mimetype: stored.fullMessage?.documentMessage?.mimetype || 'application/octet-stream',
                    fileName: `deleted_${stored.msgId}${path.extname(stored.mediaPath) || '.bin'}`,
                    caption: reportText, mentions: [senderId, deletedBy], ...channelInfo
                });
            }

            try { fs.unlinkSync(stored.mediaPath); } catch {}
        } else {
            // No media, just send text report
            await sock.sendMessage(ownerJid, {
                text: reportText, mentions: [senderId, deletedBy], ...channelInfo
            });
        }

        return true;
    } catch (e) {
        console.error('sendDeletedReport error:', e);
        return false;
    }
}

const channelInfo = {
    contextInfo: {
        forwardingScore: 1, isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid,
            newsletterName: settings.newsletterName,
            serverMessageId: -1
        }
    }
};

// Handle .antidelete command
async function handleAntideleteCommand(sock, chatId, message, args) {
    try {
        const config = loadAntideleteConfig();
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!message.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, {
                text: '╭─── 『 🔒 OWNER ONLY 』───⟢\n│ ❌ This command is for owners only!\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const input = (args || '').trim().toLowerCase();

        if (!input) {
            const folderSize = getFolderSizeInMB(TEMP_MEDIA_DIR).toFixed(2);
            await sock.sendMessage(chatId, {
                text: `╭─── 『 🗑️ ANTIDELETE 』───⟢
│
│ 📊 *Status:* ${config.enabled ? '✅ ON' : '❌ OFF'}
│ 📁 *Cache:* ${folderSize}MB
│ 📨 *Stored:* ${stats.messagesStored}
│ 🗑️ *Deletions:* ${stats.deletionsCaught}
│ 🖼️ *Media:* ${stats.mediaSaved}
│ ⏱️ *Uptime:* ${getUptime()}
│
│ 📝 *Commands:*
│ • \`.antidelete on\` — Enable
│ • \`.antidelete off\` — Disable
│
│ *Captures:* Text, images, videos, audio, documents, stickers
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        if (input === 'on') {
            config.enabled = true;
            saveAntideleteConfig(config);
            await sock.sendMessage(chatId, {
                text: '╭─── 『 ✅ ANTIDELETE 』───⟢\n│\n│ ✅ Antidelete is now *ACTIVE*\n│ Deleted messages & media will be\n│ captured and sent to your DM.\n│\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
        } else if (input === 'off') {
            config.enabled = false;
            saveAntideleteConfig(config);
            await sock.sendMessage(chatId, {
                text: '╭─── 『 ❌ ANTIDELETE 』───⟢\n│\n│ ❌ Antidelete is now *INACTIVE*\n│\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `╭─── 『 ❌ ERROR 』───⟢\n│ ❌ Unknown option: *${input}*\n│ 📌 Use: \`.antidelete on/off\`\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
        }
    } catch (e) { console.error('handleAntideleteCommand error:', e); }
}

// Store a message for antidelete tracking
async function storeMessage(sock, message) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;
        if (!message.key?.id) return;

        const msgId = message.key.id;
        let content = '';
        let mediaType = '';
        let mediaPath = '';
        const senderId = message.key.participant || message.key.remoteJid;
        const groupId = message.key.remoteJid?.endsWith('@g.us') ? message.key.remoteJid : null;
        const msg = message.message;
        if (!msg) return;

        // Extract text content
        if (msg.conversation) content = msg.conversation;
        else if (msg.extendedTextMessage?.text) content = msg.extendedTextMessage.text;
        else if (msg.imageMessage?.caption) content = msg.imageMessage.caption;
        else if (msg.videoMessage?.caption) content = msg.videoMessage.caption;

        // Detect and download media
        const mediaResult = await downloadMedia(sock, message, msgId);
        if (mediaResult) {
            mediaPath = mediaResult.filePath;
            mediaType = mediaResult.mediaType;
        }

        const time = new Date().toLocaleString('en-US', {
            timeZone: 'Africa/Nairobi',
            hour12: true, hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        messageStore.set(msgId, {
            content, mediaType, mediaPath, sender: senderId,
            group: groupId, time, msgId, fullMessage: msg
        });
        stats.messagesStored++;

        // Keep store manageable (max 500)
        if (messageStore.size > 500) {
            const firstKey = messageStore.keys().next().value;
            if (firstKey) {
                const first = messageStore.get(firstKey);
                if (first?.mediaPath && fs.existsSync(first.mediaPath)) {
                    try { fs.unlinkSync(first.mediaPath); } catch {}
                }
                messageStore.delete(firstKey);
            }
        }
    } catch (e) { console.error('storeMessage error:', e.message); }
}

// Handle when a message is deleted/revoked
async function handleMessageRevocation(sock, message) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        const protocolMsg = message.message?.protocolMessage;
        if (!protocolMsg) return;

        // Handle both type 0 (REVOKE) and type 3 (REVOKE from group)
        if (protocolMsg.type !== 0 && protocolMsg.type !== 3) return;

        const deletedMsgId = protocolMsg.key?.id;
        if (!deletedMsgId) return;

        const deletedBy = message.participant || message.key.participant || message.key.remoteJid;
        const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        if (deletedBy === botJid) return;

        const stored = messageStore.get(deletedMsgId);
        if (!stored) {
            console.log(`🗑️ Deletion detected but message not in store (ID: ${deletedMsgId})`);
            return;
        }

        const chatId = stored.group || message.key.remoteJid;

        // Get owner JIDs
        let ownerJids = [];
        try {
            const ownerData = JSON.parse(fs.readFileSync('./data/owner.json', 'utf8'));
            const ownerNumbers = Array.isArray(ownerData) ? ownerData : [ownerData];
            ownerJids = ownerNumbers.map(owner => {
                const num = typeof owner === 'string' ? owner : owner.number || '';
                return num + '@s.whatsapp.net';
            }).filter(j => j && j !== '@s.whatsapp.net');
        } catch {}

        // Also send to settings owner
        if (settings.ownerNumber) {
            const settingsOwner = settings.ownerNumber + '@s.whatsapp.net';
            if (!ownerJids.includes(settingsOwner)) ownerJids.push(settingsOwner);
        }

        // Send report to each owner
        for (const ownerJid of ownerJids) {
            await sendDeletedReport(sock, ownerJid, stored, deletedBy, chatId);
        }

        stats.deletionsCaught++;
        console.log(`🗑️ Deleted message caught: from ${stored.sender}, deleted by ${deletedBy}`);

        messageStore.delete(deletedMsgId);
    } catch (e) { console.error('handleMessageRevocation error:', e.message); }
}

function getStats() {
    return { ...stats, folderSize: getFolderSizeInMB(TEMP_MEDIA_DIR).toFixed(2), storedCount: messageStore.size };
}

module.exports = { handleAntideleteCommand, handleMessageRevocation, storeMessage, getStats };