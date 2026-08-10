const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { loginAsTestUser, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const {
  openFirstInboxMessage,
  expectComposeOpen,
  closeComposeWithoutSending,
  readComposeSubject,
} = require('./helpers/mail')
const { clickReady } = sharedHelper('ready')


test.describe('Desktop mail forward as attachment', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('opens compose via Forward as Attachment', async ({ page }) => {
    test.setTimeout(T(180000))
    await loginAsTestUser(page)

    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('Overflow → Forward as Attachment', async () => {
      await clickReady(page.getByTestId('mail-message-more'))
      const action = page.getByTestId('mail-menu-forwardAsAttachment')
      test.skip(
        (await action.count()) === 0 ||
          !(await action.isVisible().catch(() => false)),
        'Forward as Attachment not available'
      )
      await clickReady(action)
      await expectComposeOpen(page)
      const subject = await readComposeSubject(page)
      console.log(`  → Compose subject: ${subject}`)
      await attachScreenshot(page, 'mail-fwd-attach-01')
    })

    await closeComposeWithoutSending(page)
  })

  test('opens compose via Resend when available', async ({ page }) => {
    test.setTimeout(T(180000))
    await loginAsTestUser(page)

    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('Toolbar → Resend', async () => {
      const action = page.getByTestId('mail-action-resend')
      test.skip(
        (await action.count()) === 0 ||
          !(await action.isVisible().catch(() => false)),
        'Resend not available on this message'
      )
      await clickReady(action)
      await expectComposeOpen(page)
      const subject = await readComposeSubject(page)
      console.log(`  → Resend compose subject: ${subject}`)
      await attachScreenshot(page, 'mail-resend-01')
    })

    await closeComposeWithoutSending(page)
  })
})
