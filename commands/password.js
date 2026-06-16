// commands/password.js - Password Generator
const crypto = require('crypto');
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

const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    special: '!@#$%^&*()-_=+[]{}|;:,.<>?'
};

function generatePassword(length, includeSpecial = true) {
    const chars = CHARS.upper + CHARS.lower + CHARS.numbers + (includeSpecial ? CHARS.special : '');
    const randomBytes = crypto.randomBytes(length);
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += chars[randomBytes[i] % chars.length];
    }
    return password;
}

function checkStrength(password) {
    let strength = 0;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    if (password.length >= 10) strength++;
    
    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return levels[strength] || 'Weak';
}

async function passwordCommand(sock, chatId, message, args) {
    try {
        const input = (args || []).join(' ').trim().split(/\s+/);
        let length = parseInt(input[0]) || 10;
        const includeSpecial = (input[1] || '').toLowerCase() !== 'false';
        
        length = Math.max(8, Math.min(length, 40));
        
        const password = generatePassword(length, includeSpecial);
        const strength = checkStrength(password);

        const text = `╭─── ⪨ 🔐 PASSWORD GENERATOR ⪩───⟢\n│\n│ 🔑 *Password:* \`${password}\`\n│\n│ 📏 *Length:* ${length}\n│ 💪 *Strength:* ${strength}\n│\n│ 💡 Usage: .password [length] [true/false]\n╰────────────⟢\n\n> *© DarkNode MD*`;

        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });

    } catch (error) {
        console.error('[Password] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to generate password.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = passwordCommand;