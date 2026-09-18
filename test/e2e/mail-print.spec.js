const path = require('path')
const { sharedHelper } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const {
  ensureInboxHasMessage,
  openFirstInboxMessage,
  openMailMoreMenu,
  visibleSubject,
  waitForOpenedMessageView,
} = require('./helpers/mail')

test.describe('Desktop mail print', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test('opens print preview window and calls print', async ({
    page,
  }) => {
    test.setTimeout(T(180000))

    await page.context().addInitScript(() => {
      window.__auroraPrintCalls = 0
      window.print = () => {
        window.__auroraPrintCalls += 1
      }
    })

    await gotoLoggedIn(page)
    await ensureInboxHasMessage(page)
    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('Open first message', async () => {
      await waitForOpenedMessageView(page)
      await attachScreenshot(page, 'mail-print-01-message')
    })

    const subject = (await visibleSubject(page).innerText().catch(() => '')).trim()

    await step('Run Print from More menu', async () => {
      const more = await openMailMoreMenu(page)
      const printItem = more
        .getByTestId('mail-menu-print')
        .or(more.locator('.dropdown_content .item.print').first())
        .first()
      await expect(printItem).toBeVisible({ timeout: T(15000) })

      const popupPromise = page.context().waitForEvent('page', {
        timeout: T(20000),
      })
      await printItem.click()
      const popup = await popupPromise

      await popup.waitForLoadState('domcontentloaded').catch(() => undefined)
      await expect
        .poll(
          async () => popup.evaluate(() => window.__auroraPrintCalls || 0).catch(() => 0),
          { timeout: T(15000), intervals: [200, 400, 800] }
        )
        .toBe(1)

      if (subject) {
        await expect(popup).toHaveTitle(new RegExp(subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      }

      await expect
        .poll(
          async () => {
            const text = await popup.locator('body').innerText().catch(() => '')
            return text.trim().length
          },
          { timeout: T(15000), intervals: [200, 400, 800] }
        )
        .toBeGreaterThan(0)

      await attachScreenshot(page, 'mail-print-02-menu')
      await popup.close().catch(() => undefined)
    })
  })
})
