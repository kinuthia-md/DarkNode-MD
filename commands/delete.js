// commands/delete.js - Delete Messages Command
const isAdmin = require('../lib/isAdmin');
const store = require('../lib/lightweight_store');
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

function formatDeleteMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        delete: '🗑️',
        owner: '👑',
        bot: '🤖'
    };
    return `*『 ${emojis[type]} ${title} 』*\n╭─────⟢\n${content}\n╰────────────⟢\n\n> *© DarkNode MD*`;
}

async function deleteCommand(sock, chatId, message, args) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, message);

        if (!isBotAdmin) {
            const text = formatDeleteMessage('BOT NOT ADMIN', '│ ⚠️ Bot must be admin to delete messages.', 'warning');
            await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: fakeMeta });
            return;
        }

        if (!isSenderAdmin) {
            const text = formatDeleteMessage('ADMIN ONLY', '│ 👑 Only group admins can use this command.', 'owner');
            await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: fakeMeta });
            return;
        }

        const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const argsList = rawText.trim().split(/\s+/);
        let count = null;

        if (argsList.length > 1) {
            const parsed = parseInt(argsList[1], 10);
            if (!isNaN(parsed) && parsed > 0) count = Math.min(parsed, 50);
        }

        const contextInfo = message.message?.extendedTextMessage?.contextInfo || {};
        const quotedParticipant = contextInfo.participant || null;
        const quotedMsgId = contextInfo.stanzaId || null;

        let targetJid = null;
        let isGroupDelete = false;

        if (count === null && quotedParticipant) count = 1;
        else if (count === null && !quotedParticipant && !quotedMsgId) {
            const text = formatDeleteMessage('USAGE', '│ 📌 Specify number of messages to delete\n│ ♧ .del 5 - Delete last 5 messages\n│ ♧ .del @user - Delete user\'s messages\n│ ♧ .del - Delete quoted message', 'info');
            await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: fakeMeta });
            return;
        } else if (count === null && quotedMsgId) {
            count = 1;
        }

        let senderJid = null;
        let isTargeted = false;

        if (quotedParticipant && quotedMsgId) {
            senderJid = quotedParticipant;
            isTargeted = true;
        } else if (quotedMsgId) {
            senderJid = null;
            isTargeted = false;
        } else {
            isGroupDelete = true;
        }

        const messages = Array.isArray(store.messages[chatId]) ? store.messages[chatId] : [];
        const toDelete = [];
        const seen = new Set();

        if (isGroupDelete) {
            for (let i = messages.length - 1; i >= 0 && toDelete.length < count; i--) {
                const msg = messages[i];
                if (!seen.has(msg.key.id) && !msg.message?.protocolMessage && !msg.key.fromMe && msg.key.id !== message.key.id) {
                    toDelete.push(msg);
                    seen.add(msg.key.id);
                }
            }
        } else {
            if (senderJid) {
                const found = messages.find(m => m.key.id === quotedMsgId && (m.key.participant || m.key.remoteJid) === senderJid);
                if (found) {
                    toDelete.push(found);
                    seen.add(found.key.id);
                } else {
                    try {
                        await sock.sendMessage(chatId, { delete: { remoteJid: chatId, fromMe: false, id: quotedMsgId, participant: senderJid } });
                        count = Math.max(0, count - 1);
                    } catch {}
                }
            }
            for (let i = messages.length - 1; i >= 0 && toDelete.length < count; i--) {
                const msg = messages[i];
                const sender = msg.key.participant || msg.key.remoteJid;
                if (sender === senderJid && !seen.has(msg.key.id) && !msg.message?.protocolMessage) {
                    toDelete.push(msg);
                    seen.add(msg.key.id);
                }
            }
        }

        if (toDelete.length === 0) {
            const text = isGroupDelete
                ? formatDeleteMessage('NO MESSAGES', '│ No recent messages found to delete.', 'warning')
                : formatDeleteMessage('NO MESSAGES', '│ No messages found for this user.', 'warning');
            await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: fakeMeta });
            return;
        }

        for (const msg of toDelete) {
            try {
                const jid = msg.key.participant || msg.key.remoteJid;
                await sock.sendMessage(chatId, { delete: { remoteJid: chatId, fromMe: false, id: msg.key.id, participant: jid } });
                await new Promise(r => setTimeout(r, 300));
            } catch {}
        }

        const text = formatDeleteMessage('DELETED', `│ ✅ Messages deleted\n│ 📊 *Count:* ${toDelete.length}\n│ ${isGroupDelete ? '│ 📌 Recent messages' : `│ 📌 @${senderJid?.split('@')[0] || 'user'}`}`, 'success');
        const mentions = isGroupDelete ? [] : [senderJid].filter(Boolean);
        await sock.sendMessage(chatId, { text, mentions, ...channelInfo }, { quoted: fakeMeta });

    } catch (error) {
        const text = formatDeleteMessage('ERROR', `│ ❌ Failed to delete: ${error.message || 'Unknown'}`, 'error');
        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: fakeMeta });
    }
}

module.exports = deleteCommand;