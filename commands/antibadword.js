// ============================================
//  AntiBadword Module
//  Detects bad words and takes action
//  (delete / kick / warn) when enabled
//  Action only triggers on mentioned/replied users
// ============================================

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const { setAntiBadword, getAntiBadword, removeAntiBadword, incrementWarningCount, resetWarningCount } = require('../lib/index');

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

const BAD_WORDS = [
    'fuck', 'fuck', 'fucker', 'fucking', 'fuckin', 'fuk', 'fukk', 'fck',
    'bitch', 'bitches', 'bch',
    'ass', 'asshole', 'asses',
    'shit', 'shits', 'shitting',
    'damn', 'dammit',
    'cunt', 'cnt',
    'dick', 'dickhead', 'dik',
    'cock', 'cocks',
    'pussy', 'pusy',
    'motherfucker', 'mothafucka', 'mfer',
    'nigga', 'nigger', 'nig',
    'whore', 'hoe',
    'slut', 'slutty',
    'bastard',
    'piss', 'pissed',
    'bullshit', 'bs',
    'suck', 'sucks',
    'blowjob', 'bj',
    'cum', 'cumshot',
    'tits', 'titties', 'boobs',
    'porn', 'porno',
    'sex', 'sexy',
    'horny',
    'fag', 'faggot',
    'retard', 'retarded',
    'idiot', 'idiots',
    'stupid',
    'dumb', 'dumbass',
    'hell', 'heck',
    'goddamn',
    'omg',
    'wth', 'wtf', 'stfu',
    'bhosdike', 'bhosdi', 'bhenchod', 'bc',
    'madarchod', 'mc', 'maderchod',
    'bhen ke lode', 'bkl',
    'chutiya', 'chutiye',
    'teri maa ki', 'teri ma ki',
    'lund', 'loda', 'lodu',
    'gaand', 'gand',
    'randi', 'randwe',
    'betichod',
    'harami',
    'kutte', 'kutti',
    'kamina',
    'sala', 'sali',
    'behen ki',
    'chodna',
    'chodu',
    'bhadwa',
    'bhadve',
    'laud',
    'lavde',
    'balatkar',
    'nudes',
    'nanga',
    'nangi',
];

async function handleAntiBadwordCommand(sock, chatId, message, args) {
    try {
        if (!args) {
            await sock.sendMessage(chatId, { text: `╭─── ⪨ ℹ️ ANTIBADWORD ⪩───⟢\n│ 📌 Usage:\n│ .antibadword on\n│ .antibadword off\n│ .antibadword set <delete/kick/warn>\n╰────────────⟢\n> © DarkNode MD`, ...channelInfo }, { quoted: fakeMeta });
            return;
        }

        const parts = args.trim().split(/\s+/);
        const sub = parts[0].toLowerCase();

        if (sub === 'on') {
            const existing = await getAntiBadword(chatId, 'on');
            if (existing?.enabled) {
                await sock.sendMessage(chatId, { text: '╭─── ⪨ ❌ ANTIBADWORD ⪩───⟢\n│ ⚠️ Already enabled for this group.\n╰────────────⟢\n> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
                return;
            }
            await setAntiBadword(chatId, 'on', 'warn');
            await sock.sendMessage(chatId, { text: '╭─── ⪨ ✅ ANTIBADWORD ⪩───⟢\n│ 🛡️ Anti-badword is now *ON*\n│ ⚙️ Default action: warn\n╰────────────⟢\n> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
        } else if (sub === 'off') {
            const existing = await getAntiBadword(chatId, 'on');
            if (!existing?.enabled) {
                await sock.sendMessage(chatId, { text: '╭─── ⪨ ❌ ANTIBADWORD ⪩───⟢\n│ ⚠️ Already disabled for this group.\n╰────────────⟢\n> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
                return;
            }
            await removeAntiBadword(chatId);
            await sock.sendMessage(chatId, { text: '╭─── ⪨ ✅ ANTIBADWORD ⪩───⟢\n│ 🛡️ Anti-badword is now *OFF*\n╰────────────⟢\n> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
        } else if (sub === 'set' && parts[1]) {
            const action = parts[1].toLowerCase();
            if (!['delete', 'kick', 'warn'].includes(action)) {
                await sock.sendMessage(chatId, { text: '╭─── ⪨ ❌ ANTIBADWORD ⪩───⟢\n│ ⚠️ Choose: delete, kick, or warn\n╰────────────⟢\n> © DarkNode MD', ...channelInfo }, { quoted: fakeMeta });
                return;
            }
            await setAntiBadword(chatId, 'on', action);
            await sock.sendMessage(chatId, { text: `╭─── ⪨ ✅ ANTIBADWORD ⪩───⟢\n│ 🛡️ Action set to: *${action}*\n╰────────────⟢\n> © DarkNode MD`, ...channelInfo }, { quoted: fakeMeta });
        } else {
            await sock.sendMessage(chatId, { text: `╭─── ⪨ ℹ️ ANTIBADWORD ⪩───⟢\n│ 📌 Usage:\n│ .antibadword on\n│ .antibadword off\n│ .antibadword set <delete/kick/warn>\n╰────────────⟢\n> © DarkNode MD`, ...channelInfo }, { quoted: fakeMeta });
        }
    } catch (e) {
        console.error('❌ Antibadword command error:', e);
        try { await sock.sendMessage(chatId, { text: `╭─── ⪨ ❌ ERROR ⪩───⟢\n│ ❌ ${e.message || 'Failed to process.'}\n╰────────────⟢\n> © DarkNode MD`, ...channelInfo }, { quoted: fakeMeta }); } catch {}
    }
}

async function handleBadwordDetection(sock, chatId, message, userMessage, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) return;
        if (message.key.fromMe) return;

        const config = await getAntiBadword(chatId, 'on');
        if (!config?.enabled) return;

        const normalized = userMessage.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const words = normalized.split(' ');

        let detected = false;
        for (const word of words) {
            if (word.length < 2) continue;
            if (BAD_WORDS.includes(word)) {
                detected = true;
                break;
            }
            for (const bad of BAD_WORDS) {
                if (bad.includes(' ') && normalized.includes(bad)) {
                    detected = true;
                    break;
                }
            }
            if (detected) break;
        }

        if (!detected) return;

        // Get bot's admin status
        try {
            const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
            const groupMeta = await sock.groupMetadata(chatId);
            const botParticipant = groupMeta.participants.find(p => p.id === botJid);
            if (!botParticipant?.admin) return;
        } catch (e) {
            return;
        }

        // Skip admins
        const groupMeta = await sock.groupMetadata(chatId);
        const senderParticipant = groupMeta.participants.find(p => p.id === senderId);
        if (senderParticipant?.admin) return;

        // Delete the bad message
        try {
            await sock.sendMessage(chatId, { delete: message.key });
        } catch (e) {
            console.error('Badword delete error:', e);
            return;
        }

        const action = config.action || 'warn';

        switch (action) {
            case 'delete': {
                await sock.sendMessage(chatId, {
                    text: `╭─── ⪨ ⚠️ BADWORD ⪩───⟢\n│ 👤 @${senderId.split('@')[0]}\n│ ❌ Message deleted\n╰────────────⟢\n> © DarkNode MD`,
                    mentions: [senderId],
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: settings.newsletterJid,
                            newsletterName: settings.newsletterName,
                            serverMessageId: -1
                        }
                    }
                });
                break;
            }
            case 'kick': {
                try {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await sock.sendMessage(chatId, {
                        text: `╭─── ⪨ ✅ KICKED ⪩───⟢\n│ 👤 @${senderId.split('@')[0]}\n│ ⚠️ Kicked for using bad words\n╰────────────⟢\n> © DarkNode MD`,
                        mentions: [senderId],
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: settings.newsletterJid,
                                newsletterName: settings.newsletterName,
                                serverMessageId: -1
                            }
                        }
                    });
                } catch (e) {
                    console.error('Badword kick error:', e);
                }
                break;
            }
            case 'warn':
            default: {
                const count = await incrementWarningCount(chatId, senderId);
                if (count >= 3) {
                    try {
                        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                        await resetWarningCount(chatId, senderId);
                        await sock.sendMessage(chatId, {
                            text: `╭─── ⪨ ✅ KICKED ⪩───⟢\n│ 👤 @${senderId.split('@')[0]}\n│ ⚠️ Kicked after 3 warnings\n╰────────────⟢\n> © DarkNode MD`,
                            mentions: [senderId],
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: settings.newsletterJid,
                                    newsletterName: settings.newsletterName,
                                    serverMessageId: -1
                                }
                            }
                        });
                    } catch (e) {
                        console.error('Badword warn kick error:', e);
                    }
                } else {
                    await sock.sendMessage(chatId, {
                        text: `╭─── ⪨ ⚠️ WARNING ⪩───⟢\n│ 👤 @${senderId.split('@')[0]}\n│ 📋 Warning ${count}/3 for using bad words\n╰────────────⟢\n> © DarkNode MD`,
                        mentions: [senderId],
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: settings.newsletterJid,
                                newsletterName: settings.newsletterName,
                                serverMessageId: -1
                            }
                        }
                    });
                }
                break;
            }
        }
    } catch (e) {
        console.error('❌ Badword detection error:', e);
    }
}

exports.handleAntiBadwordCommand = handleAntiBadwordCommand;
exports.handleBadwordDetection = handleBadwordDetection;
exports.antibadwordCommand = handleAntiBadwordCommand;