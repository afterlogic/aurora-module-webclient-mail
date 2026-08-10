const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { loginAsTestUser, step, attachScreenshot, fieldControl, hasCredentials, getComposeTo } = sharedHelper('login')
const composeTo = getComposeTo()
const { clickReady } = sharedHelper('ready')
const {
  FOLDER_TYPES,
  waitForInboxList,
  openFolderByType,
  fillComposeRecipient,
  sendCompose,
  fillComposeBody,
  visibleSubject,
} = require('./helpers/mail')

const attachFixturePath = fixturePath('e2e-attach.txt')
const fixtureName = 'e2e-attach.txt'

test.describe('Desktop mail attachments', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('composes with attachment, opens it in Sent', async ({ page }) => {
    test.setTimeout(T(240000))

    const subject = `E2E attach ${Date.now()}`
    const bodyText = `E2E attach body ${Date.now()}`

    await loginAsTestUser(page)
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
      await openFolderByType(page, FOLDER_TYPES.SENT)

      const item = page
        .getByTestId('mail-message-item')
        .filter({ hasText: subject })
        .first()
      await expect(item).toBeVisible({ timeout: T(60000) })
      await clickReady(item)

      await expect(page.getByTestId('mail-message-view')).toBeVisible({
        timeout: T(30000),
      })
      await expect(visibleSubject(page)).toBeVisible({ timeout: T(60000) })
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
