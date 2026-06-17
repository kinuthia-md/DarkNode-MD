// commands/shayari.js - Shayari Messages
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

async function shayariCommand(sock, chatId, message) {
    try {
        const shayaris = [
            '💕 "Mohabbat mein nahi hai koi reet, jo aaye bas ek baar usse pyar ho jata hai"',
            '🌸 "Dil se jo baat nahi nikalti, woh aankhon se aa jaati hai"',
            '🌹 "Pyar woh nahi jo mehboob ko mile, pyar woh hai ki mehboob ko khush rakhne ki aadat ho jaye"'
        ];
        const shayari = shayaris[Math.floor(Math.random() * shayaris.length)];

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 📝 SHAYARI ⪩───⟢\n│ ${shayari}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[Shayari] Error:', error);
    }
}

module.exports = shayariCommand;