# Desktop E2E (Playwright)

Scenarios for **MailWebclient**. Runner lives at the Aurora install root:

```bash
# from install root
npm run test:e2e-desktop
./modules/CoreWebclient/test/e2e/run.sh

# this module only (Chrome)
npm run test:e2e-desktop -- --setup "MailWebclient Chrome"
```

Shared helpers: `modules/CoreWebclient/test/e2e/helpers/` (`AURORA_E2E_ROOT`).
Domain helpers: `./helpers/` in this folder.

## Known product bugs

- After renaming a custom folder in Settings → Manage Folders, the delete control stays `disabled` (`canDelete` is false) and the UI reports `Mailbox doesn't exist` for the previous IMAP name. `mail-custom-folders.spec.js` fails on delete. File: `js/popups/EditFolderPopup.js` (`RenameFolder`).

## P1 specs (`mail-p1.spec.js`)

- mark list message unread / read
- open message in new window; prev/next when enabled
- download `.eml` from More menu
- empty Spam folder
- save attachments to Files *(plugin; skip if unavailable)*
- create note in Notes folder *(skip if folder missing)*
- switch compose From when multiple senders exist
