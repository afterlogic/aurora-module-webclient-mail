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
const { clickReady, confirmOkIfVisible } = sharedHelper('ready')
const {
  openSettings,
  openMailAccountsSettings,
  openAccountTab,
} = moduleHelper('SettingsWebclient', 'settings')
const { waitForInboxList } = require('./helpers/mail')

const composeTo = getComposeTo()

async function dismissUnsavedChangesIfVisible(page) {
  await confirmOkIfVisible(page, 5000)
}

async function openForwardSettings(page) {
  await openSettings(page)
  await openMailAccountsSettings(page)
  const opened = await openAccountTab(page, 'forward')
  if (opened) {
    await dismissUnsavedChangesIfVisible(page)
    await expect(page.getByTestId('settings-mail-forward')).toBeVisible({
      timeout: T(15000),
    })
  }
  return opened
}

async function openAutoresponderSettings(page) {
  await openSettings(page)
  await openMailAccountsSettings(page)
  const opened = await openAccountTab(page, 'autoresponder')
  if (opened) {
    await dismissUnsavedChangesIfVisible(page)
    await expect(page.getByTestId('settings-mail-autoresponder')).toBeVisible({
      timeout: T(15000),
    })
  }
  return opened
}

/** Aurora custom_checkbox — click the text label; sync KO if the native input stays stale. */
async function setMailSettingsCheckbox(page, testId, forId, checked) {
  await dismissUnsavedChangesIfVisible(page)
  const input = page.getByTestId(testId)
  await expect(input).toBeVisible({ timeout: T(15000) })
  if ((await input.isChecked()) === checked) {
    return
  }
  await clickReady(page.locator(`label[for="${forId}"]`))
  if ((await input.isChecked()) !== checked) {
    await input.evaluate((el, value) => {
      const model = window.ko?.dataFor(el)
      if (model?.enable) {
        model.enable(value)
      }
    }, checked)
  }
  await expect(input).toBeChecked({ checked, timeout: T(10000) })
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
      await setMailSettingsCheckbox(
        page,
        'settings-mail-forward-enable',
        'enable_fwd',
        true
      )
      await page.getByTestId('settings-mail-forward-email').fill(composeTo)
      await clickReady(page.getByTestId('settings-mail-forward-save'))
    })

    await step('Re-open tab and expect values persisted', async () => {
      await openAccountTab(page, 'properties')
      await dismissUnsavedChangesIfVisible(page)
      await openAccountTab(page, 'forward')
      await dismissUnsavedChangesIfVisible(page)
      await expect(page.getByTestId('settings-mail-forward')).toBeVisible({
        timeout: T(15000),
      })
      await expect(page.getByTestId('settings-mail-forward-email')).toHaveValue(
        composeTo,
        { timeout: T(15000) }
      )
      await attachScreenshot(page, 'mail-forward-saved')
    })

    await step('Disable forwarding', async () => {
      await setMailSettingsCheckbox(
        page,
        'settings-mail-forward-enable',
        'enable_fwd',
        false
      )
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
      await setMailSettingsCheckbox(
        page,
        'settings-mail-autoresponder-enable',
        'enable_ar',
        true
      )
      await page.getByTestId('settings-mail-autoresponder-subject').fill(subject)
      await page
        .getByTestId('settings-mail-autoresponder-message')
        .fill(`E2E autoresponder ${subject}`)
      await clickReady(page.getByTestId('settings-mail-autoresponder-save'))
    })

    await step('Re-open tab and expect subject persisted', async () => {
      await openAccountTab(page, 'properties')
      await dismissUnsavedChangesIfVisible(page)
      await openAccountTab(page, 'autoresponder')
      await dismissUnsavedChangesIfVisible(page)
      await expect(page.getByTestId('settings-mail-autoresponder')).toBeVisible({
        timeout: T(15000),
      })
      await expect(
        page.getByTestId('settings-mail-autoresponder-subject')
      ).toHaveValue(subject, { timeout: T(15000) })
      await attachScreenshot(page, 'mail-autoresponder-saved')
    })

    await step('Disable autoresponder', async () => {
      await setMailSettingsCheckbox(
        page,
        'settings-mail-autoresponder-enable',
        'enable_ar',
        false
      )
      await clickReady(page.getByTestId('settings-mail-autoresponder-save'))
    })
  })
})
