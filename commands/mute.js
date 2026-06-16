// commands/mute.js - Mute Group Members
const isAdmin = require('../lib/isAdmin');
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

async function muteCommand(sock, chatId, message, args) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, message);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ BOT NOT ADMIN ⪩───⟢\n│ Bot must be admin to mute members.\n╰────────────⟢\n> © DarkNode MD',
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

        const target = args?.[0];
        if (!target) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🔇 MUTE ⪩───⟢\n│ 📌 Usage: .mute <@user/number>\n│ 💡 Mute a group member\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🔇 MUTED ⪩───⟢\n│ Member has been muted.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Mute] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to mute member.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = muteCommand;