// commands/calculator.js
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

function safeEval(expr) {
    try {
        const sanitized = expr
            .replace(/[^0-9+\-*/().,%^a-zA-Z\s]/g, '')
            .replace(/\^/g, '**')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/ceil\(/g, 'Math.ceil(')
            .replace(/floor\(/g, 'Math.floor(')
            .replace(/abs\(/g, 'Math.abs(')
            .replace(/round\(/g, 'Math.round(')
            .replace(/log\(/g, 'Math.log(')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/pi/g, 'Math.PI')
            .replace(/e(?![a-z])/g, 'Math.E');

        const result = Function('"use strict"; return (' + sanitized + ')')();
        return result;
    } catch (e) {
        return null;
    }
}

async function calculatorCommand(sock, chatId, message, args) {
    try {
        const expression = args.join(' ').trim();
        if (!expression) {
            const usageMsg = `╭─── ⪨ 🧮 CALCULATOR ⪩───⟢
│ 📌 Usage: .calc <expression>
│ 💡 Example: .calc 2+2*3
│
│ *Supported:*
│ ♧ +, -, *, /, %, ^
│ ♧ sqrt(), ceil(), floor()
│ ♧ abs(), round(), log()
│ ♧ sin(), cos(), tan()
│ ♧ pi, e
╰────────────⟢
> © DarkNode MD`;
            return await sock.sendMessage(chatId, {
                text: usageMsg,
                ...channelInfo
            }, { quoted: fakeMeta });
        }

        await sock.sendMessage(chatId, { react: { text: '🧮', key: message.key } });

        const result = safeEval(expression);
        if (result === null || result === undefined || isNaN(result)) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ ❌ ERROR ⪩───⟢
│ ❌ Invalid expression
│ 📌 *Input:* ${expression}
╰────────────⟢
> © DarkNode MD`,
                ...channelInfo
            }, { quoted: fakeMeta });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        const response = `╭─── ⪨ 🧮 RESULT ⪩───⟢
│ 📌 *Expression:* ${expression}
│ ✅ *Result:* ${result}
╰────────────⟢
> © DarkNode MD`;

        await sock.sendMessage(chatId, {
            text: response,
            ...channelInfo
        }, { quoted: fakeMeta });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Calculator error:', error);
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ ❌ ERROR ⪩───⟢
│ ❌ Failed to calculate.
╰────────────⟢
> © DarkNode MD`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = calculatorCommand;