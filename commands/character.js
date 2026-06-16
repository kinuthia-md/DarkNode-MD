// commands/character.js
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

const DEFAULT_PIC = 'https://i.imgur.com/6xUZ1eg.jpeg';
const TRAITS = [
    'Adventurous', 'Ambitious', 'Determined', 'Brave', 'Charismatic',
    'Confident', 'Creative', 'Curious', 'Energetic', 'Faithful',
    'Fearless', 'Generous', 'Gentle', 'Honest', 'Humble',
    'Humorous', 'Intelligent', 'Kind', 'Loving', 'Optimistic',
    'Passionate', 'Patient', 'Reliable', 'Resilient', 'Romantic',
    'Sincere', 'Strong', 'Thoughtful', 'Versatile', 'Wise'
];

async function characterCommand(sock, chatId, message) {
    try {
        let targetJid = null;
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentioned?.length > 0) {
            targetJid = mentioned[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = message.message?.extendedTextMessage?.contextInfo?.participant;
        }

        if (!targetJid) {
            await sock.sendMessage(chatId, {
                text: `╭─── 『 🔮 CHARACTER 』───⟢
│ ⚠️ Reply to someone or mention them
│ 📌 Usage: .character @user
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        let profilePic = DEFAULT_PIC;
        try {
            profilePic = await sock.profilePictureUrl(targetJid, 'image');
        } catch { profilePic = DEFAULT_PIC; }

        const traitCount = Math.floor(Math.random() * 3) + 3;
        const selected = [];
        const shuffled = [...TRAITS].sort(() => Math.random() - 0.5);
        for (let i = 0; i < traitCount && i < shuffled.length; i++) {
            selected.push(shuffled[i]);
        }

        const traitsText = selected.map(t => {
            const perc = Math.floor(Math.random() * 29) + 60;
            return `│ ✨ ${t}: ${perc}%`;
        }).join('\n');

        const rating = Math.floor(Math.random() * 15) + 80;

        const result = `╭─── 『 🔮 CHARACTER ANALYSIS 』───⟢
│ 👤 *Target:* @${targetJid.split('@')[0]}
│
${traitsText}
│
│ ⭐ Overall Rating: *${rating}%*
╰────────────⟢
> © DarkNode MD`;

        const msg = await sock.sendMessage(chatId, {
            image: { url: profilePic },
            caption: result,
            mentions: [targetJid],
            ...channelInfo
        });

    } catch (e) {
        console.error('Character error:', e);
        try {
            await sock.sendMessage(chatId, {
                text: `╭─── 『 ❌ ERROR 』───⟢
│ ❌ Failed to analyze character.
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
        } catch {}
    }
}

module.exports = characterCommand;