// commands/convert.js
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
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

function execPromise(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { timeout: 60000 }, (err, stdout, stderr) => {
            if (err) reject(err);
            else resolve(stdout);
        });
    });
}

function getTempPath(ext) {
    return path.join(os.tmpdir(), 'conv_' + Date.now() + '.' + ext);
}

async function convertCommand(sock, chatId, message, args) {
    try {
        const input = args.join(' ').trim();
        if (!input) {
            const usage = `╭─── ⪨ 🔄 CONVERT ⪩───⟢
│ 📌 *Usage:*
│ ♧ .to sticker  — image/video → sticker
│ ♧ .to image    — sticker → image
│ ♧ .to video    — sticker/audio → video
│ ♧ .to audio    — video → MP3
│ ♧ .to voicenote — audio → voice note
│ ♧ .to videonote — video → video note
│ ♧ .to resize   — image → 512x512
╰────────────⟢
> © DarkNode MD`;
            return await sock.sendMessage(chatId, {
                text: usage,
                ...channelInfo
            }, { quoted: fakeMeta });
        }

        const targetFormat = input.toLowerCase().split(' ')[0];
        const validFormats = ['sticker', 'image', 'video', 'audio', 'voicenote', 'videonote', 'resize'];
        if (!validFormats.includes(targetFormat)) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ ❌ INVALID FORMAT ⪩───⟢
│ ❌ Unknown format: ${targetFormat}
│ 📌 Use: ${validFormats.join(', ')}
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ ❌ NO MEDIA ⪩───⟢
│ ❌ Reply to a media message to convert it.
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        const buffer = await downloadMediaMessage({
            key: message.message.extendedTextMessage.contextInfo.stanzaId
                ? {
                    remoteJid: chatId,
                    id: message.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: message.message.extendedTextMessage.contextInfo.participant
                }
                : message.key,
            message: quoted
        }, 'buffer', {}, { logger: console });

        if (!buffer) throw new Error('Failed to download media');

        let inputPath, outputPath, mime;

        if (targetFormat === 'sticker') {
            inputPath = getTempPath('tmp');
            outputPath = getTempPath('webp');
            fs.writeFileSync(inputPath, buffer);
            await execPromise(`ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -c:v libwebp -lossless 0 -qscale 50 -preset default -loop 0 -an -vsync 0 "${outputPath}"`);
            const webpBuffer = fs.readFileSync(outputPath);
            await sock.sendMessage(chatId, { sticker: webpBuffer, ...channelInfo }, { quoted: fakeMeta });
        }

        else if (targetFormat === 'image') {
            inputPath = getTempPath('webp');
            outputPath = getTempPath('png');
            fs.writeFileSync(inputPath, buffer);
            await execPromise(`ffmpeg -y -i "${inputPath}" "${outputPath}"`);
            const imgBuffer = fs.readFileSync(outputPath);
            await sock.sendMessage(chatId, { image: imgBuffer, caption: '> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
        }

        else if (targetFormat === 'video') {
            inputPath = getTempPath('webp');
            outputPath = getTempPath('mp4');
            fs.writeFileSync(inputPath, buffer);
            await execPromise(`ffmpeg -y -i "${inputPath}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outputPath}"`);
            const vidBuffer = fs.readFileSync(outputPath);
            await sock.sendMessage(chatId, { video: vidBuffer, caption: '> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
        }

        else if (targetFormat === 'audio') {
            inputPath = getTempPath('tmp');
            outputPath = getTempPath('mp3');
            fs.writeFileSync(inputPath, buffer);
            await execPromise(`ffmpeg -y -i "${inputPath}" -vn -ab 128k -ar 44100 -f mp3 "${outputPath}"`);
            const audBuffer = fs.readFileSync(outputPath);
            await sock.sendMessage(chatId, {
                audio: audBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                ...channelInfo
            }, { quoted: fakeMeta });
        }

        else if (targetFormat === 'voicenote') {
            inputPath = getTempPath('tmp');
            outputPath = getTempPath('ogg');
            fs.writeFileSync(inputPath, buffer);
            await execPromise(`ffmpeg -y -i "${inputPath}" -c:a libopus -b:a 32k "${outputPath}"`);
            const oggBuffer = fs.readFileSync(outputPath);
            await sock.sendMessage(chatId, {
                audio: oggBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true,
                ...channelInfo
            }, { quoted: fakeMeta });
        }

        else if (targetFormat === 'videonote') {
            inputPath = getTempPath('tmp');
            outputPath = getTempPath('mp4');
            fs.writeFileSync(inputPath, buffer);
            await execPromise(`ffmpeg -y -i "${inputPath}" -c:v libx264 -pix_fmt yuv420p -vf "crop=min(iw\,ih):min(iw\,ih)" -movflags +faststart "${outputPath}"`);
            const vidBuffer = fs.readFileSync(outputPath);
            await sock.sendMessage(chatId, {
                video: vidBuffer,
                mimetype: 'video/mp4',
                ptt: true,
                ...channelInfo
            }, { quoted: fakeMeta });
        }

        else if (targetFormat === 'resize') {
            inputPath = getTempPath('tmp');
            outputPath = getTempPath('jpg');
            fs.writeFileSync(inputPath, buffer);
            await execPromise(`ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" "${outputPath}"`);
            const imgBuffer = fs.readFileSync(outputPath);
            await sock.sendMessage(chatId, { image: imgBuffer, caption: '> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
        }

        // Cleanup temp files
        try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
        try { if (outputPath) fs.unlinkSync(outputPath); } catch {}

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Convert] Error:', error.message);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢
│ ❌ Conversion failed: ${error.message}
╰────────────⟢
> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = convertCommand;