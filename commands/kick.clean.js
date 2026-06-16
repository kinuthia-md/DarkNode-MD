// ============================================
//  Kick Module - Advanced Version
//  Features:
//  - Animated countdown (edits same message)
//  - No message spam
//  - Kickall support (kicks non-admins)
//  - Self-protection (can't kick bot/owner)
//  - Warning system before kick
//  - Reason support
// ============================================

const isAdmin = require('../lib/isAdmin');
const fs = require('fs');
const path = require('path');
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

// Utility helpers (embedded - no external lib dependency)
const COUNTDOWN_EMOJIS = ['5️⃣', '4️⃣', '3️⃣', '2️⃣', '1️⃣', '🚀'];

function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

async function safeEdit(sock, chatId, key, text) {
    try {
        await sock.sendMessage(chatId, { text, edit: key }, {});
        return true;
    } catch {
        return false;
    }
}

function toJid(j) {
    if (!j) return null;
    const s = String(j);
    if (s.includes('@')) return s;
    return s.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
}

/**
 * Advanced animated countdown consolidated into a SINGLE message.
 * Shows warning → countdown → result all by editing the same message.
 */
async function kickWithAnimatedCountdown({
    sock,
    chatId,
    targetJids,
    senderId,
    quotedMessage,
    reason = 'Violation',
}) {
    if (!Array.isArray(targetJids) || targetJids.length === 0) return;

    const uniqueTargets = [...new Set(targetJids)];
    const targetDisplay = uniqueTargets.map(j => '@' + j.split('@')[0]).join(', ');
    const mentions = uniqueTargets;

    // ─── STEP 1: Send initial warning message ───
    const warnText = `╭─── 『 ⚠️ KICK INITIATED 』───⟢\n│ 👤 Targets: ${targetDisplay}\n│ 📋 Reason: ${reason}\n│ ⏳ Countdown starting...\n╰────────────⟢\n> © DarkNode MD`;

    let mainKey = null;
    try {
        const mainMsg = await sock.sendMessage(chatId, {
            text: warnText,
            mentions
        }, quotedMessage ? { quoted: quotedMessage } : undefined);
        mainKey = mainMsg?.key;
    } catch (e) {
        console.error('Failed to send initial kick message:', e);
        return;
    }

    // ─── STEP 2: Animated countdown (edits same message) ───
    for (let i = 0; i < COUNTDOWN_EMOJIS.length; i++) {
        await delay(500);
        if (mainKey) {
            const countText = `╭─── 『 💥 REMOVING ${COUNTDOWN_EMOJIS[i]} 』───⟢\n│ 👤 Targets: ${targetDisplay}\n│ 📋 Reason: ${reason}\n│ 🚀 Action: Kick\n│ ⏳ ${COUNTDOWN_EMOJIS[i]}\n╰────────────⟢\n> © DarkNode MD`;
            await safeEdit(sock, chatId, mainKey, countText);
        }
    }

    // ─── STEP 3: Execute the kick ───
    try {
        // Kick all targets at once
        await sock.groupParticipantsUpdate(chatId, uniqueTargets, 'remove');
        console.log(`✅ Kicked ${uniqueTargets.length} member(s) from ${chatId}`);

        // Update the message to success
        if (mainKey) {
            const successText = `╭─── 『 ✅ KICK SUCCESSFUL 』───⟢\n│ 👤 Targets: ${targetDisplay}\n│ 📋 Reason: ${reason}\n│ ✅ Successfully removed ${uniqueTargets.length} member(s)\n╰────────────⟢\n> © DarkNode MD`;
            await safeEdit(sock, chatId, mainKey, successText);
        }
    } catch (e) {
        console.error('Kick execution failed:', e);
        if (mainKey) {
            const failText = `╭─── 『 ❌ KICK FAILED 』───⟢\n│ 👤 Targets: ${targetDisplay}\n│ 📋 Reason: ${reason}\n│ ❌ Error: ${e.message}\n╰────────────⟢\n> © DarkNode MD`;
            await safeEdit(sock, chatId, mainKey, failText);
        } else {
            await sock.sendMessage(chatId, {
                text: `╭─── 『 ❌ KICK FAILED 』───⟢\n│ ❌ Error: ${e.message}\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
        }
    }
}

/**
 * Kick all non-admin members from the group
 */
async function kickAllCommand(sock, chatId, message, reason = 'Mass Kick') {
    try {
        const groupMeta = await sock.groupMetadata(chatId);
        const participants = groupMeta.participants;

        // Get bot's JID
        const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';

        // Filter out admins, bot itself, and owner
        const nonAdmins = participants.filter(p => {
            const isAdmin = p.admin === 'admin' || p.admin === 'superadmin';
            const isBot = p.id === botJid;
            return !isAdmin && !isBot;
        });

        const targetJids = nonAdmins.map(p => p.id);

        if (targetJids.length === 0) {
            await sock.sendMessage(chatId, {
                text: '╭─── 『 ❌ KICKALL 』───⟢\n│ ❌ No non-admin members to kick.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        await kickWithAnimatedCountdown({
            sock,
            chatId,
            targetJids,
            quotedMessage: message,
            reason: `${reason} (${targetJids.length} members)`
        });
    } catch (e) {
        console.error('kickAllCommand error:', e);
        await sock.sendMessage(chatId, {
            text: `╭─── 『 ❌ KICKALL FAILED 』───⟢\n│ ❌ ${e.message}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
    }
}

/**
 * Main kick command handler
 * Only works in groups. Requires mentioned user OR replied-to message.
 */
async function kickCommand(sock, chatId, senderId, mentionedJidListKick, message) {
    try {
        // ─── Build target list: mentions OR quoted message participant ───
        const mentioned = (mentionedJidListKick || []).map(toJid).filter(Boolean);
        const reason = 'Violation';

        // Get quoted (replied-to) message sender JID
        let quotedParticipantJid = null;
        try {
            const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
            if (quotedParticipant) {
                quotedParticipantJid = toJid(quotedParticipant);
            }
        } catch (e) {}

        // Combine mentions + quoted participant (deduplicate)
        const targets = new Set();
        for (const jid of mentioned) targets.add(jid);
        if (quotedParticipantJid) targets.add(quotedParticipantJid);
        const targetJids = [...targets];

        // ─── Group-only guard ───
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: '╭─── 『 ❌ KICK 』───⟢\n│ 👥 This command can only be used in groups.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        // Check admin status
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: '╭─── 『 ❌ KICK 』───⟢\n│ 🤖 Bot needs to be an admin first.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        if (!isSenderAdmin && !message?.key?.fromMe) {
            await sock.sendMessage(chatId, {
                text: '╭─── 『 ❌ KICK 』───⟢\n│ 👤 Only group admins can use this command.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        // If no targets (no mention AND no reply), show error - never auto-kickAll
        if (!targetJids || targetJids.length === 0) {
            await sock.sendMessage(chatId, {
                text: '╭─── 『 ❌ KICK 』───⟢\n│ ⚠️ Please mention a user or reply to a message to kick.\n│ 📌 Usage: .kick @user\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        // Filter out protected users (bot itself and owner)
        const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        const protectedJids = new Set([botJid]);

        // Check if owner is in the list
        const ownerData = JSON.parse(fs.readFileSync('./data/owner.json', 'utf8'));
        const ownerNumbers = Array.isArray(ownerData) ? ownerData : [ownerData];
        for (const owner of ownerNumbers) {
            const ownerJid = (typeof owner === 'string' ? owner : owner.number || '') + '@s.whatsapp.net';
            protectedJids.add(ownerJid);
        }

        const filteredTargets = targetJids.filter(j => !protectedJids.has(j));

        if (filteredTargets.length === 0) {
            await sock.sendMessage(chatId, {
                text: '╭─── 『 ❌ KICK 』───⟢\n│ ❌ Cannot kick bot owner or protected users.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        await kickWithAnimatedCountdown({
            sock,
            chatId,
            targetJids: filteredTargets,
            senderId,
            quotedMessage: message,
            reason
        });

    } catch (e) {
        console.error('kick.clean error:', e);
        try {
            await sock.sendMessage(chatId, {
                text: '╭─── 『 ❌ KICK FAILED 』───⟢\n│ ❌ An error occurred.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
        } catch { }
    }
}

module.exports = kickCommand;