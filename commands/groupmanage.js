// commands/groupmanage.js - Group Management Commands
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
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

async function ensureGroupAndAdmin(sock, chatId, senderJid) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ GROUP ONLY 』───⟢\n│ This command can only be used in groups.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        });
        return { ok: false };
    }

    const isAdmin = require('../lib/isAdmin');
    const check = await isAdmin(sock, chatId, senderJid);

    if (!check.isBotAdmin) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ BOT NOT ADMIN 』───⟢\n│ Bot must be admin to manage the group.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        });
        return { ok: false };
    }

    if (!check.isSenderAdmin) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ ADMIN ONLY 』───⟢\n│ Only group admins can use this command.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        });
        return { ok: false };
    }

    return { ok: true };
}

async function setGroupDescription(sock, chatId, senderJid, newDesc, quotedMsg) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderJid);
    if (!check.ok) return;

    const desc = (newDesc || '').trim();
    if (!desc) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ USAGE 』───⟢\n│ 📌 .setdesc <description>\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: quotedMsg });
        return;
    }

    try {
        await sock.groupUpdateDescription(chatId, desc);
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ✅ UPDATED 』───⟢\n│ Group description updated.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: quotedMsg });
    } catch {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ FAILED 』───⟢\n│ Failed to update group description.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: quotedMsg });
    }
}

async function setGroupName(sock, chatId, senderJid, newName, quotedMsg) {
    const messages = {
        empty: '╭─── 『 ❌ USAGE 』───⟢\n│ 📌 .setname <new name>\n╰────────────⟢\n> © DarkNode MD',
        success: '╭─── 『 ✅ UPDATED 』───⟢\n│ Group name updated.\n╰────────────⟢\n> © DarkNode MD',
        error: '╭─── 『 ❌ FAILED 』───⟢\n│ Failed to update group name.\n╰────────────⟢\n> © DarkNode MD'
    };

    const check = await ensureGroupAndAdmin(sock, chatId, senderJid);
    if (!check.ok) return;

    const name = (newName || '').trim();
    if (!name) {
        await sock.sendMessage(chatId, { text: messages.empty, ...channelInfo }, { quoted: quotedMsg });
        return;
    }

    try {
        await sock.groupUpdateSubject(chatId, name);
        await sock.sendMessage(chatId, { text: messages.success, ...channelInfo }, { quoted: quotedMsg });
    } catch {
        await sock.sendMessage(chatId, { text: messages.error, ...channelInfo }, { quoted: quotedMsg });
    }
}

async function setGroupPhoto(sock, chatId, senderJid, quotedMsg) {
    const messages = {
        noImage: '╭─── 『 ❌ NO IMAGE 』───⟢\n│ Reply to an image to set as group photo.\n╰────────────⟢\n> © DarkNode MD',
        type: 'image',
        success: '╭─── 『 ✅ UPDATED 』───⟢\n│ Group photo updated.\n╰────────────⟢\n> © DarkNode MD',
        error: '╭─── 『 ❌ FAILED 』───⟢\n│ Failed to update group photo.\n╰────────────⟢\n> © DarkNode MD'
    };

    const check = await ensureGroupAndAdmin(sock, chatId, senderJid);
    if (!check.ok) return;

    const quotedMessage = quotedMsg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quotedMessage?.imageMessage || quotedMessage?.videoMessage;

    if (!imageMsg) {
        await sock.sendMessage(chatId, { text: messages.noImage, ...channelInfo }, { quoted: quotedMsg });
        return;
    }

    try {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const stream = await downloadContentFromMessage(imageMsg, messages.type);
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        const filePath = path.join(tmpDir, `groupphoto_${Date.now()}.jpg`);
        fs.writeFileSync(filePath, buffer);

        await sock.updateProfilePicture(chatId, { url: filePath });

        try { fs.unlinkSync(filePath); } catch {}

        await sock.sendMessage(chatId, { text: messages.success, ...channelInfo }, { quoted: quotedMsg });
    } catch {
        await sock.sendMessage(chatId, { text: messages.error, ...channelInfo }, { quoted: quotedMsg });
    }
}

module.exports = { setGroupDescription, setGroupName, setGroupPhoto };