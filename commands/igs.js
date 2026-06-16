// commands/igs.js - IGS Processing Tool
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

async function igsCommand(sock, chatId, message, args) {
    try {
        const text = args?.join(' ')?.trim();

        if (!text) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🔧 IGS ⪩───⟢\n│ 📌 Usage: .igs <text>\n│ 💡 IGS processing tool\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        // Process text - convert to uppercase and add formatting
        const processed = text.toUpperCase().split('').join(' ');

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🔧 IGS ⪩───⟢\n│ *Input:* ${text}\n│ *Output:* ${processed}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[IGS] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to process.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = igsCommand;