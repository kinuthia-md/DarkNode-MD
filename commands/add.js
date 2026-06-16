/**
 * DarkNode MD - Add Member Command
 * Adds a user to the current group via mention, reply, or phone number.
 * Copyright (c) 2026 404R>Society
 * 
 * Usage:
 *   .add @user         — Mention the user to add
 *   .add 2547XXXXXXXX  — Provide phone number directly
 *   Reply to a user's message with .add
 */

const settings = require('../settings');

/**
 * Newsletter context for all outgoing messages
 */
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363426838586273@newsletter',
            newsletterName: 'DarkNode MD',
            serverMessageId: 13
        }
    }
};

/**
 * Fake metadata for enhanced message presentation
 */
const fakeMeta = {
    key: {
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: 'DARKNODE_ADD_' + Date.now()
    },
    message: {
        contactMessage: {
            displayName: 'DARKNODE MD',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:DARKNODE MD;;;;\nFN:DARKNODE MD\nTEL;waid=254794119486:+254 794 119 486\nEND:VCARD`,
            sendEphemeral: true
        }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: 'DARKNODE MD'
};

/**
 * Sanitize and extract a phone number from various input formats.
 * @param {string} input - Raw input string
 * @returns {string|null} - Cleaned number or null
 */
function extractNumber(input) {
    if (!input) return null;
    const cleaned = input.replace(/[^0-9]/g, '');
    return cleaned.length > 0 ? cleaned : null;
}

/**
 * Add a user to the current group.
 * Works by:
 *   1. Mentioning a user in the command
 *   2. Replying to a user's message
 *   3. Providing a phone number directly
 * 
 * @param {object} sock - WhatsApp socket instance
 * @param {string} chatId - Current chat ID
 * @param {object} message - The message object
 * @param {string[]} args - Command arguments (phone numbers)
 */
async function addCommand(sock, chatId, message, args) {
    try {
        // ─── Validate group context ─────────────────────────────────────
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: '❌ This command can only be used in groups.',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        // ─── Owner number (the bot itself) ───────────────────────────────
        const botOwnerNumber = (settings.ownerNumber || '254794119486').replace(/[^0-9]/g, '');

        // ─── Extract the sender's number ─────────────────────────────────
        const senderId = message.key.participant || message.key.remoteJid;
        const senderNumber = senderId.split('@')[0].replace(/[^0-9]/g, '');

        // ─── Block non-owner from adding themselves ──────────────────────
        if (senderNumber !== botOwnerNumber && !message.key.fromMe) {
            await sock.sendMessage(chatId, {
                text: '❌ Only the bot owner can use this command.',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        // ─── Extract target number ───────────────────────────────────────
        let targetNumber = null;

        // Method 1: Reply to a user's message (quoted participant)
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        if (quotedParticipant) {
            targetNumber = quotedParticipant.split('@')[0].replace(/[^0-9]/g, '');
        }

        // Method 2: Mentioned users
        if (!targetNumber) {
            const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentionedJid.length > 0) {
                targetNumber = mentionedJid[0].split('@')[0].replace(/[^0-9]/g, '');
            }
        }

        // Method 3: Phone number from arguments
        if (!targetNumber && args && args.length > 0) {
            const cleaned = extractNumber(args[0]);
            if (cleaned && /^\d+$/.test(cleaned)) {
                targetNumber = cleaned;
            }
        }

        // No target found — send usage instructions
        if (!targetNumber) {
            const usage = `➕ *Add Member to Group*

*Usage:*
  .add @user       — Mention the user
  .add 2547XXXXXXX — Provide phone number
  Reply .add       — Reply to a user's message

*Example:*
  .add 254794119486`;

            await sock.sendMessage(chatId, {
                text: usage,
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        // ─── Build the full JID ─────────────────────────────────────────
        const targetJid = targetNumber + '@s.whatsapp.net';

        // ─── Send reaction ──────────────────────────────────────────────
        await sock.sendMessage(chatId, { react: { text: '➕', key: message.key } });

        // ─── Attempt to add the user ────────────────────────────────────
        await sock.groupParticipantsUpdate(chatId, [targetJid], 'add');

        // ─── Success message ────────────────────────────────────────────
        const successMsg = `✅ *Successfully added user*

👤 Number: ${targetNumber}
📍 Group: ${chatId.split('@')[0]}

> *DarkNode MD — 404R>Society*`;

        await sock.sendMessage(chatId, {
            text: successMsg,
            mentions: [targetJid],
            ...channelInfo
        }, { quoted: fakeMeta });

        // ─── Final reaction ─────────────────────────────────────────────
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[Add Command] Error:', error.message);

        // Send error reaction
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });

        // Send error message
        let errorText = '❌ *Failed to add user.*';

        if (error.message?.includes('not-authorized')) {
            errorText = '❌ Bot is not authorized to add members. Make sure the bot is an admin.';
        } else if (error.message?.includes('already-exists') || error.message?.includes('already_in_group')) {
            errorText = '❌ User is already in the group.';
        } else if (error.message?.includes('numbers-changed') || error.message?.includes('privacy')) {
            errorText = '❌ Cannot add this user due to privacy settings.';
        } else if (error.message?.includes('group-full')) {
            errorText = '❌ Group is full. Cannot add more members.';
        }

        await sock.sendMessage(chatId, {
            text: errorText,
            ...channelInfo
        }, { quoted: fakeMeta });
    }
}

module.exports = addCommand;