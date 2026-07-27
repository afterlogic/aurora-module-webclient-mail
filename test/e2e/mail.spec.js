const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { loginAsTestUser, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const { waitForListReady, clickReady } = sharedHelper('ready')
const { listReadyOptions, waitForInboxList } = require('./helpers/mail')


test.describe('Desktop mail', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('opens first message from inbox', async ({ page }) => {
    test.setTimeout(120000)

    await loginAsTestUser(page)

    await step('Wait for mail message list', async () => {
      await waitForInboxList(page)
    })

    const messageItems = page.getByTestId('mail-message-item')
    const count = await messageItems.count()

    await step(`Inspect inbox (found ${count} message(s))`, async () => {
      if (count === 0) {
        console.log('  → Inbox is empty (mail-empty-folder)')
        await attachScreenshot(page, 'mail-inbox-empty')
        return
      }
      await attachScreenshot(page, 'mail-inbox-list')
    })

    test.skip(
      count === 0,
      'Inbox is empty — put at least one message in the test mailbox'
    )

    await step('Open first message in the list', async () => {
      await clickReady(messageItems.first())
    })

    await step('Wait for message view / subject', async () => {
      await expect(page.getByTestId('mail-message-view')).toBeVisible({
        timeout: 30000,
      })
      const subjectEl = page.locator(
        '[data-test-id="mail-message-subject"]:visible'
      )
      await expect(subjectEl).toBeVisible({
        timeout: 60000,
      })
      const subject = (await subjectEl.innerText()).trim()
      console.log(`  → Opened message subject: ${subject || '(empty subject)'}`)
      await attachScreenshot(page, 'mail-message-opened')
    })

    await step('Message list still present (desktop split pane)', async () => {
      await expect(page.getByTestId('mail-message-list')).toBeVisible()
      await waitForListReady(page, listReadyOptions)
    })
  })

  test('opens first message and shows sender chrome', async ({ page }) => {
    test.setTimeout(120000)
    await loginAsTestUser(page)
    await waitForInboxList(page)

    const items = page.getByTestId('mail-message-item')
    test.skip((await items.count()) === 0, 'Inbox is empty')

    await step('Open first message and expect sender', async () => {
      await clickReady(items.first())
      await expect(page.getByTestId('mail-message-view')).toBeVisible({
        timeout: 30000,
      })
      await expect(
        page.locator('[data-test-id="mail-message-subject"]:visible').first()
      ).toBeVisible({ timeout: 60000 })
      await expect(page.getByTestId('mail-message-sender')).toBeVisible({
        timeout: 15000,
      })
      await expect(page.getByTestId('mail-action-reply')).toBeVisible()
      await attachScreenshot(page, 'mail-message-chrome')
    })
  })
})
