const path = require('path')
const { sharedHelper, moduleHelper } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const { clickNav } = sharedHelper('ready')
const {
  openSettings,
  openMailAccountsSettings,
  openAccountTab,
} = moduleHelper('SettingsWebclient', 'settings')
const {
  waitForInboxList,
  openFirstInboxMessage,
  openFolderByName,
  clickMoveToFolder,
  createFolderInSettings,
  renameFolderInSettings,
  deleteFolderInSettings,
} = require('./helpers/mail')


async function openManageFolders(page) {
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

async function mailFolderLocator(page, folderName) {
  return page
    .locator('[data-test-id="mail-folder"]')
    .filter({ hasText: folderName })
    .first()
}

test.describe('Desktop mail custom folders', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test('creates a custom folder, moves a message, renames and deletes the folder', async ({
    page,
  }) => {
    test.setTimeout(T(240000))
    const folderName = `e2e-fldr-${Date.now()}`
    const renamed = `${folderName}-r`

    await gotoLoggedIn(page)
    await waitForInboxList(page)

    await step('Create folder in Settings → Folders', async () => {
      await openManageFolders(page)
      await createFolderInSettings(page, folderName)
    })

    await step('Folder appears in Mail tree', async () => {
      await clickNav(page, 'nav-mail')
      await waitForInboxList(page)
      await expect(await mailFolderLocator(page, folderName)).toBeVisible({
        timeout: T(30000),
      })
    })

    const folderEl = await mailFolderLocator(page, folderName)
    const fullName =
      (await folderEl.getAttribute('data-folder-fullname')) || folderName

    const opened = await openFirstInboxMessage(page)
    if (opened) {
      await step('Move opened message into custom folder', async () => {
        await clickMoveToFolder(page, [fullName, folderName])
        await attachScreenshot(page, 'mail-custom-folder-moved')
      })

      await step('Message is in custom folder', async () => {
        await openFolderByName(page, folderName)
        const subject = opened.viewSubject
        if (subject) {
          await expect(
            page.getByTestId('mail-message-item').filter({ hasText: subject })
          ).toBeVisible({ timeout: T(60000) })
        } else {
          await expect(page.getByTestId('mail-message-item').first()).toBeVisible({
            timeout: T(30000),
          })
        }
      })

      await step('Move message back to Inbox so the folder can be deleted', async () => {
        const item = page.getByTestId('mail-message-item').first()
        await item.click()
        await clickMoveToFolder(page, ['INBOX', 'Inbox'])
      })
    }

    await step('Rename folder in Settings', async () => {
      await openManageFolders(page)
      await renameFolderInSettings(page, folderName, renamed)
    })

    await step('Delete renamed folder', async () => {
      await deleteFolderInSettings(page, renamed)
      await attachScreenshot(page, 'mail-custom-folder-deleted')
    })
  })
})
