// commands/emojimix.js - Emoji Mix Command
const fetch = require('node-fetch');
const fs = require('fs');
const { exec } = require('child_process');
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

async function emojimixCommand(sock, chatId, message, args) {
    const input = message.message?.conversation?.trim() || 
                  message.message?.extendedTextMessage?.text?.trim() || '';
    const parts = input.split(' ').slice(1);

    if (!parts[0]) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 😎 EMOJI MIX 』───⟢\n│ 📌 Usage: .emojix 😎+🥰\n│ 💡 Combine two emojis with +\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: fakeMeta });
        return;
    }

    if (!input.includes('+')) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 😎 EMOJI MIX 』───⟢\n│ ⚠️ Use *+* sign between emojis\n│\n│ 📌 Example: .emojix 😎+🥰\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: fakeMeta });
        return;
    }

    const [emoji1, emoji2] = parts[0].split('+').map(e => e.trim());

    try {
        const apiUrl = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            await sock.sendMessage(chatId, {
                text: '╭─── 『 ❌ FAILED 』───⟢\n│ These emojis can\'t be mixed!\n│ 💡 Try different emojis\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        const mixUrl = data.results[0].media_formats.png_transparent.url;
        const outputPath = path.join(TMP_DIR, `emojimix_${Date.now()}.webp`);
        const inputPath = path.join(TMP_DIR, `emojimix_input_${Date.now()}.png`);

        const imgResponse = await fetch(mixUrl);
        const imgBuffer = await imgResponse.buffer();
        fs.writeFileSync(inputPath, imgBuffer);

        // Convert to webp using ffmpeg
        await new Promise((resolve, reject) => {
            exec(`ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -c:v libwebp -lossless 0 -qscale 50 -preset default -loop 0 -an -vsync 0 "${outputPath}"`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        if (!fs.existsSync(outputPath)) {
            throw new Error('Failed to create emoji mix');
        }

        const resultBuffer = fs.readFileSync(outputPath);
        await sock.sendMessage(chatId, {
            sticker: resultBuffer,
            ...channelInfo
        }, { quoted: fakeMeta });

        // Cleanup
        try {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        } catch (e) {}

    } catch (error) {
        console.error('[EmojiMix] Error:', error.message);
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ ERROR 』───⟢\n│ Failed to mix emojis.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: fakeMeta });
    }
}

module.exports = emojimixCommand;