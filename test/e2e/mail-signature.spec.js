const path = require('path')
const { sharedHelper, moduleHelper } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const { clickReady, clickNav } = sharedHelper('ready')
const {
  openSettings,
  openMailAccountsSettings,
  openAccountTab,
} = moduleHelper('SettingsWebclient', 'settings')
const { waitForInboxList, fillComposeBody } = require('./helpers/mail')


async function openSignatureSettings(page) {
  await openSettings(page)
  await openMailAccountsSettings(page)
  test.skip(
    !(await openAccountTab(page, 'signature')),
    'Signature tab is not available on this stand'
  )
  await expect(page.getByTestId('settings-mail-signature')).toBeVisible({
    timeout: T(20000),
  })
}

test.describe('Desktop mail signature', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test('saves a signature and shows it in compose', async ({ page }) => {
    test.setTimeout(T(180000))
    const marker = `e2e-sig-${Date.now()}`

    await gotoLoggedIn(page)
    await waitForInboxList(page)
    await openSignatureSettings(page)

    await step('Enable signature and save marker text', async () => {
      await clickReady(page.getByTestId('settings-mail-signature-on'))
      const editorRoot = page.getByTestId('settings-mail-signature')
      const iframe = editorRoot.locator('iframe').first()
      await iframe.waitFor({ state: 'visible', timeout: T(15000) }).catch(() => undefined)
      if ((await iframe.count()) > 0) {
        const body = editorRoot.frameLocator('iframe').first().locator('body')
        await body.click({ timeout: T(15000) })
        await body.fill(marker)
      } else {
        await fillComposeBody(page, marker)
      }
      await clickReady(page.getByTestId('settings-mail-signature-save'))
      await expect(page.getByTestId('settings-mail-signature-save')).toBeVisible({
        timeout: T(30000),
      })
    })

    await step('Open compose and expect signature text', async () => {
      await clickNav(page, 'nav-mail')
      await waitForInboxList(page)
      await clickReady(page.getByTestId('mail-compose-fab'))
      await expect(page.getByTestId('mail-compose')).toBeVisible({
        timeout: T(15000),
      })
      const compose = page.getByTestId('mail-compose-body')
      const iframe = compose.locator('iframe').first()
      if ((await iframe.count()) > 0) {
        await expect(
          compose.frameLocator('iframe').first().locator('body')
        ).toContainText(marker, { timeout: T(20000) })
      } else {
        await expect(compose).toContainText(marker, { timeout: T(20000) })
      }
      await attachScreenshot(page, 'mail-signature-in-compose')
      await page.keyboard.press('Escape')
    })

    await step('Turn signature off so later tests stay clean', async () => {
      await openSignatureSettings(page)
      await clickReady(page.getByTestId('settings-mail-signature-off'))
      await clickReady(page.getByTestId('settings-mail-signature-save'))
    })
  })
})
