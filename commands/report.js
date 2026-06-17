// commands/report.js - Report User
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

async function reportCommand(sock, chatId, message, args) {
    try {
        const reason = args?.join(' ')?.trim();

        if (!reason) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🚨 REPORT ⪩───⟢\n│ 📌 Usage: .report <reason>\n│ 💡 Report a user\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const senderId = message.key.participant || message.key.remoteJid;

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🚨 REPORT ⪩ ───⟢\n│ ✅ Report submitted!\n│\n│ 📱 From: ${senderId.split('@')[0]}\n│ 📝 Reason: ${reason}\n│\n│ Thank you for reporting.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Report] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to submit report.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = reportCommand;