const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { loginAsTestUser, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const {
  FOLDER_TYPES,
  openFolder,
  waitForInboxList,
} = require('./helpers/mail')


test.describe('Desktop mail folders', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('switches Inbox / Sent / Trash / Spam / Inbox', async ({ page }) => {
    test.setTimeout(180000)

    await loginAsTestUser(page)
    await waitForInboxList(page)

    for (const folderType of [
      FOLDER_TYPES.SENT,
      FOLDER_TYPES.TRASH,
      FOLDER_TYPES.SPAM,
      FOLDER_TYPES.INBOX,
    ]) {
      await step(`Open folder ${folderType}`, async () => {
        await openFolder(page, folderType)
        await expect(page.getByTestId('mail-message-list')).toBeVisible({
          timeout: 30000,
        })
        console.log(`  → Folder ${folderType} ready`)
      })
    }

    await attachScreenshot(page, 'mail-folders-done')
  })
})
