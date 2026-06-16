// commands/pair.js - Pair/Connect Sub-bot
const path = require('path');
const fs = require('fs');
const settings = require('../settings');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');

const {
    SUBBOTS_DIR,
    getAvailableSlots,
    subBotExists,
    hasValidCreds,
    createSubBotFolder,
    deleteSubBotFolder,
    launchSubBot,
    activeSubBots,
} = require('../lib/subbotManager');

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

// Header style
const HDR_TOP = '┌❏';
const HDR_LINE = '├❏';
const HDR_BOTTOM = '└❏';

function formatHeader(title, lines) {
    let result = `${HDR_TOP} *${title}* ❏\n`;
    result += `│\n`;
    lines.forEach(line => {
        result += `${HDR_LINE} ${line}\n`;
    });
    result += `│\n`;
    result += `${HDR_BOTTOM} ❏`;
    return result;
}

const pairingInProgress = new Map();

function extractNumber(jid) {
    if (!jid) return null;
    let clean = jid.split('@')[0];
    clean = clean.replace(/[^0-9]/g, '');
    if (clean.length > 15 || clean.startsWith('1')) {
        return null;
    }
    return clean;
}

async function pairCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const senderNumber = extractNumber(senderId);
    
    let targetNumber = senderNumber;
    
    if (args && args.length > 0) {
        const providedNumber = args[0].replace(/[^0-9]/g, '');
        if (providedNumber && providedNumber.length >= 10 && providedNumber.length <= 15) {
            targetNumber = providedNumber;
        }
    }
    
    if (!targetNumber || targetNumber.length < 10) {
        const errorLines = [`❌ Invalid number`, ``, `Usage: .pair 254XXXXXXXXX`];
        const errorMsg = formatHeader('PAIR ERROR', errorLines);
        return sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: fakeMeta });
    }

    if (pairingInProgress.has(targetNumber)) {
        const waitLines = [`⏳ Pairing already in progress for ${targetNumber}`];
        const waitMsg = formatHeader('PAIRING IN PROGRESS', waitLines);
        return sock.sendMessage(chatId, { text: waitMsg, ...channelInfo }, { quoted: fakeMeta });
    }

    if (activeSubBots.has(targetNumber)) {
        const activeLines = [`✅ Bot for ${targetNumber} is already active.`];
        const activeMsg = formatHeader('BOT ACTIVE', activeLines);
        return sock.sendMessage(chatId, { text: activeMsg, ...channelInfo }, { quoted: fakeMeta });
    }

    if (subBotExists(targetNumber) && hasValidCreds(targetNumber)) {
        const existingLines = [`✅ Existing session found for ${targetNumber}`, `Restarting your bot...`];
        const existingMsg = formatHeader('SESSION FOUND', existingLines);
        await sock.sendMessage(chatId, { text: existingMsg, ...channelInfo }, { quoted: fakeMeta });
        launchSubBot(targetNumber);
        return;
    }

    const availableSlots = getAvailableSlots();
    if (availableSlots <= 0) {
        const fullLines = [`❌ Server full. Cannot create new session.`];
        const fullMsg = formatHeader('SERVER FULL', fullLines);
        return sock.sendMessage(chatId, { text: fullMsg, ...channelInfo }, { quoted: fakeMeta });
    }

    if (subBotExists(targetNumber)) {
        deleteSubBotFolder(targetNumber);
    }

    pairingInProgress.set(targetNumber, true);
    let userSock = null;
    let paired = false;
    let timeoutId = null;

    try {
        const sessionPath = createSubBotFolder(targetNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        userSock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '20.0.04'],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(
                    state.keys,
                    pino({ level: 'fatal' }).child({ level: 'fatal' })
                ),
            },
            markOnlineOnConnect: false,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
        });

        userSock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            console.log(`[Pair] ${targetNumber} connection status: ${connection}`);
            
            if (connection === 'open' && !paired) {
                paired = true;
                console.log(`[Pair] ✓ ${targetNumber} successfully connected!`);
                
                if (timeoutId) clearTimeout(timeoutId);
                await saveCreds();
                
                setTimeout(async () => {
                    const credsPath = path.join(sessionPath, 'creds.json');
                    if (fs.existsSync(credsPath) && fs.statSync(credsPath).size > 100) {
                        console.log(`[Pair] Creds saved for ${targetNumber}`);
                        
                        pairingInProgress.delete(targetNumber);
                        
                        setTimeout(() => {
                            try { userSock?.end(); } catch(_) {}
                        }, 5000);
                        
                        setTimeout(() => {
                            console.log(`[Pair] Launching sub-bot for ${targetNumber}`);
                            launchSubBot(targetNumber);
                        }, 3000);
                    }
                }, 3000);
            }
            
            if (connection === 'close' && !paired) {
                const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log(`[Pair] ${targetNumber} logged out during pairing`);
                    pairingInProgress.delete(targetNumber);
                    deleteSubBotFolder(targetNumber);
                    if (timeoutId) clearTimeout(timeoutId);
                }
            }
        });

        if (!userSock.authState.creds.registered) {
            setTimeout(async () => {
                if (paired) return;
                
                try {
                    let code = await userSock.requestPairingCode(targetNumber);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;

                    const pairingLines = [
                        `📱 Number: ${targetNumber}`,
                        `🔑 Code: ${code}`,
                        ``,
                        `Steps to link:`,
                        `1. Open WhatsApp → Settings`,
                        `2. Linked Devices → Link a Device`,
                        `3. Choose "Link with phone number"`,
                        `4. Enter this code: ${code}`,
                        ``,
                        `⏰ Code expires in 5 minutes`,
                        `Your bot will start automatically once linked`
                    ];
                    const pairingMsg = formatHeader('PAIRING CODE', pairingLines);
                    
                    await sock.sendMessage(chatId, { text: pairingMsg, ...channelInfo }, { quoted: fakeMeta });
                    
                    timeoutId = setTimeout(() => {
                        if (!paired && pairingInProgress.has(targetNumber)) {
                            console.log(`[Pair] Timeout for ${targetNumber}`);
                            pairingInProgress.delete(targetNumber);
                            try { userSock?.end(); } catch(_) {}
                            deleteSubBotFolder(targetNumber);
                            
                            const timeoutLines = [`⏰ Pairing timeout for ${targetNumber}`, `Please try again.`];
                            const timeoutMsg = formatHeader('TIMEOUT', timeoutLines);
                            sock.sendMessage(chatId, { text: timeoutMsg, ...channelInfo });
                        }
                    }, 300000);
                    
                } catch (err) {
                    pairingInProgress.delete(targetNumber);
                    deleteSubBotFolder(targetNumber);
                    console.error('[Pair] Error:', err.message);
                    
                    const errorLines = [`❌ Failed to generate pairing code.`, `Please try again.`];
                    const errorMsg = formatHeader('ERROR', errorLines);
                    sock.sendMessage(chatId, { text: errorMsg, ...channelInfo });
                }
            }, 2000);
        }

    } catch (error) {
        pairingInProgress.delete(targetNumber);
        deleteSubBotFolder(targetNumber);
        try { userSock?.end(); } catch(_) {}
        
        const errorLines = [`❌ Error: ${error.message}`, `Please try again.`];
        const errorMsg = formatHeader('ERROR', errorLines);
        await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: fakeMeta });
    }
}

module.exports = pairCommand;