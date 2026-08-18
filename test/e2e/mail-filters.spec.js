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
  getComposeTo,
} = sharedHelper('login')
const { clickReady, clickNav } = sharedHelper('ready')
const {
  openSettings,
  openMailAccountsSettings,
  openAccountTab,
} = moduleHelper('SettingsWebclient', 'settings')
const {
  waitForInboxList,
  fillComposeRecipient,
  sendCompose,
  openFolderByName,
  createFolderInSettings,
} = require('./helpers/mail')

const composeTo = getComposeTo()

async function openFiltersSettings(page) {
  await openSettings(page)
  await openMailAccountsSettings(page)
  test.skip(
    !(await openAccountTab(page, 'filters')),
    'Filters tab is not available on this stand'
  )
  await expect(page.getByTestId('settings-mail-filters')).toBeVisible({
    timeout: T(20000),
  })
}

async function openFoldersSettings(page) {
  await openSettings(page)
  await openMailAccountsSettings(page)
  test.skip(
    !(await openAccountTab(page, 'folders')),
    'Folders tab is not available on this stand'
  )
  await expect(page.getByTestId('settings-mail-add-folder')).toBeVisible({
    timeout: T(20000),
  })
}

test.describe('Desktop mail filters', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test('filter by subject moves a message into a custom folder', async ({
    page,
  }) => {
    test.setTimeout(T(240000))
    const folderName = `e2e-flt-${Date.now()}`
    const needle = `e2e-filter-${Date.now()}`
    const subject = `${needle} inbox`

    await gotoLoggedIn(page)
    await waitForInboxList(page)

    await step('Create target folder', async () => {
      await openFoldersSettings(page)
      await createFolderInSettings(page, folderName)
    })

    await step('Add subject filter that moves to the folder', async () => {
      await clickNav(page, 'nav-mail')
      await waitForInboxList(page)
      const folderEl = page
        .locator('[data-test-id="mail-folder"]')
        .filter({ hasText: folderName })
        .first()
      await expect(folderEl).toBeVisible({ timeout: T(30000) })
      const folderFullName =
        (await folderEl.getAttribute('data-folder-fullname')) || folderName

      await openFiltersSettings(page)
      const add = page.getByTestId('settings-mail-filter-add')
      const addVisible = await add
        .waitFor({ state: 'visible', timeout: T(20000) })
        .then(() => true)
        .catch(() => false)
      test.skip(!addVisible, 'Filters tab is not available on this stand')
      await clickReady(add)
      const row = page.getByTestId('settings-mail-filter-row').last()
      await expect(row).toBeVisible({ timeout: T(10000) })

      await row.evaluate(
        (el, opts) => {
          const ko = window.ko
          const model = ko && ko.dataFor(el)
          if (!model) {
            throw new Error('No Knockout filter model on row')
          }
          model.field(2)
          model.condition(0)
          model.filter(opts.needle)
          model.action(3)
          model.folder(opts.folderFullName)
          model.enable(true)
        },
        { needle, folderFullName }
      )

      const value = row.getByTestId('settings-mail-filter-value')
      if (await value.isVisible().catch(() => false)) {
        await value.fill(needle)
      }
      await clickReady(page.getByTestId('settings-mail-filter-save'))
    })

    await step('Send a message whose subject matches the filter', async () => {
      await clickNav(page, 'nav-mail')
      await waitForInboxList(page)
      await clickReady(page.getByTestId('mail-compose-fab'))
      await expect(page.getByTestId('mail-compose')).toBeVisible({
        timeout: T(15000),
      })
      await fillComposeRecipient(page, composeTo)
      await fieldControl(page, 'mail-compose-subject').fill(subject)
      await sendCompose(page)
    })

    await step('Message lands in the filter folder', async () => {
      await expect
        .poll(
          async () => {
            await openFolderByName(page, folderName)
            return page
              .getByTestId('mail-message-item')
              .filter({ hasText: subject })
              .first()
              .isVisible()
              .catch(() => false)
          },
          { timeout: T(120000), intervals: [2000, 4000, 8000] }
        )
        .toBe(true)
      await attachScreenshot(page, 'mail-filter-landed')
    })
  })
})
