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
const { clickReady } = sharedHelper('ready')
const { waitForInboxList, openFolderByName } = require('./helpers/mail')

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

test.describe('Desktop mail notes', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test.describe('Notes folder', () => {
    test('creates a note in the Notes folder', async ({ page }) => {
      test.setTimeout(T(180000))
      await gotoLoggedIn(page)
      await waitForInboxList(page)

      const noteText = `E2E note ${Date.now()}`

      await step('Open Notes and create a note', async () => {
        await openFolderByName(page, 'Notes')
        await clickReady(page.getByTestId('mail-compose-fab'))
        const body = page.getByTestId('mail-note-body')
        await expect(body).toBeVisible({ timeout: T(20000) })
        await body.click()
        await body.fill('')
        await body.pressSequentially(noteText, { delay: 15 })
        await jqueryClick(page.getByTestId('mail-note-save'))
        await expect(
          page
            .getByTestId('mail-message-item')
            .filter({ hasText: noteText })
            .first()
        ).toBeVisible({ timeout: T(60000) })
        console.log(`  → Note created: ${noteText}`)
        await attachScreenshot(page, 'mail-note-01')
      })
    })
  })
})
