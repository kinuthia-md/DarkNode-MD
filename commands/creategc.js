// commands/creategc.js
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
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

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.jpg');

async function creategc(sock, chatId, message, args) {
    try {
        const groupName = args.join(' ') || 'DarkNode MD Group';
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || message;

        // Extract members from replied vCard
        let members = [];
        try {
            const buffer = await downloadMediaMessage({
                key: {
                    remoteJid: chatId,
                    id: message.message?.extendedTextMessage?.contextInfo?.stanzaId,
                    participant: message.message?.extendedTextMessage?.contextInfo?.participant
                },
                message: quoted
            }, 'buffer', {}, { logger: console });

            if (buffer) {
                const vcardStr = buffer.toString();
                const telRegex = /TEL(?:;[^:]*)?:(?:\+)?([\d\s\-()]+)/g;
                let match;
                while ((match = telRegex.exec(vcardStr)) !== null) {
                    let number = match[1].replace(/[\s\-()]/g, '');
                    if (number.length > 5) {
                        if (number.startsWith('+')) number = number.substring(1);
                        if (!number.includes('@s.whatsapp.net')) number += '@s.whatsapp.net';
                        members.push(number);
                    }
                }
            }
        } catch (e) {
            // No vCard - try to parse numbers from args
            const numRegex = /\b\d{7,15}\b/g;
            const nums = groupName.match(numRegex);
            if (nums) {
                for (const n of nums) {
                    members.push(n + '@s.whatsapp.net');
                }
            }
        }

        if (members.length === 0) {
            members.push(settings.ownerNumber + '@s.whatsapp.net');
        }

        members = [...new Set(members)];

        await sock.sendMessage(chatId, { react: { text: '🔧', key: message.key } });

        // Create the group
        const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        const createResult = await sock.groupCreate(groupName, [botJid]);
        const groupJid = createResult.id;
        const inviteCode = await sock.groupInviteCode(groupJid);

        // Add members
        let added = 0;
        try {
            const addResults = await sock.groupParticipantsUpdate(groupJid, members, 'add');
            if (Array.isArray(addResults)) {
                added = addResults.filter(r => r.status === '200').length;
            }
        } catch (e) {
            console.error('[CREATEGC] Error adding members:', e.message);
        }

        // Set group profile picture with bot logo
        try {
            if (fs.existsSync(LOGO_PATH)) {
                const logoBuffer = fs.readFileSync(LOGO_PATH);
                await sock.updateProfilePicture(groupJid, logoBuffer);
            }
        } catch (e) {
            console.error('[CREATEGC] Error setting profile pic:', e.message);
        }

        // Set group description
        try {
            const desc = `╔══════════════════╗\n   ${groupName}\n   Powered by DarkNode MD\n╚══════════════════╝\n\n📢 Channel: ${settings.channelLink}\n🤖 Bot: ${settings.botName}\n\n> © DarkNode MD`;
            await sock.groupUpdateDescription(groupJid, desc);
        } catch (e) {
            console.error('[CREATEGC] Error setting description:', e.message);
        }

        // Send success message
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
        const successText = `╭─── 『 ✅ GROUP CREATED 』───⟢
│ 📛 Name: ${groupName}
│ 👥 Members: ${added}/${members.length}
│ 🔗 ${inviteLink}
╰────────────⟢
> © DarkNode MD`;

        await sock.sendMessage(chatId, {
            text: successText,
            ...channelInfo
        }, { quoted: fakeMeta });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (e) {
        console.error('[CREATEGC] Error:', e.message);
        try {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            await sock.sendMessage(chatId, {
                text: `╭─── 『 ❌ ERROR 』───⟢
│ ❌ ${e.message}
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
        } catch {}
    }
}

module.exports = creategc;