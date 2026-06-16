// commands/gcstatus.js - Group Status Message
const { downloadMediaMessage, prepareWAMessageMedia, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const pino = require('pino');
const settings = require('../settings');
const isAdmin = require('../lib/isAdmin');

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

async function gcstatus(sock, chatId, message, args) {
    let targetGroup = chatId;
    let customMessage = '';

    if (args && args.length > 0) {
        if (args[0].endsWith('@g.us')) {
            targetGroup = args[0];
            customMessage = args.slice(1).join(' ') || '';
        } else {
            customMessage = args.join(' ') || '';
        }
    }

    if (!targetGroup.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 📱 GC STATUS 』───⟢\n│ ❌ Not a valid group JID.\n│\n│ 💡 Usage: .gcstatus <group_jid> [message]\n│ 💡 Or use inside the target group\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
        return;
    }

    const senderJid = message.key.participant || message.key.remoteJid;
    const check = await isAdmin(sock, targetGroup, senderJid);
    if (!check.isSenderAdmin && !message.key.fromMe) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ ADMIN ONLY 』───⟢\n│ You must be admin in that group.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
        return;
    }

    if (!check.isBotAdmin) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ BOT NOT ADMIN 』───⟢\n│ Bot must be admin in that group.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
        return;
    }

    let mediaType = null;
    let mediaData = null;

    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
        if (quotedMsg.imageMessage) mediaType = 'image';
        else if (quotedMsg.videoMessage) mediaType = 'video';
        else if (quotedMsg.audioMessage) mediaType = 'audio';
    }

    if (!mediaType && !customMessage.trim()) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 📱 GC STATUS 』───⟢\n│ 📌 Usage:\n│ • .gcstatus <group_jid> [message]\n│ • Reply to media with .gcstatus [message]\n│ • Use inside target group\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
        return;
    }

    let groupName = targetGroup;
    try {
        const metadata = await sock.groupMetadata(targetGroup);
        groupName = metadata.subject;
    } catch {}

    await sock.sendMessage(chatId, { react: { text: '📱', key: message.key } });

    try {
        let statusPayload = {};

        if (mediaType) {
            const quotedMsg = message.message.extendedTextMessage.contextInfo;
            const quotedId = quotedMsg.stanzaId;
            const quotedParticipant = quotedMsg.participant || senderJid;

            const mediaBuffer = await downloadMediaMessage(
                { key: { remoteJid: chatId, id: quotedId, participant: quotedParticipant }, message: message.message.extendedTextMessage.contextInfo.quotedMessage },
                'buffer',
                {},
                { logger: pino({ level: 'silent' }) }
            );

            if (!mediaBuffer || mediaBuffer.length === 0) throw new Error('Failed to download media');

            let mediaObj = {};
            if (mediaType === 'image') mediaObj = { image: mediaBuffer, caption: customMessage || '' };
            else if (mediaType === 'video') mediaObj = { video: mediaBuffer, caption: customMessage || '' };
            else if (mediaType === 'audio') mediaObj = { audio: mediaBuffer, mimetype: 'audio/mp4', ptt: false };

            const prepared = await prepareWAMessageMedia(mediaObj, { upload: sock.waUploadToServer });
            let headerObj = {};
            if (mediaType === 'image') headerObj = { imageMessage: prepared.imageMessage };
            else if (mediaType === 'video') headerObj = { videoMessage: prepared.videoMessage };
            else if (mediaType === 'audio') headerObj = { audioMessage: prepared.audioMessage };

            statusPayload = { viewOnceMessage: { message: { ...headerObj } } };
        } else if (customMessage.trim()) {
            const bgColor = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
            statusPayload = {
                groupStatusMessageV2: {
                    message: {
                        extendedTextMessage: {
                            text: customMessage,
                            backgroundArgb: 0xff000000 + parseInt(bgColor, 16),
                            font: 2,
                            textArgb: 0xffffffff
                        }
                    }
                }
            };
        }

        const msg = generateWAMessageFromContent(targetGroup, statusPayload, { userJid: sock.user.id });
        await sock.relayMessage(targetGroup, msg.message, { messageId: msg.key.id });

        await sock.sendMessage(chatId, {
            text: `╭─── 『 ✅ STATUS SET 』───⟢\n│ Group: ${groupName}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[GCStatus] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `╭─── 『 ❌ FAILED 』───⟢\n│ Failed to set status for ${groupName}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = gcstatus;