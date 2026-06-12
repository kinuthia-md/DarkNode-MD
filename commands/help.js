const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');
const moment = require('moment-timezone');

// Load commandsMeta
let commandsMeta = [];
try {
    const metaPath = path.join(__dirname, '../lib/commandsMeta.js');
    const meta = require(metaPath);
    commandsMeta = meta.commands || [];
    console.log(`✅ Loaded ${commandsMeta.length} commands from commandsMeta`);
} catch (err) {
    console.error('❌ Failed to load commandsMeta:', err.message);
}

const botStartTime = Date.now();
const MENU_AUDIO_URL = 'https://mp3tourl.com/audio/1781296949397-dcb64ab5-64b9-4214-aa01-25b767546d15.mp3';

const menuSessions = new Map();

function getUptime() {
    const seconds = Math.floor((Date.now() - botStartTime) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function getRamUsage() {
    try {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        const percentage = ((used / total) * 100).toFixed(1);
        const usedMB = Math.round(used / 1024 / 1024);
        const totalMB = Math.round(total / 1024 / 1024);
        return `${usedMB}MB / ${totalMB}MB (${percentage}%)`;
    } catch {
        return 'N/A';
    }
}

function getTimeBasedGreeting(userName) {
    const hour = moment().tz('Africa/Nairobi').hour();
    if (hour >= 5 && hour < 12) return `Good Morning ☀️ @${userName}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon 🌤️ @${userName}`;
    if (hour >= 17 && hour < 21) return `Good Evening 🌙 @${userName}`;
    return `Good Night 🌃 @${userName}`;
}

async function sendTextChunks(sock, chatId, text, quoted) {
    const chunkSize = 6000;
    if (text.length <= chunkSize) {
        return await sock.sendMessage(chatId, { text }, { quoted });
    }

    let index = 0;
    let firstChunk = true;
    while (index < text.length) {
        const chunk = text.slice(index, index + chunkSize);
        await sock.sendMessage(chatId, { text: chunk }, firstChunk ? { quoted } : {});
        index += chunkSize;
        firstChunk = false;
    }
}

function extractPhoneNumber(jid) {
    let num = jid.split('@')[0];
    num = num.replace(/[^0-9]/g, '');
    if (num.length > 10) num = num.slice(-10);
    return num;
}

function buildCommandGroups(prefix) {
    const groups = {};
    const hiddenCommands = new Set(['ping']);

    const metaCommandNames = new Set();
    for (const cmd of commandsMeta) {
        if (!cmd.name || hiddenCommands.has(cmd.name.toLowerCase())) continue;
        const category = cmd.category || 'Other';
        if (!groups[category]) groups[category] = [];
        groups[category].push(cmd.name);
        metaCommandNames.add(cmd.name);
    }

    const commandsDir = __dirname;
    const files = fs
        .readdirSync(commandsDir)
        .filter(f => f.endsWith('.js') && !['help.js', 'settings.js', 'list.js'].includes(f));

    const extraCommands = [];
    for (const file of files) {
        const cmdName = file.replace('.js', '');
        if (hiddenCommands.has(cmdName.toLowerCase())) continue;
        if (!metaCommandNames.has(cmdName)) extraCommands.push(cmdName);
    }

    if (extraCommands.length > 0) {
        if (!groups['Other']) groups['Other'] = [];
        groups['Other'].push(...extraCommands);
    }

    for (const cat in groups) groups[cat].sort();
    return groups;
}

function getPreferredOrder() {
    return ['🌸 AI', '📥Download', '😆Fun', '🎮Games', '👥Group', '🎭Sticker', '💫Text FX', '🎧Misc', '🛠 General', '👑 Owner', 'Utility', '🔞NSFW', '🎰Other   '];
}

function getCategoryOrder(groups) {
    const preferredOrder = getPreferredOrder();
    const seen = new Set();
    const order = [];

    for (const cat of preferredOrder) {
        if (groups[cat] && groups[cat].length > 0) {
            seen.add(cat);
            order.push(cat);
        }
    }

    for (const cat of Object.keys(groups)) {
        if (!seen.has(cat) && groups[cat] && groups[cat].length > 0) {
            order.push(cat);
        }
    }

    return order;
}

function buildSubmenuBox(categories) {
    let t = '';
    t += '> ╭━━━《 *MENU* 》━━━⬣\n';
    t += '> ┃\n';
    categories.forEach((cat) => {
        // IMPORTANT: show only emoji/title (no *1, *2 etc),
        // while numeric replies still work internally via menuSessions.
        t += `> ┃ ✤ ${cat}\n`;
    });
    t += '> ┃\n';
    t += '> ╰━━━━━━━━━━━━━━━━━━⬣';
    t += '\n\n*Example:* > _Reply with *1* to view Utility commands_ .';
    t += '\n> _DarkNode MD_ • *404R*>SOCIETY';
    return t;
}

function buildCommandsBox(category, cmds, prefix) {
    let t = '';
    t += `> ╭━━━《 *${category.toUpperCase()}* 》━━━⬣\n`;
    t += `> ┃ ✹ Commands (${cmds.length})\n`;
    t += '> ┃\n';
    if (!cmds.length) {
        t += '> ┃ ✹ No commands found\n';
    } else {
        cmds.forEach(c => {
            t += `> ┃ ✹ ${prefix}${c}\n`;
        });
    }
    t += '> ┃\n';
    t += '> ╰━━━━━━━━━━━━━━━━━━⬣';
    t += '\n\n> _DarkNode MD_ • *404R*>SOCIETY';
    return t;
}

function buildMenuHeader({ botName, version, prefix, senderName, uptime, ramInfo, currentTime, dayName, currentDate, platform, nodeVersion }) {
    let menu = '';
    menu += `${senderName}\n\n`;
    menu += `┌❏ *${botName} v${version}* ❏\n`;
    menu += `│\n`;
    menu += `├❏ Owner: 404R>Society\n`;
    menu += `├❏ Prefix: ${prefix}\n`;
    menu += `├❏ Version: ${version}\n`;
    menu += `├❏ Time: ${currentTime} (Africa/Nairobi)\n`;
    menu += `├❏ Uptime: ${uptime}\n`;
    menu += `├❏ Day: ${dayName}\n`;
    menu += `├❏ Date: ${currentDate}\n`;
    menu += `├❏ Platform: ${platform}\n`;
    menu += `├❏ Runtime: Node.js ${nodeVersion}\n`;
    menu += `├❏ RAM: ${ramInfo}\n`;
    menu += `├❏ Mode: Public\n`;
    menu += `│\n└❏\n\n`;
    return menu;
}

async function handleMenuNumberReply(sock, chatId, message, number, prefix) {
    const session = menuSessions.get(String(chatId));
    if (!session) {
        await sock.sendMessage(chatId, { text: '❌ No active menu. Send .menu first.' }, { quoted: message });
        return;
    }

    // expire after 10 minutes
    if (Date.now() - session.ts > 10 * 60 * 1000) {
        menuSessions.delete(String(chatId));
        await sock.sendMessage(chatId, { text: '❌ Menu expired. Send .menu again.' }, { quoted: message });
        return;
    }

    const idx = Number(number) - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= session.categories.length) {
        await sock.sendMessage(chatId, { text: '❌ Invalid submenu number.' }, { quoted: message });
        return;
    }

    const category = session.categories[idx];
    const groups = buildCommandGroups(prefix);
    const cmds = groups[category] || [];

    const botName = settings.botName || 'DarkNode MD';
    const version = settings.version || '1.0';

    const box = buildCommandsBox(category, cmds, prefix);
    const text = `┌❏ *${botName} v${version}* ❏\n\n${box}`;

    await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
}

// Keep channelInfo consistent with existing index.js usage
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

async function helpCommand(sock, chatId, message) {
    try {
        const prefix = settings.prefix || '.';
        const senderId = message.key.participant || message.key.remoteJid;
        const senderName = message.pushName || extractPhoneNumber(senderId);

        const greeting = getTimeBasedGreeting(senderName);
        const uptime = getUptime();
        const ramInfo = getRamUsage();

        const groups = buildCommandGroups(prefix);
        const categories = getCategoryOrder(groups);

        const botName = settings.botName || 'DarkNode MD';
        const version = settings.version || '1.0';
        const platform = os.platform().toUpperCase();
        const nodeVersion = process.version;
        const currentDate = moment().tz('Africa/Nairobi').format('DD/MM/YYYY');
        const currentTime = moment().tz('Africa/Nairobi').format('HH:mm');
        const dayName = moment().tz('Africa/Nairobi').format('dddd');

        const header = buildMenuHeader({
            botName,
            version,
            prefix,
            senderName: greeting,
            uptime,
            ramInfo,
            currentTime,
            dayName,
            currentDate,
            platform,
            nodeVersion
        });

        const submenuBox = buildSubmenuBox(categories);
        const menu = `${header}${submenuBox}`;

        // store category mapping for numeric replies
        menuSessions.set(String(chatId), { categories, ts: Date.now(), prefix });

        await sock.sendMessage(chatId, { react: { text: '🪀', key: message.key } });

        // Send menu logo + caption
        try {
            const logoPath = path.join(__dirname, '../assets/logo.jpg');
            await sock.sendMessage(chatId, {
                image: { url: logoPath },
                caption: menu,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: settings.newsletterJid || '120363426838586273@newsletter',
                        newsletterName: settings.newsletterName || 'DarkNode MD',
                        serverMessageId: 13
                    }
                }
            }, { quoted: message });
        } catch (logoErr) {
            await sendTextChunks(sock, chatId, menu, message);
        }

        // Add a channel button to the menu
        try {
            const channelLink = settings.channelLink || 'https://whatsapp.com/channel/0029Vb8RuL91dAwCFOtTrG1X';
            await sock.sendMessage(chatId, {
                footer: `Tap the button below to open the channel.`,
                templateButtons: [
                    {
                        urlButton: {
                            displayText: 'Open Channel',
                            url: channelLink
                        }
                    },
                    {
                        quickReplyButton: {
                            displayText: 'Channel Info',
                            id: '.channel'
                        }
                    }
                ]
            }, { quoted: message });
        } catch (buttonErr) {
            console.log('Channel button failed:', buttonErr.message);
        }

        // Send audio
        try {
            await sock.sendMessage(chatId, {
                audio: { url: MENU_AUDIO_URL },
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: settings.newsletterJid || '120363426838586273@newsletter',
                        newsletterName: settings.newsletterName || '404R>Society',
                        serverMessageId: 13
                    }
                }
            }, { quoted: message });
        } catch (audioErr) {
            console.log('Audio failed:', audioErr.message);
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (error) {
        console.error('Help error:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { text: '❌ Error loading menu.' }, { quoted: message });
    }
}

module.exports = helpCommand;
module.exports.handleMenuNumberReply = handleMenuNumberReply;

