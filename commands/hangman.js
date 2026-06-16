// commands/hangman.js - Hangman Game
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

const words = ['javascript', 'python', 'nodejs', 'react', 'database'];
const hangmanGames = {};

function startHangman(sock, chatId) {
    const word = words[Math.floor(Math.random() * words.length)];
    const maskedWord = '_ '.repeat(word.length).trim();
    hangmanGames[chatId] = {
        word: word,
        maskedWord: maskedWord.split(' '),
        guessedLetters: [],
        wrongGuesses: 0,
        maxWrongGuesses: 6
    };

    sock.sendMessage(chatId, {
        text: `╭─── ⪨ 🎮 HANGMAN ⪩───⟢\n│ Word: ${maskedWord}\n│ Wrong guesses: 0/6\n╰────────────⟢\n> © DarkNode MD`,
        ...channelInfo
    });
}

function guessLetter(sock, chatId, letter) {
    if (!hangmanGames[chatId]) {
        sock.sendMessage(chatId, {
            text: '╭─── ⪨ 🎮 HANGMAN ⪩───⟢\n│ No game in progress.\n│ Start with .hangman\n╰────────────⟢\n> © DarkNode MD',
            ...channelInfo
        });
        return;
    }

    const game = hangmanGames[chatId];
    const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;

    if (guessedLetters.includes(letter)) {
        sock.sendMessage(chatId, {
            text: `╭─── ⪨ 🎮 HANGMAN ⪩───⟢\n│ Already guessed "${letter}".\n│ Try another letter.\n╰────────────⟢\n> © DarkNode MD`,
            ...channelInfo
        });
        return;
    }

    guessedLetters.push(letter);

    if (word.includes(letter)) {
        for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) maskedWord[i] = letter;
        }
        sock.sendMessage(chatId, {
            text: `✅ Correct! ${maskedWord.join(' ')}`
        });

        if (!maskedWord.includes('_')) {
            sock.sendMessage(chatId, {
                text: `╭─── ⪨ 🎉 VICTORY ⪩───⟢\n│ You won! The word was: ${word}\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            });
            delete hangmanGames[chatId];
        }
    } else {
        game.wrongGuesses++;
        sock.sendMessage(chatId, {
            text: `❌ Wrong guess! You have ${maxWrongGuesses - game.wrongGuesses} tries left.`
        });

        if (game.wrongGuesses >= maxWrongGuesses) {
            sock.sendMessage(chatId, {
                text: `╭─── ⪨ 💀 GAME OVER ⪩───⟢\n│ The word was: ${word}\n╰────────────⟢\n> © DarkNode MD`,
                ...channelInfo
            });
            delete hangmanGames[chatId];
        }
    }
}

module.exports = { startHangman, guessLetter };