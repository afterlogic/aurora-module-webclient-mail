const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const { waitForListReady } = sharedHelper('ready')
const {
  listReadyOptions,
  openFirstInboxMessage,
  visibleSubject,
  waitForOpenedMessageView,
} = require('./helpers/mail')


test.describe('Desktop mail', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('opens first message from inbox', async ({ page }) => {
    test.setTimeout(T(120000))

    await gotoLoggedIn(page)

    const opened = await openFirstInboxMessage(page)

    if (!opened) {
      await step('Inspect inbox (empty)', async () => {
        console.log('  → Inbox is empty (mail-empty-folder)')
        await attachScreenshot(page, 'mail-inbox-empty')
      })
      test.skip(true, 'Inbox is empty — put at least one message in the test mailbox')
    }

    await step(`Inspect inbox (found ${opened.count} message(s))`, async () => {
      await attachScreenshot(page, 'mail-inbox-list')
    })

    await step('Wait for message view / subject', async () => {
      await waitForOpenedMessageView(page)
      const subject = opened.viewSubject
      console.log(`  → Opened message subject: ${subject || '(empty subject)'}`)
      await attachScreenshot(page, 'mail-message-opened')
    })

    await step('Message list still present (desktop split pane)', async () => {
      await expect(page.getByTestId('mail-message-list')).toBeVisible()
      await waitForListReady(page, listReadyOptions)
    })
  })

  test('opens first message and shows sender chrome', async ({ page }) => {
    test.setTimeout(T(120000))
    await gotoLoggedIn(page)

    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('Open first message and expect sender', async () => {
      await waitForOpenedMessageView(page)
      await expect(visibleSubject(page)).toBeVisible({ timeout: T(60000) })
      await expect(page.getByTestId('mail-message-sender')).toBeVisible({
        timeout: T(15000),
      })
      await expect(page.getByTestId('mail-action-reply')).toBeVisible()
      await attachScreenshot(page, 'mail-message-chrome')
    })
  })
})
