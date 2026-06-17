// commands/setpp.js - Set Profile Picture
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

async function setProfilePicture(sock, chatId, message) {
    try {
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg?.imageMessage) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 📸 SET PP ⪩───⟢\n│ 📌 Reply to an image with .setpp\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '📸', key: message.key } });

        const quotedId = message.message.extendedTextMessage.contextInfo.stanzaId;
        const quotedParticipant = message.message.extendedTextMessage.contextInfo.participant || message.key.remoteJid;

        const mediaBuffer = await downloadMediaMessage(
            { key: { remoteJid: chatId, id: quotedId, participant: quotedParticipant || undefined }, message: quotedMsg },
            'buffer', {}, { logger: console }
        );

        const tempPath = path.join(TMP_DIR, `setpp_${Date.now()}.jpg`);
        fs.writeFileSync(tempPath, Buffer.from(mediaBuffer));

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        await sock.updateProfilePicture(sock.user.id, fs.readFileSync(tempPath));

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 📸 PP UPDATED ⪩───⟢\n│ Profile picture changed successfully!\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

        try { fs.unlinkSync(tempPath); } catch {}

    } catch (error) {
        console.error('[SetPP] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = setProfilePicture;