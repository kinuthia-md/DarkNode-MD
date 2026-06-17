// commands/tictactoe.js - Tic Tac Toe Game
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

// Store active games
const activeGames = new Map();

async function tictactoeCommand(sock, chatId, senderId, text) {
    try {
        const opponent = text?.trim();

        if (!opponent) {
            await sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🎮 TIC TAC TOE ⪩───⟢\n│ 📌 Usage: .tictactoe <@user>\n│ 💡 Start a game\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🎮 TIC TAC TOE ⪩───⟢\n│ Game started with ${opponent}\n│\n│ ⚠️ Feature under maintenance.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[TicTacToe] Error:', error);
        await sock.sendMessage(chatId, {
            text: '╭─── ⪨ ❌ ERROR ⪩───⟢\n│ Failed to start game.\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        }, { quoted: message });
    }
}

async function guessLetter(sock, chatId, letter) {
    try {
        await sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🎮 TIC TAC TOE ⪩───⟢\n│ Letter: ${letter}\n│\n│ ⚠️ Feature under maintenance.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        });
    } catch (error) {
        console.error('[GuessLetter] Error:', error);
    }
}

module.exports = { tictactoeCommand, guessLetter };