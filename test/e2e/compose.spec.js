const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const {
  loginAsTestUser,
  step,
  attachScreenshot,
  fieldControl,
  hasCredentials,
  getComposeTo,
} = sharedHelper('login')
const { clickReady } = sharedHelper('ready')
const {
  waitForInboxList,
  openFolder,
  FOLDER_TYPES,
  fillComposeRecipient,
  sendCompose,
} = require('./helpers/mail')

const composeTo = getComposeTo()

test.describe('Desktop mail compose', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('composes and sends a message', async ({ page }) => {
    test.setTimeout(180000)

    const subject = `E2E desktop compose ${Date.now()}`

    await loginAsTestUser(page)

    await step('Wait for inbox list', async () => {
      await waitForInboxList(page)
      await expect(page.getByTestId('mail-compose-fab')).toBeVisible({
        timeout: 15000,
      })
      await attachScreenshot(page, 'compose-01-inbox')
    })

    await step('Open compose', async () => {
      await clickReady(page.getByTestId('mail-compose-fab'))
      await expect(page.getByTestId('mail-compose')).toBeVisible({
        timeout: 15000,
      })
      await attachScreenshot(page, 'compose-02-form-open')
    })

    await step(`Fill To: ${composeTo}`, async () => {
      await fillComposeRecipient(page, composeTo)
    })

    await step(`Fill Subject: ${subject}`, async () => {
      await fieldControl(page, 'mail-compose-subject').fill(subject)
      await attachScreenshot(page, 'compose-03-filled')
    })

    await step('Send message', async () => {
      await sendCompose(page)
      console.log('  → Send clicked')
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: 30000,
      })
      await attachScreenshot(page, 'compose-04-after-send')
    })

    await step('Open Sent and look for subject', async () => {
      await openFolder(page, FOLDER_TYPES.SENT)
      const sentItem = page
        .getByTestId('mail-message-item')
        .filter({ hasText: subject })
        .first()
      await expect(sentItem).toBeVisible({ timeout: 60000 })
      console.log('  → Sent message found in Sent folder')
      await attachScreenshot(page, 'compose-05-in-sent')
    })
  })
})
