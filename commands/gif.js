// commands/gif.js - GIF Search and Converter
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
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

async function gifCommand(sock, chatId, message, args) {
    try {
        const config = require('../config');
        const apiKey = config.giphy_key;

        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg?.videoMessage) {
            await sock.sendMessage(chatId, { react: { text: '🎬', key: message.key } });

            const quotedId = message.message.extendedTextMessage.contextInfo.stanzaId;
            const quotedParticipant = message.message.extendedTextMessage.contextInfo.participant || message.key.remoteJid;

            const mediaBuffer = await downloadMediaMessage(
                { key: { remoteJid: chatId, id: quotedId, participant: quotedParticipant || undefined }, message: quotedMsg },
                'buffer', {}, { logger: console }
            );

            const videoBuffer = Buffer.from(mediaBuffer);
            const inputPath = path.join(TMP_DIR, `gif_input_${Date.now()}.mp4`);
            const outputPath = path.join(TMP_DIR, `gif_output_${Date.now()}.gif`);

            fs.writeFileSync(inputPath, videoBuffer);
            await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

            await execPromise(`ffmpeg -i "${inputPath}" -vf "fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${outputPath}"`);

            const gifBuffer = fs.readFileSync(outputPath);
            if (gifBuffer && gifBuffer.length > 0) {
                await sock.sendMessage(chatId, {
                    video: gifBuffer, mimetype: 'video/mp4',
                    caption: `╭─── ⪨ 🎬 GIF ⪩───⟢\n│ Video converted to GIF!\n╰────────────⟢\n> © DarkNode MD`,
                    gifPlayback: true, ...channelInfo
                }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            } else {
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            }
            try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch {}
            return;
        }

        const query = args?.join(' ')?.trim();
        if (!query) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🎬 GIF ⪩───⟢\n│ 📌 Usage:\n│ • .gif <search> - Search GIF\n│ • Reply to video with .gif - Convert to GIF\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        const searchRes = await axios.get('https://api.giphy.com/v1/gifs/search', {
            params: { api_key: apiKey, q: query, limit: 1, rating: 'g' }, timeout: 10000
        });

        const gifUrl = searchRes.data?.data?.[0]?.images?.original?.url;

        if (gifUrl) {
            await sock.sendMessage(chatId, {
                video: { url: gifUrl }, mimetype: 'video/mp4',
                caption: `╭─── ⪨ 🎬 GIF ⪩───⟢\n│ 🔍 ${query}\n╰────────────⟢\n> © DarkNode MD`,
                gifPlayback: true, ...channelInfo
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } else {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        }

    } catch (error) {
        console.error('[GIF] Error:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = gifCommand;