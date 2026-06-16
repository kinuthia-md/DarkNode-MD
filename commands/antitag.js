// ============================================
//  Antitag Module
//  Detects mass tagging/spam tagging
//  and takes action when enabled
// ============================================

const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
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

async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ ANTITAG ⪩───⟢\n│ 👤 Group admins only.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        const args = userMessage.slice(8).toLowerCase().trim().split(/\s+/);
        const sub = args[0];

        if (!sub) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ ℹ️ ANTITAG ⪩───⟢\n│ 📌 Usage:\n│   .antitag on\n│   .antitag off\n│   .antitag set <delete/kick>\n│   .antitag status\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        switch (sub) {
            case 'on': {
                const existing = await getAntitag(chatId, 'on');
                if (existing?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: '╭─── ⪨ ❌ ANTITAG ⪩───⟢\n│ ⚠️ Antitag is already ON.\n╰────────────⟢\n> © DarkNode MD',
                        ...channelInfo
                    }, { quoted: fakeMeta });
                    return;
                }
                const result = await setAntitag(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: result
                        ? '╭─── ⪨ ✅ ANTITAG ⪩───⟢\n│ 🛡️ Antitag is now *ON*\n│ ⚙️ Default action: delete\n╰────────────⟢\n> © DarkNode MD'
                        : '╭─── ⪨ ❌ ANTITAG ⪩───⟢\n│ ❌ Failed to enable.\n╰────────────⟢\n> © DarkNode MD',
                    ...channelInfo
                }, { quoted: fakeMeta });
                break;
            }
            case 'off': {
                await removeAntitag(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: '╭─── ⪨ ✅ ANTITAG ⪩───⟢\n│ 🛡️ Antitag is now *OFF*\n╰────────────⟢\n> © DarkNode MD',
                    ...channelInfo
                }, { quoted: fakeMeta });
                break;
            }
            case 'set': {
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: '╭─── ⪨ ❌ ANTITAG ⪩───⟢\n│ ⚠️ Specify an action: delete or kick\n╰────────────⟢\n> © DarkNode MD',
                        ...channelInfo
                    }, { quoted: fakeMeta });
                    return;
                }
                const action = args[1];
                if (!['delete', 'kick'].includes(action)) {
                    await sock.sendMessage(chatId, {
                        text: '╭─── ⪨ ❌ ANTITAG ⪩───⟢\n│ ⚠️ Choose: delete or kick\n╰────────────⟢\n> © DarkNode MD',
                        ...channelInfo
                    }, { quoted: fakeMeta });
                    return;
                }
                const result = await setAntitag(chatId, 'on', action);
                await sock.sendMessage(chatId, {
                    text: result
                        ? `╭─── ⪨ ✅ ANTITAG ⪩───⟢\n│ 🛡️ Action set to: *${action}*\n╰────────────⟢\n> © DarkNode MD`
                        : '╭─── ⪨ ❌ ANTITAG ⪩───⟢\n│ ❌ Failed to set action.\n╰────────────⟢\n> © DarkNode MD',
                    ...channelInfo
                }, { quoted: fakeMeta });
                break;
            }
            case 'status': {
                const antitagConfig = await getAntitag(chatId, 'on');
                const status = antitagConfig?.enabled ? 'ON' : 'OFF';
                const action = antitagConfig?.action || 'Not set';
                await sock.sendMessage(chatId, {
                    text: `╭─── ⪨ ℹ️ ANTITAG ⪩───⟢\n│ 🛡️ Status: *${status}*\n│ ⚙️ Action: ${action}\n╰────────────⟢\n> © DarkNode MD`,
                    ...channelInfo
                }, { quoted: fakeMeta });
                break;
            }
            default:
                await sock.sendMessage(chatId, {
                    text: `╭─── ⪨ ❌ ANTITAG ⪩───⟢\n│ ⚠️ Unknown option: ${sub}\n│ 📌 Use .antitag for usage.\n╰────────────⟢\n> © DarkNode MD`,
                    ...channelInfo
                }, { quoted: fakeMeta });
        }
    } catch (e) {
        console.error('❌ Antitag command error:', e);
        try {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ ❌ Failed to process antitag.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
        } catch {}
    }
}

async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        const antitagConfig = await getAntitag(chatId, 'on');
        if (!antitagConfig?.enabled) return;

        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const messageText = message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption || '';

        const textMentions = messageText.match(/@\d{10,}/g) || [];
        const textMentionNumbers = new Set();
        textMentions.forEach(m => {
            const num = m.replace('@', '');
            textMentionNumbers.add(num);
        });

        const totalMentions = Math.max(mentionedJids.length, textMentionNumbers.size);

        if (totalMentions < 3) return;

        const groupMeta = await sock.groupMetadata(chatId);
        const participants = groupMeta.participants || [];
        const totalMembers = participants.length;
        const threshold = Math.ceil(totalMembers * 0.5);
        const shouldTrigger = totalMentions >= 10 || (totalMentions >= 5 && totalMentions >= threshold);

        if (totalMentions >= threshold || shouldTrigger) {
            const action = antitagConfig.action || 'delete';

            if (action === 'delete') {
                await sock.sendMessage(chatId, { delete: { remoteJid: chatId, fromMe: false, id: message.key.id, participant: senderId } });
                await sock.sendMessage(chatId, {
                    text: '╭─── ⪨ ⚠️ MASS TAG ⪩───⟢\n│ ❌ Mass tagging detected! Message deleted.\n╰────────────⟢\n> © DarkNode MD',
                    ...channelInfo
                });
            } else if (action === 'kick') {
                await sock.sendMessage(chatId, { delete: { remoteJid: chatId, fromMe: false, id: message.key.id, participant: senderId } });
                try {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await sock.sendMessage(chatId, {
                        text: `╭─── ⪨ ⚠️ MASS TAG ⪩───⟢\n│ 👤 @${senderId.split('@')[0]}\n│ 🚫 Kicked for mass tagging\n╰────────────⟢\n> © DarkNode MD`,
                        mentions: [senderId],
                        ...channelInfo
                    });
                } catch (e) {
                    console.error('Antitag kick error:', e);
                }
            }
        }
    } catch (e) {
        console.error('❌ Antitag detection error:', e);
    }
}

module.exports = {
    handleAntitagCommand,
    handleTagDetection
};