// ============================================
//  Anticall Module - Fixed Version
//  Declines incoming calls and warns the caller
//  Sends only ONE message with countdown animation
// ============================================

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'data', 'anticall.json');

// Emoji countdown for call rejection
const CALL_REJECT_EMOJIS = ['📞', '🔇', '⏳', '❌'];

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

// Default config
function getDefaultConfig() {
    return { enabled: true, warnMessage: '⚠️ *Calls are not allowed!*\n\nPlease do not call the bot. Use messages only.\n\n_This is your last warning._' };
}

// Read anticall config
function readState() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            const def = getDefaultConfig();
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(def, null, 2));
            return def;
        }
        const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        return {
            enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
            warnMessage: data.warnMessage || getDefaultConfig().warnMessage
        };
    } catch (e) {
        return getDefaultConfig();
    }
}

// Write anticall config
function writeState(state) {
    try {
        if (!fs.existsSync(path.dirname(CONFIG_PATH))) {
            fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
        }
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(state, null, 2));
    } catch (e) {
        console.error('Failed to write anticall config:', e.message);
    }
}

// Command handler: .anticall on/off/status
async function anticallCommand(sock, chatId, message, args) {
    try {
        const state = readState();
        const input = (args || '').trim().toLowerCase();

        if (!input || input === 'status') {
            const statusText = state.enabled ? '✅ *ENABLED*' : '❌ *DISABLED*';
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🔰 ANTICALL ⪩───⟢\n│\n│ 📞 ${statusText}\n│\n│ 📝 *Commands:*\n│ • \`.anticall on\` - Enable\n│ • \`.anticall off\` - Disable\n│ • \`.anticall status\` - Check status\n│\n╰──────────⟢\n> © DarkNode MD`
            }, { quoted: message });
            return;
        }

        if (input === 'on') {
            state.enabled = true;
            writeState(state);
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ✅ ANTICALL ⪩───⟢\n│\n│ 📞 Anticall is now *ENABLED*\n│ Incoming calls will be declined\n│ and a warning will be sent.\n│\n╰──────────⟢\n> © DarkNode MD'
            }, { quoted: message });
        } else if (input === 'off') {
            state.enabled = false;
            writeState(state);
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❌ ANTICALL ⪩───⟢\n│\n│ 📞 Anticall is now *DISABLED*\n│ Calls will be allowed.\n│\n╰──────────⟢\n> © DarkNode MD'
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: '╭─── ⪨ ❓ ANTICALL ⪩───⟢\n│\n│ ❌ Unknown option: *' + input + '*\n│\n│ 📝 *Usage:*\n│ • \`.anticall on\` - Enable\n│ • \`.anticall off\` - Disable\n│ • \`.anticall status\` - Current status\n│\n╰──────────⟢\n> © DarkNode MD'
            }, { quoted: message });
        }
    } catch (e) {
        console.error('anticallCommand error:', e);
        await sock.sendMessage(chatId, { text: '❌ An error occurred while processing the command.' });
    }
}

// Handle incoming call event from Baileys
async function handleIncomingCall(sock, callData) {
    try {
        const state = readState();
        if (!state.enabled) return;

        if (!callData || !callData.from) return;

        const callerJid = callData.from;
        const callId = callData.id;
        const isVideo = callData.isVideo || false;
        const callType = isVideo ? '📹 *Video Call*' : '📞 *Voice Call*';

        console.log(`📞 Incoming call from ${callerJid} - rejecting with animated countdown...`);

        // ─── SEND ONLY ONE MESSAGE WITH ANIMATED COUNTDOWN ───
        const callerTag = '@' + callerJid.split('@')[0];
        const prefixText = `╭─── ⪨ 🔰 ANTICALL SYSTEM ⪩───⟢\n│ 👤 Caller: ${callerTag}\n│ 📞 Type: ${callType}\n│ 🚫 Action: Rejecting Call\n╰────────────⟢`;

        // Send initial message (the only message we'll send)
        const firstText = `${prefixText}\n\n⏳ ${CALL_REJECT_EMOJIS[0]}`;
        const firstMsg = await sock.sendMessage(callerJid, {
            text: firstText,
            mentions: [callerJid]
        });
        const firstKey = firstMsg?.key;

        // Animate countdown by editing the same message
        for (let i = 1; i < CALL_REJECT_EMOJIS.length; i++) {
            await delay(700);
            let newText = `${prefixText}\n\n⏳ ${CALL_REJECT_EMOJIS[i]}`;

            // On the last step, add the rejection info
            if (i === CALL_REJECT_EMOJIS.length - 1) {
                newText = `╭─── ⪨ ✅ CALL HANDLED ⪩───⟢\n│ 👤 Caller: ${callerTag}\n│ 🚫 Call has been rejected\n│ 📝 ${state.warnMessage || 'Please use text messages.'}\n╰────────────⟢\n> © DarkNode MD`;
            }

            if (firstKey) {
                await safeEdit(sock, callerJid, firstKey, newText);
            }
        }

        // ─── REJECT THE CALL ───
        try {
            await sock.rejectCall(callId, callerJid);
            console.log(`✅ Call from ${callerJid} rejected successfully.`);
        } catch (rejectErr) {
            console.error(`Failed to reject call: ${rejectErr.message}`);
        }

    } catch (e) {
        console.error('handleIncomingCall error:', e);
    }
}

module.exports = {
    anticallCommand,
    readState,
    handleIncomingCall
};