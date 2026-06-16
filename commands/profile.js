// commands/profile.js - User Profile Info
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

async function profileCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const userNumber = senderId.split('@')[0];

        let profilePic;
        try {
            profilePic = await sock.profilePictureUrl(senderId, 'image');
        } catch {
            profilePic = 'https://i.ibb.co/2YX1pVx/default-avatar.png';
        }

        const text = `╭─── ⪨ 👤 PROFILE ⪩───⟢\n│\n│ 📱 Number: ${userNumber}\n│ 🆔 JID: ${senderId}\n│\n│ 📸 Profile picture included\n╰────────────⟢\n\n> *© DarkNode MD*`;

        await sock.sendMessage(chatId, {
            image: { url: profilePic },
            caption: text,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Profile] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to fetch profile.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = profileCommand;