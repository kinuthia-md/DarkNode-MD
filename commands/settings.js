// commands/settings.js - Bot Settings
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

async function settingsCommand(sock, chatId, message) {
    try {
        const settingsText = `╭─── ⪨ ⚙️ SETTINGS ⪩───⟢\n│\n│ 📋 Current Settings:\n│\n│ 👑 Owner: ${settings.ownerNumber}\n│ 📢 Channel: ${settings.channelLink || 'Not set'}\n│ 📰 Newsletter: ${settings.newsletterName || 'Not set'}\n│\n│ 💡 Use .settings <option> <value>\n╰────────────⟢\n\n> *© DarkNode MD*`;

        await sock.sendMessage(chatId, {
            text: settingsText,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Settings] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to load settings.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = settingsCommand;