// commands/fact.js - Random Fun Fact
const axios = require('axios');
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

module.exports = async function(sock, chatId, message) {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
        const fact = response.data.text;

        await sock.sendMessage(chatId, {
            text: `╭─── 『 🧠 RANDOM FACT 』───⟢\n│ ${fact}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
    } catch (error) {
        console.error('Error fetching fact:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ ERROR 』───⟢\n│ Failed to fetch fact.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: fakeMeta });
    }
};