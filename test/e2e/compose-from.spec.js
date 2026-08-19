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
  fieldControl,
  hasCredentials,
} = sharedHelper('login')
const { clickReady, clickNav } = sharedHelper('ready')
const {
  waitForInboxList,
  closeComposeWithoutSending,
  confirmOkIfVisible,
} = require('./helpers/mail')
const {
  openSettings,
  openMailAccountsSettings,
  addIdentityLink,
  createIdentityDialog,
  identityListItem,
  removeIdentityLink,
} = moduleHelper('SettingsWebclient', 'settings')

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

test.describe('Desktop mail compose From', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test.describe('Sender select', () => {
    test('changes compose From when a second sender exists', async ({
      page,
    }) => {
      test.setTimeout(T(180000))
      await gotoLoggedIn(page)
      await waitForInboxList(page)

      const identityName = `E2E From ${Date.now()}`
      let createdIdentity = false

      await step('Open compose', async () => {
        await clickReady(page.getByTestId('mail-compose-fab'))
        await expect(page.getByTestId('mail-compose')).toBeVisible({
          timeout: T(15000),
        })
      })

      const from = page.getByTestId('mail-compose-from')
      const fromVisible = await from
        .waitFor({ state: 'visible', timeout: T(3000) })
        .then(() => true)
        .catch(() => false)

      if (!fromVisible) {
        await step('Add a second identity so From becomes a select', async () => {
          await closeComposeWithoutSending(page)
          await openSettings(page)
          await openMailAccountsSettings(page)
          const addIdentity = addIdentityLink(page)
          await expect(addIdentity).toBeVisible({ timeout: T(15000) })
          await jqueryClick(addIdentity)
          await expect(createIdentityDialog(page)).toBeVisible({
            timeout: T(15000),
          })
          const nameInput = fieldControl(page, 'settings-identity-name')
          await expect(nameInput).toBeVisible({ timeout: T(15000) })
          await nameInput.fill('')
          await nameInput.pressSequentially(identityName, { delay: 15 })
          await jqueryClick(page.getByTestId('settings-identity-save'))
          await expect(createIdentityDialog(page)).toBeHidden({
            timeout: T(30000),
          })
          await expect(identityListItem(page, identityName)).toBeVisible({
            timeout: T(30000),
          })
          createdIdentity = true
          await clickNav(page, 'nav-mail')
          await waitForInboxList(page)
          await clickReady(page.getByTestId('mail-compose-fab'))
          await expect(page.getByTestId('mail-compose')).toBeVisible({
            timeout: T(15000),
          })
        })
      }

      await step('Switch From to another sender', async () => {
        await expect(from).toBeVisible({ timeout: T(15000) })
        const options = from.locator('option')
        await expect
          .poll(async () => options.count(), { timeout: T(15000) })
          .toBeGreaterThanOrEqual(2)
        const current = await from.inputValue()
        const count = await options.count()
        let nextValue = ''
        for (let i = 0; i < count; i++) {
          const value = await options.nth(i).getAttribute('value')
          if (value && value !== current) {
            nextValue = value
            break
          }
        }
        expect(
          nextValue,
          'Compose From has no alternate sender value'
        ).toBeTruthy()
        await from.selectOption(nextValue)
        await expect(from).toHaveValue(nextValue, { timeout: T(10000) })
        console.log(`  → From ${current} → ${nextValue}`)
        await attachScreenshot(page, 'mail-compose-from-01')
      })

      await closeComposeWithoutSending(page)

      if (createdIdentity) {
        await step('Remove the identity created for this test', async () => {
          await openSettings(page)
          await openMailAccountsSettings(page)
          const item = identityListItem(page, identityName)
          await expect(item).toBeVisible({ timeout: T(15000) })
          await clickReady(item)
          const remove = removeIdentityLink(page)
          await expect(remove).toBeVisible({ timeout: T(15000) })
          await jqueryClick(remove)
          await confirmOkIfVisible(page)
          await expect(item).toBeHidden({ timeout: T(30000) })
        })
      }
    })
  })
})
