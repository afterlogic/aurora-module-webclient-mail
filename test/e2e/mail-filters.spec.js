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
const { clickReady, clickNav, confirmOkIfVisible } = sharedHelper('ready')
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
  triggerCheckMail,
  messageItemBySubject,
} = require('./helpers/mail')

const composeTo = getComposeTo()

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

function clickDropdownItem(menuLocator, { pattern, flags = 'i', pickLast = false }) {
  return menuLocator.evaluate(
    (menuEl, opts) => {
      const re = new RegExp(opts.pattern, opts.flags)
      const items = Array.from(menuEl.querySelectorAll('.item')).filter((el) =>
        re.test((el.textContent || '').trim())
      )
      if (!items.length) {
        throw new Error(`Dropdown option not found: /${opts.pattern}/${opts.flags}`)
      }
      const el = opts.pickLast ? items[items.length - 1] : items[0]
      el.scrollIntoView({ block: 'nearest' })
      const $ = window.jQuery || window.$
      if ($) {
        $(el).trigger('click')
        return
      }
      el.click()
    },
    { pattern, flags, pickLast }
  )
}

async function pickCustomSelect(part, optionPattern) {
  await jqueryClick(part.locator('.link'))
  const menu = part.locator('.dropdown_content')
  await expect(menu).toBeVisible({ timeout: T(10000) })
  await clickDropdownItem(menu, {
    pattern: optionPattern.source,
    flags: optionPattern.flags || 'i',
  })
  await expect(menu).toBeHidden({ timeout: T(10000) }).catch(() => undefined)
}

async function pickFilterFolder(folderPart, folderLabel) {
  await jqueryClick(folderPart.locator('.link'))
  const folderMenu = folderPart.locator('.dropdown_content .scroll-inner')
  await expect(folderMenu).toBeVisible({ timeout: T(10000) })
  const escaped = folderLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  await clickDropdownItem(folderMenu, {
    pattern: escaped,
    flags: 'i',
    pickLast: true,
  })
}

async function addAndConfigureSubjectFilter(page, { needle, folderFullName }) {
  const filtersPanel = page.getByTestId('settings-mail-filters')
  const add = filtersPanel.getByTestId('settings-mail-filter-add')
  await expect(add).toBeVisible({ timeout: T(20000) })
  await jqueryClick(add)

  await expect(filtersPanel.getByText(/no filters specified/i)).toBeHidden({
    timeout: T(15000),
  })

  const row = filtersPanel.getByTestId('settings-mail-filter-row').last()
  await expect(row).toBeVisible({ timeout: T(15000) })

  const ifGroup = row.locator('.filter_if_group')
  const thenGroup = row.locator('.filter_then_group')

  await pickCustomSelect(ifGroup.locator('.part.field').nth(0), /subject|тема/i)
  await pickCustomSelect(ifGroup.locator('.part.field').nth(1), /containing|содерж/i)

  const value = row.getByTestId('settings-mail-filter-value')
  await expect(value).toBeVisible({ timeout: T(15000) })
  await value.fill(needle)
  await value.press('Tab')

  await pickCustomSelect(thenGroup.locator('.part.field').nth(0), /move|перемест/i)

  const folderLabel = folderFullName.split('/').pop() || folderFullName
  await pickFilterFolder(thenGroup.locator('.part.field').nth(1), folderLabel)

  await expect(value).toHaveValue(needle)
  await expect(thenGroup).toContainText(folderLabel)
}

async function dismissDiscardChanges(page) {
  const popup = page.locator('.popup:visible').filter({
    hasText: /discard unsaved|несохран/i,
  })
  if (!(await popup.isVisible().catch(() => false))) {
    return false
  }
  await jqueryClick(
    popup.locator('.button').filter({ hasText: /cancel|отмен/i }).first()
  )
  await expect(popup).toBeHidden({ timeout: T(15000) })
  return true
}

async function gotoMailInbox(page) {
  const accountId = await page.evaluate(() => {
    const hash = window.location.hash.replace(/^#/, '')
    const fromSettings = hash.match(/account\/(\d+)/)
    if (fromSettings) {
      return fromSettings[1]
    }
    const fromMail = hash.match(/^mail\/(\d+)/)
    if (fromMail) {
      return fromMail[1]
    }
    return null
  })
  if (accountId) {
    await page.evaluate((id) => {
      window.location.hash = `mail/${id}/INBOX`
    }, accountId)
  } else {
    const headerMail = page.locator('a[href="#mail"]').first()
    if (await headerMail.isVisible().catch(() => false)) {
      await jqueryClick(headerMail)
    } else {
      await clickNav(page, 'nav-mail')
    }
  }
}

async function saveMailFilters(page) {
  await dismissDiscardChanges(page)
  const save = page.getByTestId('settings-mail-filter-save')
  await expect(save).toBeVisible({ timeout: T(15000) })
  await jqueryClick(save)
  const saving = page
    .locator('[data-test-id="settings-mail-filters"] .button')
    .filter({ hasText: /saving|сохран/i })
  await expect(saving).toBeHidden({ timeout: T(90000) })
  await expect(save).toBeVisible({ timeout: T(30000) })
  await confirmOkIfVisible(page, 3000)
}

async function leaveSettingsForMail(page) {
  await expect
    .poll(
      async () => {
        if (await page.getByTestId('mail-message-list').isVisible().catch(() => false)) {
          return true
        }
        await dismissDiscardChanges(page)
        const save = page.getByTestId('settings-mail-filter-save')
        if (await save.isVisible().catch(() => false)) {
          await saveMailFilters(page)
        }
        await gotoMailInbox(page)
        return page.getByTestId('mail-message-list').isVisible().catch(() => false)
      },
      { timeout: T(90000), intervals: [500, 1000, 2000] }
    )
    .toBe(true)
  await waitForInboxList(page)
}

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
      await leaveSettingsForMail(page)
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
      await addAndConfigureSubjectFilter(page, { needle, folderFullName })
      await saveMailFilters(page)
    })

    await step('Send a message whose subject matches the filter', async () => {
      await leaveSettingsForMail(page)
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
            await triggerCheckMail(page)
            await openFolderByName(page, folderName)
            return messageItemBySubject(page, subject)
              .isVisible()
              .catch(() => false)
          },
          { timeout: T(180000), intervals: [3000, 5000, 10000, 15000] }
        )
        .toBe(true)
      await attachScreenshot(page, 'mail-filter-landed')
    })
  })
})
