const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, fieldControl, hasCredentials, getComposeTo } = sharedHelper('login')
const composeTo = getComposeTo()
const { clickReady } = sharedHelper('ready')
const {
  FOLDER_TYPES,
  waitForInboxList,
  fillComposeRecipient,
  sendCompose,
  fillComposeBody,
  visibleSubject,
  waitForComposeAttachmentReady,
  waitForMessageInFolder,
  clickMessageListItem,
  waitForOpenedMessageView,
  openFolderByType,
  openMailMoreMenu,
  clickKoCommand,
  ensureInboxHasMessage,
  openFirstInboxMessage,
} = require('./helpers/mail')

const attachFixturePath = fixturePath('e2e-attach.txt')
const fixtureName = 'e2e-attach.txt'

async function jqueryClick(locator) {
  await locator.evaluate((el) => {
    const $ = window.jQuery || window.$
    if ($) {
      $(el).trigger('click')
      return
    }
    el.click()
  })
}

test.describe('Desktop mail attachments', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test.describe('Compose and Sent', () => {
    test('composes with attachment, opens it in Sent', async ({ page }) => {
    test.setTimeout(T(240000))

    const subject = `E2E attach ${Date.now()}`
    const bodyText = `E2E attach body ${Date.now()}`

    await gotoLoggedIn(page)
    await waitForInboxList(page)

    await step('Open compose via FAB', async () => {
      await clickReady(page.getByTestId('mail-compose-fab'))
      await expect(page.getByTestId('mail-compose')).toBeVisible({
        timeout: T(15000),
      })
    })

    await step(`Fill To: ${composeTo}`, async () => {
      await fillComposeRecipient(page, composeTo)
    })

    await step(`Fill Subject: ${subject}`, async () => {
      await fieldControl(page, 'mail-compose-subject').fill(subject)
    })

    await step(`Attach ${fixtureName}`, async () => {
      const attach = page.getByTestId('mail-compose-attach')
      test.skip((await attach.count()) === 0, 'mail-compose-attach not available')

      const fileInput = page
        .locator(
          '[data-test-id="mail-compose-attach"] input[type="file"], .attachments_panel input[type="file"]'
        )
        .first()
      if ((await fileInput.count()) > 0) {
        await fileInput.setInputFiles(attachFixturePath)
      } else {
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          attach.click(),
        ])
        await fileChooser.setFiles(attachFixturePath)
      }

      await expect(
        page.locator('.attachments_panel, .attachments_container').filter({
          hasText: fixtureName,
        }).first()
      ).toBeVisible({ timeout: T(60000) })
      await waitForComposeAttachmentReady(page, fixtureName)
      console.log(`  → Attachment uploaded: ${fixtureName}`)
      await attachScreenshot(page, 'mail-attach-01-compose')
    })

    await step('Fill body and send', async () => {
      await fillComposeBody(page, bodyText)
      await sendCompose(page)
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(45000),
      })
      await attachScreenshot(page, 'mail-attach-02-sent')
    })

    await step('Open Sent and find message with attachment', async () => {
      const item = await waitForMessageInFolder(page, FOLDER_TYPES.SENT, subject, {
        timeout: 180000,
      })
      await clickMessageListItem(page, item)

      await expect(page.getByTestId('mail-message-view')).toBeVisible({
        timeout: T(30000),
      })
      await waitForOpenedMessageView(page)
      const openedSubject = (await visibleSubject(page).innerText()).trim()
      expect(openedSubject).toContain(subject)
      console.log(`  → Opened Sent message: ${openedSubject}`)
    })

    await step('Expect attachment visible on message', async () => {
      const attachmentsPanel = page.locator(
        '.message_viewer .attachments_panel, .message_viewer .attachments'
      )
      await expect(attachmentsPanel.first()).toBeVisible({ timeout: T(30000) })
      await expect(
        page.locator('.message_viewer .attachments, .message_viewer .item.file').filter({
          hasText: fixtureName,
        }).first()
      ).toBeVisible({ timeout: T(15000) })
      console.log(`  → Attachment visible in message: ${fixtureName}`)
      await attachScreenshot(page, 'mail-attach-03-view')
    })
    })
  })

  test.describe('Download .eml', () => {
    test('downloads .eml from More menu', async ({ page }) => {
      test.setTimeout(T(240000))
      await gotoLoggedIn(page)
      await ensureInboxHasMessage(page)
      const opened = await openFirstInboxMessage(page)
      test.skip(!opened, 'Inbox is empty')

      await step('More → Download .eml', async () => {
        await waitForOpenedMessageView(page)
        await openMailMoreMenu(page)
        const eml = page.getByTestId('mail-menu-download-eml')
        await expect(eml).toBeVisible({ timeout: T(15000) })
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: T(30000) }),
          eml.click(),
        ])
        const name = download.suggestedFilename()
        console.log(`  → Download: ${name}`)
        expect(name.toLowerCase()).toMatch(/\.eml$/)
        await attachScreenshot(page, 'mail-eml-01')
      })
    })
  })

  test.describe('Save to Files', () => {
    test('saves attachments to Files', async ({ page }) => {
      test.setTimeout(T(180000))
      await gotoLoggedIn(page)
      await waitForInboxList(page)

      await step('Open a message that already has attachments', async () => {
        let found = false
        for (const folder of [FOLDER_TYPES.INBOX, FOLDER_TYPES.SENT]) {
          await openFolderByType(page, folder)
          await expect(page.getByTestId('mail-list-loading')).toBeHidden({
            timeout: T(60000),
          })
          const item = page
            .getByTestId('mail-message-item')
            .filter({ has: page.locator('.attachments.has_attachments:visible') })
            .first()
          const visible = await item
            .waitFor({ state: 'visible', timeout: T(15000) })
            .then(() => true)
            .catch(() => false)
          if (visible) {
            await clickMessageListItem(page, item)
            await waitForOpenedMessageView(page)
            found = true
            break
          }
        }
        expect(
          found,
          'No message with attachments in Inbox or Sent (Save to Files needs an existing attachment; do not send — SMTP times out on this stand)'
        ).toBeTruthy()
      })

      await step('Save attachments to Files', async () => {
        const method = page.getByTestId('mail-attachments-download-method')
        test.skip(
          (await method.count()) === 0,
          'Save attachments to Files is not available on this stand'
        )
        const menu = page.locator('.message_viewer .download_menu').first()
        if (await menu.isVisible().catch(() => false)) {
          await menu.hover()
        }
        await expect(method.first()).toBeVisible({ timeout: T(15000) })
        await jqueryClick(method.first())
        await expect(page.getByTestId('mail-save-to-files-dialog')).toBeVisible({
          timeout: T(20000),
        })
        await clickKoCommand(page, 'mail-save-to-files-ok')
        await expect(page.getByTestId('mail-save-to-files-dialog')).toBeHidden({
          timeout: T(45000),
        })
        console.log('  → Saved attachments to Files')
        await attachScreenshot(page, 'mail-save-files-01')
      })
    })
  })
})
