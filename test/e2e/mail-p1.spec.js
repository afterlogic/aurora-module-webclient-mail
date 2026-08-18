const path = require('path')
const { sharedHelper, fixturePath } = require(path.join(
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
const { clickReady } = sharedHelper('ready')
const {
  FOLDER_TYPES,
  waitForInboxList,
  openFirstInboxMessage,
  openFolderByType,
  openFolderByName,
  selectMessageCheckbox,
  clickMailToolbarAction,
  clickKoCommand,
  confirmOkIfVisible,
  fillComposeRecipient,
  fillComposeBody,
  sendCompose,
  waitForComposeAttachmentReady,
  waitForMessageInFolder,
  clickMessageListItem,
  waitForOpenedMessageView,
  visibleSubject,
  closeComposeWithoutSending,
} = require('./helpers/mail')

const composeTo = getComposeTo()
const attachFixturePath = fixturePath('e2e-attach.txt')

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

async function ensureInboxHasMessage(page) {
  await waitForInboxList(page)
  if ((await page.getByTestId('mail-message-item').count()) > 0) {
    return
  }
  const subject = `E2E seed ${Date.now()}`
  await step('Seed inbox with a message', async () => {
    await clickReady(page.getByTestId('mail-compose-fab'))
    await expect(page.getByTestId('mail-compose')).toBeVisible({
      timeout: T(15000),
    })
    await fillComposeRecipient(page, composeTo)
    await fieldControl(page, 'mail-compose-subject').fill(subject)
    await fillComposeBody(page, subject)
    await sendCompose(page)
    await waitForMessageInFolder(page, FOLDER_TYPES.INBOX, subject, {
      timeout: 120000,
    })
  })
}

test.describe('Desktop mail P1', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY in .env.e2e')

  test('marks a list message unread then read', async ({ page }) => {
    test.setTimeout(T(240000))
    await gotoLoggedIn(page)
    await ensureInboxHasMessage(page)

    const items = page.getByTestId('mail-message-item')

    const first = items.first()

    await step('Select first message checkbox', async () => {
      await selectMessageCheckbox(page, first)
      await attachScreenshot(page, 'mail-p1-mark-01-selected')
    })

    await step('Mark as unread', async () => {
      await clickMailToolbarAction(page, 'mail-mark-dropdown')
      await expect(page.getByTestId('mail-mark-unread')).toBeVisible({
        timeout: T(10000),
      })
      await jqueryClick(page.getByTestId('mail-mark-unread'))
      await expect(first).toHaveClass(/unseen/, { timeout: T(30000) })
      console.log('  → Marked unread')
      await attachScreenshot(page, 'mail-p1-mark-02-unread')
    })

    await step('Mark as read', async () => {
      if (!(await first.getByTestId('mail-message-checkbox').locator('.checked, .icon').count())) {
        await selectMessageCheckbox(page, first)
      }
      await clickMailToolbarAction(page, 'mail-mark-read')
      await expect(first).not.toHaveClass(/unseen/, { timeout: T(30000) })
      console.log('  → Marked read')
      await attachScreenshot(page, 'mail-p1-mark-03-read')
    })
  })

  test('opens message in a new window and uses prev/next', async ({ page }) => {
    test.setTimeout(T(240000))
    await gotoLoggedIn(page)
    await ensureInboxHasMessage(page)
    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('Open in new window', async () => {
      const openNew = page.getByTestId('mail-open-new-window')
      await expect(openNew).toBeVisible({ timeout: T(15000) })
      const popupPromise = page.context().waitForEvent('page', {
        timeout: T(20000),
      })
      await openNew.click()
      const popup = await popupPromise
      await popup.waitForLoadState('domcontentloaded').catch(() => undefined)
      await expect(popup.getByTestId('mail-message-view')).toBeVisible({
        timeout: T(60000),
      })
      console.log('  → New window shows mail-message-view')
      await attachScreenshot(popup, 'mail-p1-new-window-01')

      const next = popup.getByTestId('mail-message-next')
      const prev = popup.getByTestId('mail-message-prev')
      const nextEnabled = await next
        .locator(':scope:not(.disabled):not(.command-disabled):not(.unavailable)')
        .isVisible()
        .catch(() => false)
      const prevEnabled = await prev
        .locator(':scope:not(.disabled):not(.command-disabled):not(.unavailable)')
        .isVisible()
        .catch(() => false)
      if (!nextEnabled && !prevEnabled) {
        console.log('  → Prev/Next disabled (single message) — new window is enough')
        await popup.close().catch(() => undefined)
        return
      }

      const before = (await visibleSubject(popup).innerText().catch(() => '')).trim()
      const nav = nextEnabled ? next : prev
      await jqueryClick(nav)
      await expect
        .poll(
          async () => (await visibleSubject(popup).innerText().catch(() => '')).trim(),
          { timeout: T(30000), intervals: [400, 800, 1500] }
        )
        .not.toBe(before)
      console.log(`  → Prev/Next changed subject from "${before}"`)
      await attachScreenshot(popup, 'mail-p1-new-window-02-nav')
      await popup.close().catch(() => undefined)
    })
  })

  test('downloads .eml from More menu', async ({ page }) => {
    test.setTimeout(T(240000))
    await gotoLoggedIn(page)
    await ensureInboxHasMessage(page)
    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('More → Download .eml', async () => {
      await waitForOpenedMessageView(page)
      await clickReady(page.getByTestId('mail-message-more'))
      await expect(page.locator('.item.more.expand')).toBeVisible({
        timeout: T(10000),
      })
      const eml = page.getByTestId('mail-menu-download-eml')
      await expect(eml).toBeVisible({ timeout: T(15000) })
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: T(30000) }),
        jqueryClick(eml),
      ])
      const name = download.suggestedFilename()
      console.log(`  → Download: ${name}`)
      expect(name.toLowerCase()).toMatch(/\.eml$/)
      await attachScreenshot(page, 'mail-p1-eml-01')
    })
  })

  test('empties Spam folder', async ({ page }) => {
    test.setTimeout(T(240000))
    await gotoLoggedIn(page)
    await waitForInboxList(page)

    await step('Ensure Spam has a message', async () => {
      await openFolderByType(page, FOLDER_TYPES.SPAM)
      const spamItems = page.getByTestId('mail-message-item')
      if ((await spamItems.count()) > 0) {
        return
      }
      await openFolderByType(page, FOLDER_TYPES.INBOX)
      const inboxItems = page.getByTestId('mail-message-item')
      test.skip((await inboxItems.count()) === 0, 'Inbox and Spam are empty')
      const opened = await openFirstInboxMessage(page)
      test.skip(!opened, 'Inbox is empty')
      const spamBtn = page.getByTestId('mail-action-toSpam')
      test.skip(
        (await spamBtn.count()) === 0 ||
          !(await spamBtn.isVisible().catch(() => false)),
        'Spam action not available'
      )
      await clickMailToolbarAction(page, 'mail-action-toSpam')
      await openFolderByType(page, FOLDER_TYPES.SPAM)
    })

    const emptyBtn = page.getByTestId('mail-empty-spam-button')
    test.skip(
      !(await emptyBtn.isVisible().catch(() => false)),
      'Empty Spam button is hidden'
    )

    await step('Empty Spam → confirm', async () => {
      await clickReady(emptyBtn)
      await confirmOkIfVisible(page)
      await expect(page.getByTestId('mail-empty-folder')).toBeVisible({
        timeout: T(60000),
      })
      console.log('  → Spam emptied')
      await attachScreenshot(page, 'mail-p1-empty-spam-01')
    })
  })

  test('saves attachments to Files', async ({ page }) => {
    test.setTimeout(T(300000))
    const subject = `E2E save-files ${Date.now()}`
    const fixtureName = 'e2e-attach.txt'

    await gotoLoggedIn(page)
    await waitForInboxList(page)

    await step('Send a message with attachment', async () => {
      await clickReady(page.getByTestId('mail-compose-fab'))
      await expect(page.getByTestId('mail-compose')).toBeVisible({
        timeout: T(15000),
      })
      await fillComposeRecipient(page, composeTo)
      await fieldControl(page, 'mail-compose-subject').fill(subject)
      const fileInput = page
        .locator(
          '[data-test-id="mail-compose-attach"] input[type="file"], .attachments_panel input[type="file"]'
        )
        .first()
      test.skip((await fileInput.count()) === 0, 'Compose attach input not available')
      await fileInput.setInputFiles(attachFixturePath)
      await expect(
        page
          .locator('.attachments_panel, .attachments_container')
          .filter({ hasText: fixtureName })
          .first()
      ).toBeVisible({ timeout: T(60000) })
      await waitForComposeAttachmentReady(page, fixtureName)
      await fillComposeBody(page, `E2E save-to-files ${Date.now()}`)
      await sendCompose(page)
    })

    await step('Open Sent message and Save to Files', async () => {
      const item = await waitForMessageInFolder(page, FOLDER_TYPES.SENT, subject, {
        timeout: 180000,
      })
      await clickMessageListItem(page, item)
      await waitForOpenedMessageView(page)
      const method = page.getByTestId('mail-attachments-download-method')
      test.skip(
        (await method.count()) === 0,
        'Save attachments to Files is not available on this stand'
      )
      const menu = page.locator('.message_viewer .download_menu').first()
      if (await menu.isVisible().catch(() => false)) {
        await menu.hover()
      }
      await expect(method.first()).toBeVisible({ timeout: T(15000) })
      await jqueryClick(method.first())
      await expect(page.getByTestId('mail-save-to-files-dialog')).toBeVisible({
        timeout: T(20000),
      })
      await clickKoCommand(page, 'mail-save-to-files-ok')
      await expect(page.getByTestId('mail-save-to-files-dialog')).toBeHidden({
        timeout: T(45000),
      })
      console.log('  → Saved attachments to Files')
      await attachScreenshot(page, 'mail-p1-save-files-01')
    })
  })

  test('creates a note in the Notes folder', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await waitForInboxList(page)

    const notesFolder = page
      .locator('[data-test-id="mail-folder"]')
      .filter({ hasText: /notes|заметк/i })
      .first()
    test.skip(
      !(await notesFolder.isVisible().catch(() => false)),
      'Notes folder is not available on this stand'
    )

    const noteText = `E2E note ${Date.now()}`

    await step('Open Notes and create a note', async () => {
      await openFolderByName(page, 'Notes')
      await clickReady(page.getByTestId('mail-compose-fab'))
      const body = page.getByTestId('mail-note-body')
      await expect(body).toBeVisible({ timeout: T(20000) })
      await body.click()
      await body.fill('')
      await body.pressSequentially(noteText, { delay: 15 })
      await jqueryClick(page.getByTestId('mail-note-save'))
      await expect(
        page.getByTestId('mail-message-item').filter({ hasText: noteText }).first()
      ).toBeVisible({ timeout: T(60000) })
      console.log(`  → Note created: ${noteText}`)
      await attachScreenshot(page, 'mail-p1-note-01')
    })
  })

  test('changes compose From when a second sender exists', async ({ page }) => {
    test.setTimeout(T(120000))
    await gotoLoggedIn(page)
    await waitForInboxList(page)

    await step('Open compose', async () => {
      await clickReady(page.getByTestId('mail-compose-fab'))
      await expect(page.getByTestId('mail-compose')).toBeVisible({
        timeout: T(15000),
      })
    })

    const from = page.getByTestId('mail-compose-from')
    test.skip(
      !(await from.isVisible().catch(() => false)),
      'Compose From select hidden — only one sender'
    )

    await step('Switch From to another sender', async () => {
      const options = from.locator('option')
      const count = await options.count()
      test.skip(count < 2, 'Compose From has fewer than two senders')
      const current = await from.inputValue()
      let nextValue = ''
      for (let i = 0; i < count; i++) {
        const value = await options.nth(i).getAttribute('value')
        if (value && value !== current) {
          nextValue = value
          break
        }
      }
      test.skip(!nextValue, 'No alternate From value')
      await from.selectOption(nextValue)
      await expect(from).toHaveValue(nextValue, { timeout: T(10000) })
      console.log(`  → From ${current} → ${nextValue}`)
      await attachScreenshot(page, 'mail-p1-from-01')
    })

    await closeComposeWithoutSending(page)
  })
})
