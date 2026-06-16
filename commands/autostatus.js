// ============================================
//  AutoStatus Module
//  Automatically views status updates and
//  reacts with custom emojis when enabled
// ============================================

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'autoStatus.json');
const STATUS_JID = 'status@broadcast';

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

if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig = { enabled: false, react: true };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
}

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


async function autoStatusCommand(sock, chatId, message, args) {
    try {
        const isOwner = message.key.fromMe;

        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '╭─── 『 ❌ AUTO STATUS 』───⟢\n│ 👤 Only the bot owner can use this.\n╰────────────⟢\n> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
            return;
        }

        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

        if (!args || args.length === 0) {
            const status = config.enabled ? 'ON' : 'OFF';
            const reactStatus = config.react ? 'ON' : 'OFF';
            await sock.sendMessage(chatId, { text: `╭─── 『 ℹ️ AUTO STATUS 』───⟢\n│ 📱 Status: *${status}*\n│ 💫 React: *${reactStatus}*\n│ 📌 Usage:\n│   .autostatus on/off\n│   .autostatus react on/off\n╰────────────⟢\n> © DarkNode MD`, ...channelInfo }, { quoted: fakeMeta });
            return;
        }

        const sub = args[0].toLowerCase();

        if (sub === 'on') {
            config.enabled = true;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            await sock.sendMessage(chatId, { text: '╭─── 『 ✅ AUTO STATUS 』───⟢\n│ 📱 Auto-status is now *ON*\n│ 👁️ Bot will view all statuses\n╰────────────⟢\n> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
        } else if (sub === 'off') {
            config.enabled = false;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            await sock.sendMessage(chatId, { text: '╭─── 『 ✅ AUTO STATUS 』───⟢\n│ 📱 Auto-status is now *OFF*\n╰────────────⟢\n> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
        } else if (sub === 'react') {
            const reactSub = args[1] ? args[1].toLowerCase() : null;
            if (!reactSub || (reactSub !== 'on' && reactSub !== 'off')) {
                await sock.sendMessage(chatId, { text: '╭─── 『 ❌ AUTO STATUS 』───⟢\n│ ⚠️ Usage: .autostatus react on/off\n╰────────────⟢\n> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
                return;
            }
            config.react = reactSub === 'on';
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            const reactStatus = config.react ? 'ON' : 'OFF';
            await sock.sendMessage(chatId, { text: `╭─── 『 ✅ AUTO STATUS 』───⟢\n│ 💫 Reactions are now *${reactStatus}*\n╰────────────⟢\n> © DarkNode MD`, ...channelInfo }, { quoted: fakeMeta });
        } else {
            await sock.sendMessage(chatId, { text: `╭─── 『 ❌ AUTO STATUS 』───⟢\n│ ⚠️ Unknown option: ${sub}\n│ 📌 Usage:\n│   .autostatus on/off\n│   .autostatus react on/off\n╰────────────⟢\n> © DarkNode MD`, ...channelInfo }, { quoted: fakeMeta });
        }
    } catch (e) {
        console.error('❌ AutoStatus command error:', e);
        try { await sock.sendMessage(chatId, { text: `╭─── 『 ❌ ERROR 』───⟢\n│ ❌ ${e.message || 'Failed to process.'}\n╰────────────⟢\n> © DarkNode MD`, ...channelInfo }, { quoted: fakeMeta }); } catch {}
    }
}

function isAutoStatusEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        return config.enabled;
    } catch (e) {
        console.error('❌ Error checking auto status config:', e);
        return false;
    }
}

function isStatusReactionEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        return config.react;
    } catch (e) {
        return false;
    }
}

async function reactToStatus(sock, key) {
    if (!isStatusReactionEnabled()) return;
    try {
        const reactionEmojis = settings.reactEmojis || ['💚', '🤖', '🔥', '💯', '❤️', '👍'];
        const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        await sock.sendMessage(STATUS_JID, {
            react: {
                key: key,
                text: randomEmoji
            }
        });
    } catch (e) {
        console.error('❌ Error reacting to status:', e.message);
    }
}

async function handleStatusUpdate(sock, statusUpdate) {
    try {
        if (!isAutoStatusEnabled()) return;

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle messages array format
        if (statusUpdate.messages && statusUpdate.messages.length > 0) {
            const msg = statusUpdate.messages[0];
            if (msg.key && msg.key.remoteJid === STATUS_JID) {
                try {
                    await sock.readMessages([msg.key]);
                    await reactToStatus(sock, msg.key);
                } catch (e) {
                    if (e.message?.includes('rate-over')) {
                        console.warn('⚠️ Rate limit hit, waiting before retry...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await sock.readMessages([msg.key]);
                    } else {
                        throw e;
                    }
                }
                return;
            }
        }

        // Handle single key format
        if (statusUpdate.key && statusUpdate.key.remoteJid === STATUS_JID) {
            try {
                await sock.readMessages([statusUpdate.key]);
                await reactToStatus(sock, statusUpdate.key);
            } catch (e) {
                if (e.message?.includes('rate-over')) {
                    console.warn('⚠️ Rate limit hit, waiting...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([statusUpdate.key]);
                } else {
                    throw e;
                }
            }
            return;
        }

        // Handle reaction format
        if (statusUpdate.reaction && statusUpdate.reaction.key?.remoteJid === STATUS_JID) {
            try {
                await sock.readMessages([statusUpdate.reaction.key]);
                await reactToStatus(sock, statusUpdate.reaction.key);
            } catch (e) {
                if (e.message?.includes('rate-over')) {
                    console.warn('⚠️ Rate limit hit, waiting...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([statusUpdate.reaction.key]);
                }
            }
        }
    } catch (e) {
        console.error('❌ Error handling status update:', e.message);
    }
}

module.exports = {
    autoStatusCommand,
    handleStatusUpdate
};