const path = require('path')
const { sharedHelper, moduleHelper } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const { clickNav } = sharedHelper('ready')
const { openSettings } = moduleHelper('SettingsWebclient', 'settings')
const { waitForInboxList } = require('./helpers/mail')
const { openContacts } = moduleHelper('ContactsWebclient', 'contacts')
const { openFiles } = moduleHelper('FilesWebclient', 'files')


test.describe('Desktop header navigation', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test('switches Mail → Contacts → Calendar → Files → Settings and back to Mail', async ({
    page,
  }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await waitForInboxList(page)

    await step('Contacts', async () => {
      await openContacts(page)
      await expect(page.getByTestId('nav-contacts')).toHaveClass(/current/, {
        timeout: T(10000),
      })
    })

    await step('Calendar', async () => {
      const calTab = page.getByTestId('nav-calendar')
      const calVisible = await calTab
        .waitFor({ state: 'visible', timeout: T(5000) })
        .then(() => true)
        .catch(() => false)
      if (!calVisible) {
        // Licensed Calendar module off (expired trial / Disabled) — not a nav bug.
        console.log('  → Calendar tab missing — skip calendar step')
        return
      }
      await clickNav(page, 'nav-calendar')
      await expect(page.getByTestId('calendar-screen')).toBeVisible({
        timeout: T(60000),
      })
      await expect(calTab).toHaveClass(/current/, {
        timeout: T(10000),
      })
    })

    await step('Files', async () => {
      await openFiles(page)
      await expect(page.getByTestId('nav-files')).toHaveClass(/current/, {
        timeout: T(10000),
      })
    })

    await step('Settings', async () => {
      await openSettings(page)
      await expect(page.getByTestId('nav-settings')).toHaveClass(/current/, {
        timeout: T(10000),
      })
    })

    await step('Back to Mail', async () => {
      await clickNav(page, 'nav-mail')
      await waitForInboxList(page)
      await expect(page.getByTestId('nav-mail')).toHaveClass(/current/, {
        timeout: T(10000),
      })
      await attachScreenshot(page, 'header-nav-done')
    })
  })
})
