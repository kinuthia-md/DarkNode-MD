const DEFAULT_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function safeEdit(sock, chatId, key, text) {
  try {
    // Baileys supports { edit: messageKey } pattern
    await sock.sendMessage(chatId, { text, edit: key }, {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Animated countdown using emojis by editing the same message.
 * @param {object} sock
 * @param {string} chatId
 * @param {object} quotedMessage
 * @param {string[]} emojis
 * @param {number} stepDelayMs
 * @param {string} baseText
 */
async function animatedCountdown({
  sock,
  chatId,
  quotedMessage,
  emojis = DEFAULT_EMOJIS,
  stepDelayMs = 650,
  baseText = '⏳ Kicking',
}) {
  const total = Math.min(emojis.length, 10);

  const first = await sock.sendMessage(
    chatId,
    { text: `${baseText} ${emojis[0]}` },
    quotedMessage ? { quoted: quotedMessage } : undefined
  );

  // first.key is what we need for edit
  const firstKey = first?.key;

  for (let i = 1; i < total; i++) {
    await delay(stepDelayMs);
    if (firstKey) {
      await safeEdit(sock, chatId, firstKey, `${baseText} ${emojis[i]}`);
    } else {
      // fallback: send new message
      await sock.sendMessage(chatId, { text: `${baseText} ${emojis[i]}` }, quotedMessage ? { quoted: quotedMessage } : undefined);
    }
  }

  return true;
}

async function kickWithWarningsAndCountdown({
  sock,
  chatId,
  targetJids,
  senderId,
  isGroup = true,
  sockMessage,
  quotedMessage,
  reason = 'Violation',
  warnings = 3,
  countdownEmojis = DEFAULT_EMOJIS,
}) {
  if (!Array.isArray(targetJids) || targetJids.length === 0) return;

  // Ensure unique
  const uniqueTargets = [...new Set(targetJids)];

  // 1) Notify 3 times
  for (let w = 1; w <= warnings; w++) {
    await delay(900);
    await sock.sendMessage(
      chatId,
      {
        text: `⚠️ Warning ${w}/${warnings}\n\nTarget: ${uniqueTargets.join(', ')}\nReason: ${reason}`,
      },
      quotedMessage ? { quoted: quotedMessage } : undefined
    );
  }

  // 2) Animated countdown
  await animatedCountdown({
    sock,
    chatId,
    quotedMessage,
    emojis: countdownEmojis,
    baseText: '💥 Kicking',
  });

  // 3) Kick
  for (const jid of uniqueTargets) {
    await sock.groupParticipantsUpdate(chatId, [jid], 'remove');
  }
}

module.exports = {
  kickWithWarningsAndCountdown,
  animatedCountdown,
};

