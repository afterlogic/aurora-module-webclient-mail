const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, fieldControl, hasCredentials, getComposeTo } = sharedHelper('login')
const composeTo = getComposeTo()
const composeCc = process.env.E2E_COMPOSE_CC || composeTo
const composeBcc = process.env.E2E_COMPOSE_BCC || composeTo
const { waitForListReady, clickReady } = sharedHelper('ready')
const {
  fillComposeRecipient,
  closeComposeWithoutSending,
  listReadyOptions,
} = require('./helpers/mail')


test.describe('Desktop mail compose CC/BCC', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('shows CC/BCC fields, fills them, discards without sending', async ({
    page,
  }) => {
    test.setTimeout(T(180000))
    const subject = `E2E cc-bcc ${Date.now()}`

    await gotoLoggedIn(page)

    await step('Open compose', async () => {
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(60000),
      })
      await waitForListReady(page, listReadyOptions)
      await clickReady(page.getByTestId('mail-compose-fab'))
      await expect(page.getByTestId('mail-compose')).toBeVisible({
        timeout: T(15000),
      })
    })

    await step('Show and fill To / CC / BCC', async () => {
      await fillComposeRecipient(page, composeTo, 'mail-compose-to')

      await expect(page.getByTestId('mail-compose-show-cc')).toBeVisible()
      await clickReady(page.getByTestId('mail-compose-show-cc'))
      await expect(page.getByTestId('mail-compose-cc')).toBeVisible({
        timeout: T(10000),
      })
      await fillComposeRecipient(page, composeCc, 'mail-compose-cc')

      await expect(page.getByTestId('mail-compose-show-bcc')).toBeVisible()
      await clickReady(page.getByTestId('mail-compose-show-bcc'))
      await expect(page.getByTestId('mail-compose-bcc')).toBeVisible({
        timeout: T(10000),
      })
      await fillComposeRecipient(page, composeBcc, 'mail-compose-bcc')

      await fieldControl(page, 'mail-compose-subject').fill(subject)
      console.log(`  → To/CC/BCC filled, subject: ${subject}`)
      await attachScreenshot(page, 'compose-cc-bcc-01')
    })

    await step('Discard compose', async () => {
      await closeComposeWithoutSending(page)
      await attachScreenshot(page, 'compose-cc-bcc-02-discarded')
    })
  })
})
