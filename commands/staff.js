// commands/staff.js - Group Staff List
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

async function staffCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ GROUPS ONLY ⪩───⟢\n│ This command is for groups only.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '👥', key: message.key } });

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];

        const admins = participants.filter(p => p.admin !== null);
        const owner = participants.find(p => p.id === groupMetadata.owner);

        let staffText = `╭─── ⪨ 👥 GROUP STAFF ⪩───⟢\n│\n│ 👑 Owner:\n│ ${owner?.id?.split('@')[0] || 'Unknown'}\n│\n│ 👮 Admins (${admins.length}):\n│`;

        admins.slice(0, 10).forEach((admin, i) => {
            const role = admin.admin === 'superadmin' ? 'Super Admin' : 'Admin';
            staffText += `\n│ ${i + 1}. ${admin.id.split('@')[0]} [${role}]`;
        });

        if (admins.length > 10) {
            staffText += `\n│ ... and ${admins.length - 10} more`;
        }

        staffText += `\n╰────────────⟢\n\n> *© DarkNode MD*`;

        await sock.sendMessage(chatId, {
            text: staffText,
            ...channelInfo
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Staff] Error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = staffCommand;