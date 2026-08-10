const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { loginAsTestUser, step, attachScreenshot, fieldControl, hasCredentials, getComposeTo } = sharedHelper('login')
const composeTo = getComposeTo()
const { clickReady } = sharedHelper('ready')
const {
  FOLDER_TYPES,
  waitForInboxList,
  expectComposeOpen,
  readComposeSubject,
  openFolderByType,
  fillComposeRecipient,
  sendCompose,
  closeComposeWithoutSending,
  fillComposeBody,
  waitForDraftSavedReport,
} = require('./helpers/mail')


async function openCompose(page) {
  await waitForInboxList(page)
  await clickReady(page.getByTestId('mail-compose-fab'))
  await expectComposeOpen(page)
}

async function saveDraft(page) {
  await clickReady(page.getByTestId('mail-compose-save'))
  await waitForDraftSavedReport(page)
}

async function openDraftsAndFind(page, subject) {
  await openFolderByType(page, FOLDER_TYPES.DRAFTS)
  // Force list reload — draft may land after IMAP round-trip.
  const draftsFolder = page
    .locator(`[data-test-id="mail-folder"][data-folder-type="drafts"]`)
    .first()
  await clickReady(draftsFolder)
  const item = page
    .getByTestId('mail-message-item')
    .filter({ hasText: subject })
    .first()
  await expect(item).toBeVisible({ timeout: T(90000) })
  return item
}

/** Desktop: drafts open compose on double-click (CSelector jQuery handler). */
async function openDraftInCompose(page, item) {
  // Single click selects (preview). Real jQuery dblclick loads the draft into ComposePopup.
  await clickReady(item)
  await item.evaluate((el) => {
    if (typeof window.jQuery === 'function') {
      window.jQuery(el).trigger('dblclick')
    } else {
      el.dispatchEvent(
        new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window })
      )
    }
  })
  await expectComposeOpen(page)
  // Draft body/subject load asynchronously via GetMessage.
  await expect
    .poll(async () => fieldControl(page, 'mail-compose-subject').inputValue(), {
      timeout: T(60000),
    })
    .not.toBe('')
}

test.describe('Desktop mail compose draft', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('saves draft and reopens it from Drafts', async ({ page }) => {
    test.setTimeout(T(240000))

    const subject = `E2E draft ${Date.now()}`
    const bodyText = `E2E draft body ${Date.now()}`

    await loginAsTestUser(page)
    await openCompose(page)

    await step('Fill draft To / Subject / Body', async () => {
      await fillComposeRecipient(page, composeTo)
      await fieldControl(page, 'mail-compose-subject').fill(subject)
      await fillComposeBody(page, bodyText)
      await attachScreenshot(page, 'mail-draft-01-filled')
    })

    await step('Save draft', async () => {
      await saveDraft(page)
      await expect(page.getByTestId('mail-compose')).toBeVisible({
        timeout: T(15000),
      })
      console.log(`  → Draft saved: ${subject}`)
      await attachScreenshot(page, 'mail-draft-02-saved')
    })

    await step('Leave compose after save', async () => {
      await closeComposeWithoutSending(page)
    })

    await step('Open Drafts and find saved draft', async () => {
      const item = await openDraftsAndFind(page, subject)
      await openDraftInCompose(page, item)
      await expect(fieldControl(page, 'mail-compose-subject')).toHaveValue(subject, {
        timeout: T(15000),
      })
      const openedSubject = await readComposeSubject(page)
      console.log(`  → Reopened draft subject: ${openedSubject}`)
      await attachScreenshot(page, 'mail-draft-03-reopened')
    })
  })

  test('sends opened draft and finds it in Sent', async ({ page }) => {
    test.setTimeout(T(240000))

    const subject = `E2E draft send ${Date.now()}`
    const bodyText = `E2E draft send body ${Date.now()}`

    await loginAsTestUser(page)
    await openCompose(page)

    await step('Fill and save draft', async () => {
      await fillComposeRecipient(page, composeTo)
      await fieldControl(page, 'mail-compose-subject').fill(subject)
      await fillComposeBody(page, bodyText)
      await saveDraft(page)
      console.log(`  → Draft saved: ${subject}`)
    })

    await step('Leave compose', async () => {
      await closeComposeWithoutSending(page)
    })

    await step('Open draft from Drafts and send', async () => {
      const item = await openDraftsAndFind(page, subject)
      await openDraftInCompose(page, item)
      await expect(fieldControl(page, 'mail-compose-subject')).toHaveValue(subject, {
        timeout: T(15000),
      })
      await sendCompose(page)
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(60000),
      })
      console.log(`  → Draft sent: ${subject}`)
      await attachScreenshot(page, 'mail-draft-send-01-after-send')
    })

    await step('Find sent message in Sent', async () => {
      await openFolderByType(page, FOLDER_TYPES.SENT)
      const sentItem = page
        .getByTestId('mail-message-item')
        .filter({ hasText: subject })
        .first()
      await expect(sentItem).toBeVisible({ timeout: T(60000) })
      console.log(`  → Found in Sent: ${subject}`)
      await attachScreenshot(page, 'mail-draft-send-02-sent')
    })
  })

  test('minimizes unsaved compose on close, then save-and-close leaves', async ({
    page,
  }) => {
    test.setTimeout(T(120000))

    await loginAsTestUser(page)
    await openCompose(page)

    await step('Type subject without saving', async () => {
      await fieldControl(page, 'mail-compose-subject').fill(
        `E2E discard ${Date.now()}`
      )
    })

    await step('Close → desktop minimizes (not ConfirmPopup)', async () => {
      await page.keyboard.press('Escape')
      const minimized = page.locator('.minimized_compose')
      await expect(minimized).toBeVisible({ timeout: T(15000) })
      await expect(page.getByTestId('mail-compose')).toBeHidden({
        timeout: T(15000),
      })
      console.log('  → Compose minimized after Escape with unsaved changes')
      await attachScreenshot(page, 'mail-draft-discard-01-minimized')
    })

    await step('Save-and-close from minimized bar', async () => {
      const saveAndClose = page
        .getByTestId('mail-compose-save-and-close')
        .or(page.locator('.minimized_compose .item.save_and_close'))
      await saveAndClose.first().click({ force: true })
      await expect(page.locator('.minimized_compose')).toBeHidden({
        timeout: T(30000),
      })
      await expect(page.getByTestId('mail-compose')).toBeHidden({
        timeout: T(15000),
      })
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(30000),
      })
      await attachScreenshot(page, 'mail-draft-discard-02-closed')
    })
  })
})
