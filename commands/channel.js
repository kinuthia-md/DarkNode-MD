// commands/channel.js
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

function getChannelInviteCode(link) {
    try {
        let cleanLink = link.trim();
        cleanLink = cleanLink.split('?')[0].split('#')[0];
        try {
            const url = new URL(cleanLink);
            const parts = url.pathname.split('/').filter(Boolean);
            const code = parts[parts.length - 1];
            if (code && code.length > 0) return code;
        } catch (urlError) {}
        const patterns = [
            /(?:whatsapp\.com|wa\.me)\/channel\/([A-Za-z0-9]+)/i,
            /\/channel\/([A-Za-z0-9]+)/i,
            /channel\/([A-Za-z0-9]+)/i
        ];
        for (const pattern of patterns) {
            const match = cleanLink.match(pattern);
            if (match && match[1]) return match[1];
        }
        if (/^[A-Za-z0-9]+$/.test(cleanLink)) return cleanLink;
        return null;
    } catch (error) {
        console.error('Error extracting invite code:', error);
        return null;
    }
}

async function channelCommand(sock, chatId, message, args) {
    try {
        const input = args.trim();

        if (!input) {
            const usageMsg = `╭─── ⪨ 📢 CHANNEL INFO ⪩───⟢
│ 📢 *Get WhatsApp channel information!*
│
│ *Usage:* .channel <link or invite code>
│
│ *Examples:*
│ ♧ .channel https://whatsapp.com/channel/0029Vb8RuL91dAwCFOtTrG1X
│ ♧ .channel 0029Vb8RuL91dAwCFOtTrG1X
│ ♧ .channel 120363426838586273@newsletter
╰────────────⟢
> © DarkNode MD`;
            return await sock.sendMessage(chatId, {
                text: usageMsg,
                ...channelInfo
            }, { quoted: fakeMeta });
        }

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        const processingMsg = `╭─── ⪨ 🔍 FETCHING ⪩───⟢
│ 🔍 Fetching channel information...
│ 📌 *Input:* ${input}
╰────────────⟢
> © DarkNode MD`;

        await sock.sendMessage(chatId, {
            text: processingMsg,
            ...channelInfo
        }, { quoted: fakeMeta });

        let inviteCode = null;
        let channelJid = null;

        if (input.includes('@newsletter')) {
            channelJid = input;
            inviteCode = null;
        } else {
            inviteCode = getChannelInviteCode(input);
            if (!inviteCode) throw new Error('Could not extract invite code');
        }

        let newsletterInfo = null;

        try {
            if (inviteCode) {
                newsletterInfo = await sock.newsletterMetadata('invite', inviteCode);
            } else if (channelJid) {
                newsletterInfo = await sock.newsletterMetadata('get', channelJid);
            }
        } catch (fetchError) {
            let errorMessage = 'Could not fetch channel information.';
            if (fetchError.message.includes('Invalid channel link')) {
                errorMessage = 'Invalid channel link format!';
            } else if (fetchError.message.includes('Newsletter not found')) {
                errorMessage = 'Channel not found!';
            } else if (fetchError.message.includes('not-a-follower')) {
                errorMessage = 'Bot must follow the channel. Use .follow first.';
            }
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `╭─── ⪨ ❌ NOT FOUND ⪩───⟢
│ ❌ ${errorMessage}
│ 📌 *Input:* ${input}
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
        }

        if (!newsletterInfo) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, {
                text: `╭─── ⪨ ❌ NOT FOUND ⪩───⟢
│ ❌ Could not fetch channel information.
│ 📌 *Input:* ${input}
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
        }

        const newsletter = newsletterInfo;
        const actualJid = newsletter.id || (inviteCode ? `${inviteCode}@newsletter` : channelJid);
        const followerCount = newsletter.subscribers?.toLocaleString() || newsletter.subscriberCount?.toLocaleString() || '0';
        const verificationStatus = newsletter.verification === 'verified' ? '✅ Verified' :
            newsletter.verification === 'unverified' ? '❌ Unverified' : '⏳ Pending';

        let creationDate = 'N/A';
        if (newsletter.creationTime) {
            const date = new Date(newsletter.creationTime * 1000);
            creationDate = date.toLocaleDateString();
        }

        const channelInfoText = `╭━━⪨ *📢 Channel Information* ⪩━━┈⊷
┃ 📢 *Name:* ${newsletter.name || 'Unknown'}
┃ 🔢 *JID:* \`${actualJid}\`
┃ 🆔 *Invite Code:* \`${inviteCode || newsletter.invite || 'N/A'}\`
┃ 👥 *Subscribers:* ${followerCount}
┃ 📝 *Description:* ${newsletter.description || 'No description'}
┃ ✅ *Status:* ${verificationStatus}
┃ 📅 *Created:* ${creationDate}
┃ 🔗 *Invite Link:* https://whatsapp.com/channel/${inviteCode || actualJid.split('@')[0]}
╰━━━━━━━━━━━━━━━┈⊷
> © DarkNode MD`;

        if (newsletter.image || newsletter.picture) {
            try {
                const imageUrl = newsletter.image || newsletter.picture;
                await sock.sendMessage(chatId, {
                    image: { url: imageUrl },
                    caption: channelInfoText,
                    ...channelInfo
                }, { quoted: fakeMeta });
            } catch (imgError) {
                await sock.sendMessage(chatId, {
                    text: channelInfoText,
                    ...channelInfo
                }, { quoted: fakeMeta });
            }
        } else {
            await sock.sendMessage(chatId, {
                text: channelInfoText,
                ...channelInfo
            }, { quoted: fakeMeta });
        }

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🔢 CHANNEL JID ⪩───⟢
│ 🔢 *JID:* \`${actualJid}\`
│ 🆔 *Invite Code:* \`${inviteCode || newsletter.invite || 'N/A'}\`
│
│ 📋 Copy the JID above for use in commands.
╰────────────⟢
> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('❌ Channel Command Error:', error);
        try { await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }); } catch {}

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢
│ ❌ Failed to fetch channel information.
│ 🔧 ${error.message}
╰────────────⟢
> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
    }
}

module.exports = channelCommand;