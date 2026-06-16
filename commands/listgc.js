// commands/listgc.js - List All Groups
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

async function listgcCommand(sock, chatId, message) {
    try {
        const groups = await sock.groupFetchAllParticipating();
        const groupList = Object.values(groups).slice(0, 20);

        if (groupList.length === 0) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ 📋 GROUP LIST ⪩───⟢\n│ No groups found.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        const text = `╭─── ⪨ 📋 GROUP LIST ⪩───⟢\n│ 📊 Total: ${groupList.length} groups\n│\n${groupList.map((g, i) => `│ ${i + 1}. ${g.subject}\n│    JID: ${g.id}`).join('\n│\n')}\n╰────────────⟢\n\n> *© DarkNode MD*`;

        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });

    } catch (error) {
        console.error('[ListGC] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to fetch groups.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = listgcCommand;