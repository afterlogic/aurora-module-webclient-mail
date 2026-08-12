const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const {
  FOLDER_TYPES,
  openFirstInboxMessage,
  openFolderByType,
  expectComposeOpen,
  closeComposeWithoutSending,
  readComposeSubject,
  waitForOpenedMessageView,
  clickMessageListItem,
} = require('./helpers/mail')
const { clickReady } = sharedHelper('ready')


test.describe('Desktop mail forward as attachment', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('opens compose via Forward as Attachment', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)

    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('Wait for message fully loaded (More menu stays disabled until then)', async () => {
      // moreCommand.canExecute === isCurrentMessageLoaded; ko dropdown ignores
      // clicks while .disabled / .command-disabled (fControlClick in koBindings.js).
      await waitForOpenedMessageView(page)
      await expect(
        page.locator(
          '[data-test-id="mail-action-reply"]:visible:not(.disabled):not(.command-disabled)'
        )
      ).toBeVisible({ timeout: T(60000) })
    })

    await step('Overflow → Forward as Attachment', async () => {
      await clickReady(page.getByTestId('mail-message-more'))
      await expect(page.locator('.item.more.expand')).toBeVisible({
        timeout: T(10000),
      })
      const action = page.locator(
        '[data-test-id="mail-menu-forwardAsAttachment"]:visible'
      )
      await expect(action).toBeVisible({ timeout: T(10000) })
      await clickReady(action)
      await expectComposeOpen(page)
      const subject = await readComposeSubject(page)
      console.log(`  → Compose subject: ${subject}`)
      await attachScreenshot(page, 'mail-fwd-attach-01')
    })

    await closeComposeWithoutSending(page)
  })

  test('opens compose via Resend from Sent', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)

    await step('Open Sent and first message', async () => {
      await openFolderByType(page, FOLDER_TYPES.SENT)
      const items = page.getByTestId('mail-message-item')
      test.skip((await items.count()) === 0, 'Sent is empty')
      await clickMessageListItem(page, items.first())
    })

    await step('Wait for message fully loaded', async () => {
      await waitForOpenedMessageView(page)
      await expect(
        page.locator(
          '[data-test-id="mail-action-resend"]:visible:not(.disabled):not(.command-disabled)'
        )
      ).toBeVisible({ timeout: T(60000) })
    })

    await step('Toolbar → Resend', async () => {
      await clickReady(page.locator('[data-test-id="mail-action-resend"]:visible'))
      await expectComposeOpen(page)
      const subject = await readComposeSubject(page)
      console.log(`  → Resend compose subject: ${subject}`)
      await attachScreenshot(page, 'mail-resend-01')
    })

    await closeComposeWithoutSending(page)
  })
})
