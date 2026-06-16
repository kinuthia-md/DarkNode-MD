- [ ] Refactor/clean bot command dispatcher so commands are readable and maintainable (remove duplicated/incorrect switch cases, normalize argument parsing).
- [ ] Implement command registration pattern (optional) so adding commands is consistent.
- [ ] Clean up Telegram bridge commands (menu formatting + /pair behavior).
- [ ] Ensure Telegram `/pair <number>` uses `subbots/<number>` auth folder and launches sub-bot on WhatsApp Baileys `connection === 'open'`.
- [ ] Test:
  - [ ] WhatsApp: `.menu`
  - [ ] WhatsApp: `.pair <number>`
  - [ ] Telegram: `/menu`
  - [ ] Telegram: `/pair <number>`

