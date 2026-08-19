const path = require('path')
const { sharedHelper } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const {
  gotoLoggedIn,
  step,
  attachScreenshot,
  hasCredentials,
} = sharedHelper('login')
const {
  openFirstInboxMessage,
  ensureInboxHasMessage,
  visibleSubject,
} = require('./helpers/mail')

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

test.describe('Desktop mail message window', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test.describe('New window', () => {
    test('opens message in a new window and uses prev/next', async ({
      page,
    }) => {
      test.setTimeout(T(240000))
      await gotoLoggedIn(page)
      await ensureInboxHasMessage(page)
      const opened = await openFirstInboxMessage(page)
      test.skip(!opened, 'Inbox is empty')

      await step('Open in new window', async () => {
        const openNew = page.getByTestId('mail-open-new-window')
        await expect(openNew).toBeVisible({ timeout: T(15000) })
        const popupPromise = page.context().waitForEvent('page', {
          timeout: T(20000),
        })
        await openNew.click()
        const popup = await popupPromise
        await popup.waitForLoadState('domcontentloaded').catch(() => undefined)
        await expect(popup.getByTestId('mail-message-view')).toBeVisible({
          timeout: T(60000),
        })
        console.log('  → New window shows mail-message-view')
        await attachScreenshot(popup, 'mail-new-window-01')

        const next = popup.getByTestId('mail-message-next')
        const prev = popup.getByTestId('mail-message-prev')
        const nextEnabled = await next
          .locator(
            ':scope:not(.disabled):not(.command-disabled):not(.unavailable)'
          )
          .isVisible()
          .catch(() => false)
        const prevEnabled = await prev
          .locator(
            ':scope:not(.disabled):not(.command-disabled):not(.unavailable)'
          )
          .isVisible()
          .catch(() => false)
        if (!nextEnabled && !prevEnabled) {
          console.log(
            '  → Prev/Next disabled (single message) — new window is enough'
          )
          await popup.close().catch(() => undefined)
          return
        }

        const before = (
          await visibleSubject(popup).innerText().catch(() => '')
        ).trim()
        const nav = nextEnabled ? next : prev
        await jqueryClick(nav)
        await expect
          .poll(
            async () =>
              (await visibleSubject(popup).innerText().catch(() => '')).trim(),
            { timeout: T(30000), intervals: [400, 800, 1500] }
          )
          .not.toBe(before)
        console.log(`  → Prev/Next changed subject from "${before}"`)
        await attachScreenshot(popup, 'mail-new-window-02-nav')
        await popup.close().catch(() => undefined)
      })
    })
  })
})
