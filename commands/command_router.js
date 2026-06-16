/**
 * Clean command router for DarkNode MD.
 *
 * This is intentionally small: instead of a giant switch-case,
 * we map command matchers to handlers.
 */

function normalizeText(text) {
  return String(text || '').trim().toLowerCase();
}

function startsWithAny(text, prefixes) {
  return prefixes.some((p) => text.startsWith(p));
}

/**
 * Dispatch a command.
 * @param {object} ctx
 * @param {string} ctx.userMessage normalized lowercased message text
 * @param {string} ctx.rawText raw text (original casing where possible)
 * @param {string} ctx.cmd command token (".name" or similar)
 * @param {object} ctx.sock baileys socket
 * @param {string} ctx.chatId
 * @param {string} ctx.senderId
 * @param {boolean} ctx.isGroup
 * @param {boolean} ctx.isPublic
 * @param {boolean} ctx.isOwnerOrSudoCheck
 * @param {object} ctx.message full message
 * @param {string} ctx.prefix settings prefix like '.'
 * @returns {Promise<boolean>} true if a handler ran
 */
async function dispatch(ctx) {
  const {
    userMessage,
    rawText,
    cmd,
    sock,
    chatId,
    senderId,
    isGroup,
    message,
    prefix,
  } = ctx;

  // NOTE: Extend this file as you want to restructure commands.
  // Add a new rule by pushing to rules array.

  const rules = [
    {
      name: 'help/menu/bot',
      test: () => cmd === '.help' || cmd === '.menu' || cmd === '.bot',
      run: async () => {
        const helpCommand = require('./help');
        await helpCommand(sock, chatId, message);
        return true;
      },
    },

    {
      name: 'ping-lite (fallback)',
      test: () => cmd === '.ping',
      run: async () => {
        const pingCommand = require('./ping');
        await pingCommand(sock, chatId, message);
        return true;
      },
    },

    // Example: normalize argument parsing for blur
    {
      name: 'blur',
      test: () => userMessage.startsWith(prefix + 'blur'),
      run: async () => {
        const blurCommand = require('./img-blur');
        const quoted = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        await blurCommand(sock, chatId, message, quoted);
        return true;
      },
    },

    // Movie example
    {
      name: 'movie',
      test: () => userMessage.startsWith(prefix + 'movie'),
      run: async () => {
        const { movieCommand } = require('./movie');
        const args = userMessage.split(/\s+/).slice(1);
        await movieCommand(sock, chatId, message, args);
        return true;
      },
    },
  ];

  for (const rule of rules) {
    if (rule.test()) {
      await rule.run();
      return true;
    }
  }

  return false;
}

module.exports = {
  dispatch,
  normalizeText,
  startsWithAny,
};

