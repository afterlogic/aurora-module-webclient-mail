const path = require('path')
const { sharedHelper, moduleHelper } = require(path.join(
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
  getComposeTo,
} = sharedHelper('login')
const { clickReady } = sharedHelper('ready')
const {
  openSettings,
  openMailAccountsSettings,
  openAccountTab,
} = moduleHelper('SettingsWebclient', 'settings')
const { waitForInboxList } = require('./helpers/mail')

const composeTo = getComposeTo()

async function openForwardSettings(page) {
  await openSettings(page)
  await openMailAccountsSettings(page)
  return openAccountTab(page, 'forward')
}

async function openAutoresponderSettings(page) {
  await openSettings(page)
  await openMailAccountsSettings(page)
  return openAccountTab(page, 'autoresponder')
}

test.describe('Desktop mail forwarding and autoresponder', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test('enables forwarding, saves, then disables it', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await waitForInboxList(page)
    test.skip(
      !(await openForwardSettings(page)),
      'Forward tab is not available on this stand'
    )

    await step('Enable forwarding and save', async () => {
      await page.getByTestId('settings-mail-forward-enable').check({ force: true })
      await page.getByTestId('settings-mail-forward-email').fill(composeTo)
      await clickReady(page.getByTestId('settings-mail-forward-save'))
    })

    await step('Re-open tab and expect values persisted', async () => {
      await openAccountTab(page, 'properties')
      await openAccountTab(page, 'forward')
      await expect(page.getByTestId('settings-mail-forward-email')).toHaveValue(
        composeTo,
        { timeout: T(15000) }
      )
      await attachScreenshot(page, 'mail-forward-saved')
    })

    await step('Disable forwarding', async () => {
      await page.getByTestId('settings-mail-forward-enable').uncheck({ force: true })
      await clickReady(page.getByTestId('settings-mail-forward-save'))
    })
  })

  test('enables autoresponder, saves, then disables it', async ({ page }) => {
    test.setTimeout(T(180000))
    const subject = `e2e-ar-${Date.now()}`

    await gotoLoggedIn(page)
    await waitForInboxList(page)
    test.skip(
      !(await openAutoresponderSettings(page)),
      'Autoresponder tab is not available on this stand'
    )

    await step('Enable autoresponder and save', async () => {
      await page
        .getByTestId('settings-mail-autoresponder-enable')
        .check({ force: true })
      await page.getByTestId('settings-mail-autoresponder-subject').fill(subject)
      await page
        .getByTestId('settings-mail-autoresponder-message')
        .fill(`E2E autoresponder ${subject}`)
      await clickReady(page.getByTestId('settings-mail-autoresponder-save'))
    })

    await step('Re-open tab and expect subject persisted', async () => {
      await openAccountTab(page, 'properties')
      await openAccountTab(page, 'autoresponder')
      await expect(
        page.getByTestId('settings-mail-autoresponder-subject')
      ).toHaveValue(subject, { timeout: T(15000) })
      await attachScreenshot(page, 'mail-autoresponder-saved')
    })

    await step('Disable autoresponder', async () => {
      await page
        .getByTestId('settings-mail-autoresponder-enable')
        .uncheck({ force: true })
      await clickReady(page.getByTestId('settings-mail-autoresponder-save'))
    })
  })
})
