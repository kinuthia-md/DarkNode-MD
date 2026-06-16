// commands/bugmenu.js
const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');
const moment = require('moment-timezone');

// Fake contact
const fakeMeta = {
    key: {
        participant: settings.ownerNumber + '@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: 'BUGMENU_META_' + Date.now()
    },
    message: {
        contactMessage: {
            displayName: settings.botName,
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${settings.botName};;;;\nFN:${settings.botName}\nTEL;waid=${settings.ownerNumber}:+${settings.ownerNumber}\nEND:VCARD`,
            sendEphemeral: true
        }
    },
    pushName: settings.botName
};

async function bugmenuCommand(sock, chatId, message) {
    try {
        // Owner-only
        if (!message.key.fromMe) {
            await sock.sendMessage(chatId, { text: "❌ *Owner Only Command*" }, { quoted: message });
            return;
        }

        const botName = settings.botName || 'DARKNODE MD';
        const version = settings.version || '1.0';

        const menu = `🦇 *${botName} v${version} - 𝗕𝗨𝗚 𝗠𝗘𝗡𝗨* 🦇

╭━━━━━━✧ 𝗦𝗜𝗡𝗚𝗟𝗘 𝗧𝗔𝗥𝗚𝗘𝗧 ✧━━━━━╮
┃ 🦇 .404invis <number>
┃ 📄 .404blank <number>
┃ 🚜 .404dozer <number>
┃ ⚡ .404proto <number>
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━✧ 𝗚𝗥𝗢𝗨𝗣 𝗠𝗔𝗦𝗦𝗔𝗖𝗥𝗘 ✧━━━╮
┃ 💀 .groupkill <group_jid>
┃ 💀 .groupkill (inside target group)
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━✧ 𝗘𝗫𝗣𝗟𝗢𝗜𝗧 𝗘𝗙𝗙𝗘𝗖𝗧𝗦 ✧━━━━╮
┃ 🦇 𝗜𝗻𝘃𝗶𝘀 → 𝗔𝘂𝗱𝗶𝗼 + 𝟯𝟬𝗸 𝗺𝗲𝗻𝘁𝗶𝗼𝗻𝘀
┃ 📄 𝗕𝗹𝗮𝗻𝗸 → 𝗦𝗰𝗿𝗲𝗲𝗻 𝗳𝗿𝗲𝗲𝘇𝗲
┃ 🚜 𝗗𝗼𝘇𝗲𝗿 → 𝗦𝘁𝗶𝗰𝗸𝗲𝗿 + 𝟰𝟬𝗸 𝗺𝗲𝗻𝘁𝗶𝗼𝗻𝘀
┃ ⚡ 𝗣𝗿𝗼𝘁𝗼 → 𝗩𝗶𝗱𝗲𝗼 𝗰𝗵𝗮𝗶𝗻 𝗼𝘃𝗲𝗿𝗹𝗼𝗮𝗱
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━✧ 𝗪𝗔𝗥𝗡𝗜𝗡𝗚 ✧━━━━━━╮
┃ ⚠️ 𝗙𝗢𝗥  𝗧𝗘𝗦𝗧𝗜𝗡𝗚 𝗢𝗡𝗟𝗬
┃ ⚠️ 𝗢𝘄𝗻𝗲𝗿 𝗼𝗻𝗹𝘆 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

> *© ${botName} v${version}*`;

        await sock.sendMessage(chatId, { react: { text: "🦇", key: message.key } });

        await sock.sendMessage(chatId, {
            document: Buffer.from(menu, 'utf-8'),
            mimetype: 'application/rar',
            fileName: `${botName}_bugmenu.Von`,
            fileLength: 99999999999999999,
            caption: menu,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363426838586273@newsletter',
                    newsletterName: '404R>Society',
                    serverMessageId: 13
                }
            }
        }, { quoted: fakeMeta });

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('[BugMenu] Error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { text: "❌ Error loading bug menu." }, { quoted: message });
    }
}

module.exports = bugmenuCommand;