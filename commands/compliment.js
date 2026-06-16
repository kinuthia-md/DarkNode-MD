// commands/compliment.js
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

const compliments = [
    "You have the most infectious laugh I've ever heard 😄",
    "Your creativity is absolutely inspiring! 🎨",
    "You light up every room you walk into ✨",
    "Your kindness knows no bounds 💖",
    "You're braver than you believe and stronger than you seem 🦁",
    "Your smile can literally brighten anyone's day 😊",
    "You have such a beautiful soul 🌟",
    "Your passion is contagious! 🔥",
    "You're one in a million 💎",
    "The world is better with you in it 🌍",
    "You have a heart of gold 💛",
    "Your positivity is refreshing ☀️",
    "You're an amazing listener 👂",
    "Your intelligence shines through everything you do 💡",
    "You make the impossible look easy 💪",
    "Your warmth and compassion are truly special 🤗",
    "You have a beautiful way with words 📝",
    "Your determination is admirable 🏆",
    "You bring out the best in everyone around you 🌈",
    "You're absolutely irreplaceable 👑"
];

async function complimentCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '💕', key: message.key } });

        const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

        const response = `╭─── 『 💕 COMPLIMENT 』───⟢
│ ${randomCompliment}
╰────────────⟢
> © DarkNode MD`;

        await sock.sendMessage(chatId, {
            text: response,
            ...channelInfo
        }, { quoted: fakeMeta });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Compliment error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── 『 ❌ ERROR 』───⟢
│ ❌ Failed to generate compliment.
╰────────────⟢
> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = { complimentCommand };