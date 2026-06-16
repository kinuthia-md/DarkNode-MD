// commands/hidetag.js - Hidden Tag Command
const isAdmin = require('../lib/isAdmin');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
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

async function downloadMediaMessage(msg, type) {
    const stream = await downloadContentFromMessage(msg, type);
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    const filePath = path.join(__dirname, '..', 'tmp', Date.now() + '.' + type);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

async function hideTagCommand(sock, chatId, message, args, quotedMsg) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, message);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ BOT NOT ADMIN ⪩───⟢\n│ Bot must be admin to tag members.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ ADMIN ONLY ⪩───⟢\n│ Only admins can use this command.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const members = groupMetadata.participants || [];
        const nonAdmins = members.filter(m => !m.admin).map(m => m.id);

        const text = args?.join(' ') || '╭─── ⪨ 👻 HIDDEN TAG ⪩───⟢\n│ Tagging all members...\n╰────────────⟢\n> © DarkNode MD';

        if (quotedMsg?.imageMessage) {
            const filePath = await downloadMediaMessage(quotedMsg.imageMessage, 'image');
            await sock.sendMessage(chatId, {
                image: { url: filePath },
                caption: text,
                mentions: nonAdmins,
                ...channelInfo
            });
        } else if (quotedMsg?.videoMessage) {
            const filePath = await downloadMediaMessage(quotedMsg.videoMessage, 'video');
            await sock.sendMessage(chatId, {
                video: { url: filePath },
                caption: text,
                mentions: nonAdmins,
                ...channelInfo
            });
        } else if (quotedMsg?.conversation || quotedMsg?.extendedTextMessage) {
            await sock.sendMessage(chatId, {
                text: text,
                mentions: nonAdmins,
                ...channelInfo
            });
        } else if (quotedMsg?.documentMessage) {
            const filePath = await downloadMediaMessage(quotedMsg.documentMessage, 'document');
            await sock.sendMessage(chatId, {
                document: { url: filePath },
                fileName: quotedMsg.documentMessage.fileName || 'file',
                caption: text,
                mentions: nonAdmins,
                ...channelInfo
            });
        } else {
            await sock.sendMessage(chatId, {
                text: text,
                mentions: nonAdmins,
                ...channelInfo
            });
        }

    } catch (error) {
        console.error('[HideTag] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to hidden tag.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = hideTagCommand;