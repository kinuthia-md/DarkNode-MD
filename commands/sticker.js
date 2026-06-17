// commands/sticker.js - Sticker Maker
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
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

const TMP_DIR = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

async function stickerCommand(sock, chatId, message) {
    try {
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg?.imageMessage && !quotedMsg?.videoMessage) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🎨 STICKER ⪩───⟢\n│ 📌 Reply to an image/video\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });

        const quotedId = message.message.extendedTextMessage.contextInfo.stanzaId;
        const quotedParticipant = message.message.extendedTextMessage.contextInfo.participant || message.key.remoteJid;

        const mediaBuffer = await downloadMediaMessage(
            { key: { remoteJid: chatId, id: quotedId, participant: quotedParticipant || undefined }, message: quotedMsg },
            'buffer', {}, { logger: console }
        );

        const inputPath = path.join(TMP_DIR, `sticker_${Date.now()}.webp`);
        
        // Convert to webp using sharp if available
        try {
            const sharp = require('sharp');
            const isVideo = !!quotedMsg.videoMessage;
            const ext = isVideo ? 'mp4' : 'jpg';
            const tempInput = path.join(TMP_DIR, `sticker_input_${Date.now()}.${ext}`);
            fs.writeFileSync(tempInput, Buffer.from(mediaBuffer));
            
            await sharp(tempInput)
                .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 90 })
                .toFile(inputPath);
            
            fs.unlinkSync(tempInput);
        } catch (e) {
            // Fallback: send as image if sharp fails
            await sock.sendMessage(chatId, {
                image: mediaBuffer,
                caption: `╭─── ⪨ 🎨 STICKER ⪩───⟢\n│ Sticker ready (image fallback)\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            return;
        }

        await sock.sendMessage(chatId, {
            sticker: fs.readFileSync(inputPath),
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

        try { fs.unlinkSync(inputPath); } catch {}

    } catch (error) {
        console.error('[Sticker] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = stickerCommand;