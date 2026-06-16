// Minimal safe stub for .profile / profile-related features.
// The existing obfuscated file in this repo is corrupted (invalid JS syntax) causing the bot to crash on startup.
// This stub keeps the bot running; profile UI can be re-implemented later.

module.exports = async function profileCommand(sock, chatId, message) {
  try {
    const jid = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      || message?.key?.participant
      || message?.key?.remoteJid;

    await sock.sendMessage(
      chatId,
      {
        text: `👤 Profile module is currently unavailable (stub).\nRequested: ${jid || 'unknown'}`,
      },
      { quoted: message }
    );
  } catch (e) {
    try {
      await sock.sendMessage(chatId, { text: '❌ Failed to show profile (stub).' }, { quoted: message });
    } catch {}
  }
};

