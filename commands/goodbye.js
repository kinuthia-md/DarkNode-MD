// commands/goodbye.js - Goodbye Message Handler
const { handleGoodbye } = require('../lib/welcome');
const { isGoodByeOn, getGoodbye } = require('../lib/index');
const fetch = require('node-fetch');
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

async function goodbyeCommand(sock, chatId, message, args) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
            text: '╭─── 『 ❌ GROUP ONLY 』───⟢\n│ This command can only be used in groups.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        });
        return;
    }

    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const commandArgs = text.split(' ').slice(1);
    await handleGoodbye(sock, chatId, message, commandArgs);
}

async function handleLeaveEvent(sock, groupJid, participants) {
    const isGoodbyeEnabled = await isGoodByeOn(groupJid);
    if (!isGoodbyeEnabled) return;

    const customMessage = await getGoodbye(groupJid);
    const groupMetadata = await sock.groupMetadata(groupJid);
    const groupName = groupMetadata.subject;

    for (const participant of participants) {
        try {
            const userId = typeof participant === 'string' ? participant : participant.id || participant.jid?.toString();
            const phoneNumber = userId.split('@')[0];
            let displayName = phoneNumber;

            try {
                const profile = await sock.onWhatsApp(userId);
                if (profile && profile[0]?.notify) displayName = profile[0].notify;
                else {
                    const member = groupMetadata.participants.find(p => p.id === userId);
                    if (member && member.notify) displayName = member.notify;
                }
            } catch {}

            let goodbyeText;
            if (customMessage) {
                goodbyeText = customMessage.replace(/{user}/g, '@' + displayName).replace(/{group}/g, groupName);
            } else {
                goodbyeText = `╭─── 『 👋 GOODBYE 』───⟢\n│ @${displayName} has left ${groupName}\n│ We'll miss you!\n╰────────────⟢\n> © DarkNode MD`;
            }

            let profilePic;
            try {
                profilePic = await sock.profilePictureUrl(userId, 'image');
            } catch {
                profilePic = 'https://i.ibb.co/2YX1pVx/default-avatar.png';
            }

            try {
                const imgUrl = `https://api.popcat.xyz/welcome?type=leave&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&membercount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePic)}`;
                const imgResponse = await fetch(imgUrl);
                if (imgResponse.ok) {
                    const imgBuffer = await imgResponse.buffer();
                    await sock.sendMessage(groupJid, {
                        image: imgBuffer, caption: goodbyeText, mentions: [userId], ...channelInfo
                    });
                    continue;
                }
            } catch {}

            await sock.sendMessage(groupJid, {
                text: goodbyeText, mentions: [userId], ...channelInfo
            });

        } catch (error) {
            console.error('[Goodbye] Error:', error);
            const userId = typeof participant === 'string' ? participant : participant.id || participant.jid?.toString();
            const phoneNumber = userId.split('@')[0];
            let fallbackText;
            if (customMessage) {
                fallbackText = customMessage.replace(/{user}/g, '@' + phoneNumber).replace(/{group}/g, groupName);
            } else {
                fallbackText = `╭─── 『 👋 GOODBYE 』───⟢\n│ @${phoneNumber} has left the group.\n╰────────────⟢\n> © DarkNode MD`;
            }
            await sock.sendMessage(groupJid, {
                text: fallbackText, mentions: [userId], ...channelInfo
            });
        }
    }
}

module.exports = { goodbyeCommand, handleLeaveEvent };