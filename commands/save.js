// commands/save.js - Save Media
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
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

async function saveCommand(sock, chatId, message) {
    try {
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 💾 SAVE ⪩───⟢\n│ 📌 Reply to media to save it\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '💾', key: message.key } });

        const quotedId = message.message.extendedTextMessage.contextInfo.stanzaId;
        const quotedParticipant = message.message.extendedTextMessage.contextInfo.participant || message.key.remoteJid;

        let mediaType = null;
        let caption = '';
        let mimeType = '';

        if (quotedMsg.imageMessage) {
            mediaType = 'image';
            caption = quotedMsg.imageMessage.caption || 'Saved Image';
            mimeType = quotedMsg.imageMessage.mimetype || 'image/jpeg';
        } else if (quotedMsg.videoMessage) {
            mediaType = 'video';
            caption = quotedMsg.videoMessage.caption || 'Saved Video';
            mimeType = quotedMsg.videoMessage.mimetype || 'video/mp4';
        } else if (quotedMsg.audioMessage) {
            mediaType = 'audio';
            mimeType = quotedMsg.audioMessage.mimetype || 'audio/mpeg';
        } else if (quotedMsg.documentMessage) {
            mediaType = 'document';
            caption = quotedMsg.documentMessage.fileName || 'Saved File';
            mimeType = quotedMsg.documentMessage.mimetype || 'application/octet-stream';
        } else {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        const mediaBuffer = await downloadMediaMessage(
            { key: { remoteJid: chatId, id: quotedId, participant: quotedParticipant || undefined }, message: quotedMsg },
            'buffer', {}, { logger: console }
        );

        if (!mediaBuffer) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        if (mediaType === 'image') {
            await sock.sendMessage(chatId, {
                image: mediaBuffer,
                caption: `╭─── ⪨ 💾 SAVED ⪩───⟢\n│ ${caption}\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
        } else if (mediaType === 'video') {
            await sock.sendMessage(chatId, {
                video: mediaBuffer,
                caption: `╭─── ⪨ 💾 SAVED ⪩───⟢\n│ ${caption}\n╰────────────⟢\n> © DarkNode MD`,
                mimetype: mimeType,
                ...channelInfo
            }, { quoted: message });
        } else if (mediaType === 'audio') {
            await sock.sendMessage(chatId, {
                audio: mediaBuffer,
                mimetype: mimeType,
                ...channelInfo
            }, { quoted: message });
        } else if (mediaType === 'document') {
            await sock.sendMessage(chatId, {
                document: mediaBuffer,
                fileName: caption,
                mimetype: mimeType,
                ...channelInfo
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Save] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = saveCommand;