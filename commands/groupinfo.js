// commands/groupinfo.js - Group Information
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

async function groupInfoCommand(sock, chatId, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        let groupPic;

        try {
            groupPic = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            groupPic = 'https://i.ibb.co/2YX1pVx/default-group.png';
        }

        const members = groupMetadata.participants;
        const admins = members.filter(m => m.admin);
        const adminList = admins.map((a, i) => `│ ♧ @${a.id.split('@')[0]}`).join('\n');

        const owner = groupMetadata.owner || members.find(m => m.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        const caption = `╭─── ⪨ 📊 GROUP INFO ⪩───⟢\n│\n│ 📌 *JID:* ${groupMetadata.id}\n│ 📝 *Name:* ${groupMetadata.subject}\n│\n│ 👥 *Members:* ${members.length}\n│\n│ 👑 *Owner:*\n│ ♧ @${owner.split('@')[0]}\n│\n│ 🛡️ *Admins:*\n${adminList || '│ No admins found'}\n│\n│ 📋 *Description:*\n│ ${groupMetadata.desc?.toString() || 'No description set'}\n╰────────────⟢\n\n> *© DarkNode MD*`;

        const mentions = [...admins.map(a => a.id), owner];
        await sock.sendMessage(chatId, {
            image: { url: groupPic },
            caption,
            mentions,
            ...channelInfo
        });

    } catch (error) {
        console.error('[GroupInfo] Error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to get group info: ${error.message}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        });
    }
}

module.exports = groupInfoCommand;