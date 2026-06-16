// ============================================
//  Antilink Module - Clean Version
//  Blocks links in groups with 3-warning system
//  Countdown via emoji animation before kick
// ============================================

const fs = require('fs');
const path = require('path');
const { isJidGroup } = require('@whiskeysockets/baileys');
const { getAntilink, setAntilink, removeAntilink, incrementWarningCount, resetWarningCount, isSudo } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const { kickWithWarningsAndCountdown } = require('../lib/emoji_countdown_kicker');
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

const CONFIG_PATH = path.join(process.cwd(), 'data', 'antilinkSettings.json');

// Stats tracker
const stats = {
    linksDeleted: 0,
    warningsIssued: 0,
    kicksPerformed: 0,
    lastKickTime: null
};

// Load antilink settings from file
function loadSettings() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading antilink settings:', e.message);
    }
    return {};
}

// Save antilink settings
function saveSettings(settings) {
    try {
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error('Error saving antilink settings:', e.message);
    }
}

// Link detection patterns
const LINK_PATTERNS = {
    whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
    whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
    telegram: /t\.me\/[A-Za-z0-9_]+/i,
    allLinks: /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i
};

// Format message with nice borders
function formatMessage(title, body, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌', config: '⚙️' };
    const icon = icons[type] || 'ℹ️';
    return `╭─── 『 ${icon} ${title} 』───⟢\n│\n${body}\n│\n╰──────────⟢\n> © DarkNode MD`;
}

// Use fakeMeta for all command responses (shows contact card)
function quoteCmd(originalMessage) {
    return fakeMeta;
}

// Get the antilink action for a group
async function getAntilinkSetting(groupId) {
    try {
        const data = await getAntilink(groupId, 'on');
        return data ? data.action : null;
    } catch (e) {
        return null;
    }
}

// Handle .antilink command
async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, quotedMessage) {
    try {
        if (!isSenderAdmin) {
            const msg = formatMessage('ADMIN ONLY', '│ ❌ This command is for admins only.', 'warn');
            await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(prefix.length).trim().split(/\s+/);
        const action = args[0] === 'antilink' ? args[1] : args[0];

        if (!action) {
            const currentSetting = await getAntilinkSetting(chatId);
            const status = currentSetting ? '✅ ON' : '❌ OFF';
            const currentAction = currentSetting || 'Not set';
            
            const body = `│ 📊 *Status:* ${status}\n│ ⚙️ *Action:* ${currentAction}\n│\n│ 📝 *Usage:*\n│ • \`.antilink on\` - Enable\n│ • \`.antilink off\` - Disable\n│ • \`.antilink set <delete|kick|warn>\` - Set action\n│ • \`.antilink get\` - View status\n│\n│ 📊 *Stats:*\n│ 🗑️ Deleted: ${stats.linksDeleted}\n│ ⚠️ Warnings: ${stats.warningsIssued}\n│ 👢 Kicks: ${stats.kicksPerformed}`;
            const msg = formatMessage('ANTILINK SYSTEM', body, 'config');
            await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
            return;
        }

        switch (action.toLowerCase()) {
            case 'on': {
                const existing = await getAntilink(chatId, 'on');
                if (existing && existing.enabled) {
                    const body = `│ ✅ Antilink is already *ON*\n│ ⚙️ Current action: ${existing.action || 'delete'}`;
                    const msg = formatMessage('ALREADY ACTIVE', body, 'info');
                    await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
                    return;
                }
                const result = await setAntilink(chatId, 'on', 'delete');
                if (result) {
                    const body = `│ ✅ Antilink is now *ENABLED*\n│ ⚙️ Default action: *delete*\n│\n│ Use \`.antilink set <action>\` to change\n│ Available: delete, kick, warn (3 warnings then kick)`;
                    const msg = formatMessage('ANTILINK ACTIVATED', body, 'success');
                    await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
                } else {
                    const body = '│ ❌ Failed to enable antilink.\n│ 🔧 Please try again or check permissions.';
                    const msg = formatMessage('FAILED', body, 'error');
                    await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
                }
                break;
            }

            case 'off': {
                await removeAntilink(chatId, 'on');
                const body = '│ ✅ Antilink is now *DISABLED*\n│ All links will be allowed.';
                const msg = formatMessage('ANTILINK DEACTIVATED', body, 'warn');
                await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
                break;
            }

            case 'set': {
                const setAction = args[2];
                if (!setAction || !['delete', 'kick', 'warn'].includes(setAction)) {
                    const body = `│ ❌ Invalid action: *${setAction || 'none'}*\n│ ✅ Choose: delete, kick, or warn`;
                    const msg = formatMessage('INVALID ACTION', body, 'error');
                    await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
                    return;
                }
                const result = await setAntilink(chatId, 'on', setAction);
                if (result) {
                    const actionIcons = { delete: '🗑️', kick: '👢', warn: '⚠️' };
                    const body = `│ ${actionIcons[setAction]} Action updated to: *${setAction}*\n│ 🔰 New settings saved successfully.`;
                    const msg = formatMessage('ANTILINK UPDATED', body, 'success');
                    await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
                } else {
                    const body = '│ ❌ Failed to update action.\n│ 🔧 Please try again.';
                    const msg = formatMessage('UPDATE FAILED', body, 'error');
                    await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
                }
                break;
            }

            case 'get': {
                const setting = await getAntilink(chatId, 'on');
                const status = setting ? '✅' : '❌';
                const actionIcons = { delete: '🗑️', kick: '👢', warn: '⚠️' };
                const actionIcon = actionIcons[setting?.action] || '❓';
                const body = `│ ${status} *Status:* ${setting ? 'ON' : 'OFF'}\n│ ${actionIcon} *Action:* ${setting?.action || 'Not set'}\n│\n│ 📊 *Stats Summary:*\n│ 🗑️ Deleted: ${stats.linksDeleted}\n│ ⚠️ Warnings: ${stats.warningsIssued}\n│ 👢 Kicks: ${stats.kicksPerformed}`;
                const msg = formatMessage('ANTILINK STATUS', body, 'info');
                await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
                break;
            }

            default: {
                const body = `│ ❌ Unknown action: *${action}*\n│\n│ 📝 *Try:*\n│ • \`.antilink on\`\n│ • \`.antilink off\`\n│ • \`.antilink set <delete|kick|warn>\`\n│ • \`.antilink get\``;
                const msg = formatMessage('UNKNOWN COMMAND', body, 'error');
                await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
            }
        }
    } catch (e) {
        console.error('handleAntilinkCommand error:', e);
        const msg = formatMessage('ERROR', '│ ❌ An error occurred.\n│ 🔧 Please try again.', 'error');
        await sock.sendMessage(chatId, { text: msg, ...channelInfo }, { quoted: fakeMeta });
    }
}

// Handle link detection and action
async function handleLinkDetection(sock, chatId, message, messageText, senderId) {
    try {
        // Get current antilink setting for this group
        const antilinkData = await getAntilink(chatId, 'on');
        if (!antilinkData || !antilinkData.enabled) return;

        const action = antilinkData.action || 'delete';
        
        // Check if message has links
        let detected = false;
        let linkType = '';

        // Determine what to check based on action type
        if (action === 'delete' || action === 'kick' || action === 'warn') {
            // Check all link types
            if (LINK_PATTERNS.whatsappGroup.test(messageText)) {
                detected = true;
                linkType = 'WhatsApp Group';
            } else if (LINK_PATTERNS.whatsappChannel.test(messageText)) {
                detected = true;
                linkType = 'WhatsApp Channel';
            } else if (LINK_PATTERNS.telegram.test(messageText)) {
                detected = true;
                linkType = 'Telegram';
            } else if (LINK_PATTERNS.allLinks.test(messageText)) {
                detected = true;
                linkType = 'External Link';
            }
        }

        if (!detected) return;

        console.log(`🔗 Link detected in ${chatId}: ${linkType} from ${senderId}`);

        // Delete the message first
        try {
            const msgKey = message.key;
            await sock.sendMessage(chatId, { delete: msgKey });
            stats.linksDeleted++;
            console.log(`✅ Link message deleted from ${senderId}.`);
        } catch (deleteErr) {
            console.error('Failed to delete message:', deleteErr.message);
        }

        // Determine the action emoji
        const actionEmoji = action === 'delete' ? '🗑️' : action === 'kick' ? '👢' : '⚠️';

        // Build warning body
        let warnBody = `│ 👤 *User:* @${senderId.split('@')[0]}\n│ 🔗 *Link Type:* ${linkType}\n│ ${actionEmoji} *Action:* ${action}`;

        if (action === 'warn') {
            // Increment warning count
            const warningCount = await incrementWarningCount(chatId, senderId);
            stats.warningsIssued++;

            const WARN_LIMIT = 3;
            warnBody += `\n│ ⚠️ *Warning:* ${warningCount}/${WARN_LIMIT}`;

            // Send the warning message
            const warnMsg = formatMessage('⚠️ LINK DETECTED', warnBody, 'warn');
            await sock.sendMessage(chatId, { text: warnMsg, mentions: [senderId] });

            if (warningCount >= WARN_LIMIT) {
                // Use the emoji countdown kicker
                stats.kicksPerformed++;
                await kickWithWarningsAndCountdown({
                    sock,
                    chatId,
                    targetJids: [senderId],
                    senderId,
                    quotedMessage: message,
                    reason: 'Sending links (3 warnings)',
                    warnings: 1, // Skip extra warnings since we already warned 3 times
                    countdownEmojis: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
                });
                await resetWarningCount(chatId, senderId);
            }
        } else if (action === 'kick') {
            stats.kicksPerformed++;
            // Send warning first
            warnBody += '\n│ 👢 User will be removed...';
            const warnMsg = formatMessage('🚫 LINK VIOLATION', warnBody, 'warn');
            await sock.sendMessage(chatId, { text: warnMsg, mentions: [senderId] });

            // Use emoji countdown kicker
            await kickWithWarningsAndCountdown({
                sock,
                chatId,
                targetJids: [senderId],
                senderId,
                quotedMessage: message,
                reason: 'Sending links',
                warnings: 1,
                countdownEmojis: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
            });
        } else {
            // delete action - just delete and warn
            warnBody += '\n│ Message has been deleted.';
            const warnMsg = formatMessage('🚫 LINK DETECTED', warnBody, 'warn');
            await sock.sendMessage(chatId, { text: warnMsg, mentions: [senderId] });
        }

        stats.lastKickTime = new Date().toISOString();

    } catch (e) {
        console.error('handleLinkDetection error:', e);
    }
}

// Get stats
function getAntilinkStats() {
    return { ...stats };
}

// Reset stats
function resetAntilinkStats() {
    stats.linksDeleted = 0;
    stats.warningsIssued = 0;
    stats.kicksPerformed = 0;
    stats.lastKickTime = null;
    return true;
}

console.log(`
╔═══════════════════════╗
║   🔰 ANTILINK MODULE  ║
║   Status: Initializing...
║   Version: 2.0
║   ▶ By: DarkNode MD
╚═══════════════════════╝
`);

module.exports = {
    handleAntilinkCommand,
    handleLinkDetection,
    getAntilinkStats,
    resetAntilinkStats
};