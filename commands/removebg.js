// commands/removebg.js - Background Remover
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
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

const TMP_DIR = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

async function removebgCommand(sock, chatId, message) {
    try {
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg?.imageMessage) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🖼️ REMOVE BG ⪩───⟢\n│ 📌 Reply to an image with .removebg\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🖼️', key: message.key } });

        const quotedId = message.message.extendedTextMessage.contextInfo.stanzaId;
        const quotedParticipant = message.message.extendedTextMessage.contextInfo.participant || message.key.remoteJid;

        const mediaBuffer = await downloadMediaMessage(
            { key: { remoteJid: chatId, id: quotedId, participant: quotedParticipant || undefined }, message: quotedMsg },
            'buffer', {}, { logger: console }
        );

        const inputPath = path.join(TMP_DIR, `removebg_input_${Date.now()}.jpg`);
        fs.writeFileSync(inputPath, Buffer.from(mediaBuffer));

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        // Use remove.bg API (placeholder - requires API key)
        const formData = new FormData();
        formData.append('image_file', fs.createReadStream(inputPath));
        formData.append('size', 'auto');

        const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
            headers: { ...formData.getHeaders(), 'X-Api-Key': 'YOUR_API_KEY' },
            responseType: 'arraybuffer'
        });

        const outputPath = path.join(TMP_DIR, `removebg_output_${Date.now()}.png`);
        fs.writeFileSync(outputPath, Buffer.from(response.data));

        await sock.sendMessage(chatId, {
            image: fs.readFileSync(outputPath),
            caption: `╭─── ⪨ 🖼️ REMOVE BG ⪩───⟢\n│ Background removed\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

        try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch {}

    } catch (error) {
        console.error('[RemoveBG] Error:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = removebgCommand;