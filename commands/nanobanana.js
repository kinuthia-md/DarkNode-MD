// commands/nanobanana.js - Image Undress Effect
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const settings = require('../settings');
const execPromise = util.promisify(exec);

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

async function nanobananaCommand(sock, chatId, message) {
    try {
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg?.imageMessage) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🍌 NANO BANANA ⪩───⟢\n│ 📌 Reply to an image with .nanobanana\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🍌', key: message.key } });

        const quotedId = message.message.extendedTextMessage.contextInfo.stanzaId;
        const quotedParticipant = message.message.extendedTextMessage.contextInfo.participant || message.key.remoteJid;

        const mediaBuffer = await downloadMediaMessage(
            { key: { remoteJid: chatId, id: quotedId, participant: quotedParticipant || undefined }, message: quotedMsg },
            'buffer', {}, { logger: console }
        );

        const inputPath = path.join(TMP_DIR, `nanobanana_input_${Date.now()}.jpg`);
        const outputPath = path.join(TMP_DIR, `nanobanana_output_${Date.now()}.jpg`);

        fs.writeFileSync(inputPath, Buffer.from(mediaBuffer));

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        // Apply blur and pixelation effect
        await execPromise(`ffmpeg -i "${inputPath}" -vf "boxblur=5:1,eq=brightness=0.05:contrast=1.1" "${outputPath}"`);

        const resultBuffer = fs.readFileSync(outputPath);
        if (resultBuffer && resultBuffer.length > 0) {
            await sock.sendMessage(chatId, {
                image: resultBuffer,
                caption: `╭─── ⪨ 🍌 NANO BANANA ⪩───⟢\n│ Effect applied\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } else {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        }

        try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch {}

    } catch (error) {
        console.error('[NanoBanana] Error:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = nanobananaCommand;