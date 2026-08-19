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

Filter Playwright UI / CLI by **file name** (topic) or nested `test.describe` (section inside the file).

| File | What it covers |
|------|----------------|
| `mail.spec.js` | Open first Inbox message, sender chrome |
| `mail-folders.spec.js` | Inbox / Sent / Trash / Spam |
| `mail-list-actions.spec.js` | Unseen, Starred, bulk delete, empty Trash / Spam, mark read/unread |
| `mail-actions.spec.js` | Details, star, Reply / Reply all / Forward, header search |
| `mail-mutations.spec.js` | Headers, Move, Spam, delete, reply+forward, advanced search |
| `mail-forward-resend.spec.js` | Forward as attachment, Resend |
| `compose.spec.js` | Write and send |
| `compose-cc-bcc.spec.js` | CC/BCC and discard |
| `compose-draft.spec.js` | Save draft, send draft, minimize compose |
| `compose-from.spec.js` | Switch compose From when a second sender exists |
| `mail-attachments.spec.js` | Attach in compose, download `.eml`, save to Files |
| `mail-custom-folders.spec.js` | Create / move / rename / delete custom folder |
| `mail-signature.spec.js` | Signature in Settings → compose |
| `mail-filters.spec.js` | Filter by subject into a folder |
| `mail-forward-autoresponder.spec.js` | Forwarding and autoresponder on/off |
| `mail-message-window.spec.js` | Open message in a new window, Prev / Next |
| `mail-notes.spec.js` | Create a note in Notes |
| `header-nav.spec.js` | Mail → Contacts → Calendar → Files → Settings |

## Stand / environment

- Send can fail with `MailSo-Net-Exceptions-SocketReadTimeoutException` (SMTP/IMAP socket timeout). The scenario must fail on that toast — do not dismiss compose and poll Sent.
- After Send, do not Escape / save-and-close: that stores a **draft** and Sent stays empty. Wait for `.report_panel.report` (`REPORT_MESSAGE_SENT`).
- `saves attachments to Files` opens an existing Inbox/Sent row with `.has_attachments` — it does not send (SMTP timeout on this stand).
