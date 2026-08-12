const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials, getComposeTo } = sharedHelper('login')
const composeTo = getComposeTo()
const {
  FOLDER_TYPES,
  openFirstInboxMessage,
  readComposeSubject,
  openFolderByType,
  fillComposeRecipient,
  sendCompose,
  waitForInboxList,
  fillComposeBody,
  confirmOkIfVisible,
  visibleSubject,
  clickMailAction,
  clickMailToolbarAction,
  clickMoveToFolder,
  clickReady,
  clickMessageListItem,
  waitForOpenedMessageView,
} = require('./helpers/mail')


test.describe('Desktop mail mutations', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('views message headers from overflow menu', async ({ page }) => {
    test.setTimeout(T(120000))
    await gotoLoggedIn(page)
    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('Wait for message fully loaded (More menu disabled until then)', async () => {
      // moreCommand.canExecute === isCurrentMessageLoaded; viewHeaders additionally
      // requires completelyFilled() — wait for Reply enabled, then for the menu item.
      await waitForOpenedMessageView(page)
      await expect(
        page.locator(
          '[data-test-id="mail-action-reply"]:visible:not(.disabled):not(.command-disabled)'
        )
      ).toBeVisible({ timeout: T(60000) })
    })

    await step('Open headers (desktop opens a popup window)', async () => {
      await clickReady(page.getByTestId('mail-message-more'))
      await expect(page.locator('.item.more.expand')).toBeVisible({
        timeout: T(10000),
      })

      const headers = page.locator('[data-test-id="mail-menu-viewHeaders"]:visible')
      await expect(headers).toBeVisible({ timeout: T(60000) })

      const popupPromise = page
        .context()
        .waitForEvent('page', { timeout: T(15000) })
      await clickReady(headers)
      const popup = await popupPromise
      await popup.waitForLoadState('domcontentloaded').catch(() => undefined)
      const text = (await popup.locator('body').innerText().catch(() => '')).trim()
      console.log(`  → Headers length: ${text.length}`)
      expect(text.length).toBeGreaterThan(0)
      await popup.close().catch(() => undefined)
      await attachScreenshot(page, 'mail-headers-01')
    })
  })

  test('moves message via Move dropdown to Trash', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    const subject = opened.viewSubject

    await step('Move via toolbar dropdown to Trash', async () => {
      const moveBtn = page.getByTestId('mail-action-moveToFolder')
      test.skip((await moveBtn.count()) === 0, 'Move to folder not available')
      console.log(`  → Moving "${subject}" → Trash`)
      await clickMoveToFolder(page, ['Trash', 'INBOX.Trash'])
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(30000),
      })
      await attachScreenshot(page, 'mail-move-01-after')
    })

    await step('Open Trash to confirm destination', async () => {
      await openFolderByType(page, FOLDER_TYPES.TRASH)
      await attachScreenshot(page, 'mail-move-02-trash')
    })
  })

  test('marks message as spam and opens Spam folder', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('Toolbar → Mark as spam', async () => {
      const spam = page.getByTestId('mail-action-toSpam')
      test.skip(
        (await spam.count()) === 0 || !(await spam.isVisible().catch(() => false)),
        'Spam action not available'
      )
      // spamCommand.canExecute is CMailView.isEnableGroupOperations, sourced from an
      // observable throttled 250ms after opening the message — wait for "enabled",
      // not just "visible" (see moveToFolder above), or the click silently no-ops
      // (Utils.createCommand returns false without executing when canExecute() is false).
      await clickMailToolbarAction(page, 'mail-action-toSpam')
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(45000),
      })
      await attachScreenshot(page, 'mail-spam-01-after')
    })

    await step('Open Spam folder', async () => {
      await openFolderByType(page, FOLDER_TYPES.SPAM)
      await attachScreenshot(page, 'mail-spam-02-folder')
    })
  })

  test('marks spam as not spam and restores to Inbox', async ({ page }) => {
    test.setTimeout(T(240000))
    await gotoLoggedIn(page)
    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    const subject = opened.viewSubject
    test.skip(!subject, 'Opened message has empty subject')

    await step('Mark as spam', async () => {
      const spam = page.getByTestId('mail-action-toSpam')
      test.skip(
        (await spam.count()) === 0 || !(await spam.isVisible().catch(() => false)),
        'Spam action not available'
      )
      await clickMailToolbarAction(page, 'mail-action-toSpam')
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(45000),
      })
      console.log(`  → Marked as spam: ${subject}`)
    })

    await step('Open message in Spam', async () => {
      await openFolderByType(page, FOLDER_TYPES.SPAM)
      const item = page
        .getByTestId('mail-message-item')
        .filter({ hasText: subject })
        .first()
      await expect(item).toBeVisible({ timeout: T(60000) })
      await clickMessageListItem(page, item)
      await expect(page.getByTestId('mail-message-view')).toBeVisible({
        timeout: T(30000),
      })
      await expect(visibleSubject(page)).toBeVisible({ timeout: T(60000) })
      await attachScreenshot(page, 'mail-not-spam-01-in-spam')
    })

    await step('Toolbar → Not spam', async () => {
      const notSpam = page.getByTestId('mail-action-notSpam')
      await expect(notSpam).toBeVisible({ timeout: T(10000) })
      await clickMailToolbarAction(page, 'mail-action-notSpam')
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(45000),
      })
      console.log(`  → Marked as not spam: ${subject}`)
      await attachScreenshot(page, 'mail-not-spam-02-after')
    })

    await step('Confirm message is back in Inbox', async () => {
      await openFolderByType(page, FOLDER_TYPES.INBOX)
      const item = page
        .getByTestId('mail-message-item')
        .filter({ hasText: subject })
        .first()
      await expect(item).toBeVisible({ timeout: T(60000) })
      console.log(`  → Restored in Inbox: ${subject}`)
      await attachScreenshot(page, 'mail-not-spam-03-inbox')
    })
  })

  test('deletes message to Trash via toolbar', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('Toolbar delete → confirm', async () => {
      await clickMailToolbarAction(page, 'mail-action-delete')
      await confirmOkIfVisible(page)
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(30000),
      })
      console.log('  → Delete confirmed')
      await attachScreenshot(page, 'mail-delete-01-after')
    })
  })

  test('sends reply and forward to self', async ({ page }) => {
    test.setTimeout(T(240000))
    await gotoLoggedIn(page)
    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty')

    await step('Reply → send', async () => {
      await clickMailAction(page, 'mail-action-reply')
      const subject = await readComposeSubject(page)
      expect(subject.toLowerCase()).toMatch(/^re(\[\d+\])?:/)
      await sendCompose(page)
      // Desktop split pane keeps list + view both mounted; do not .or() them
      // (strict mode fails when both are visible). sendCompose already waited
      // for the compose popup to close.
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(15000),
      })
      console.log(`  → Reply sent: ${subject}`)
      await attachScreenshot(page, 'mail-send-01-reply')
    })

    await step('Open inbox message for forward', async () => {
      await waitForInboxList(page)
    })

    const again = await openFirstInboxMessage(page)
    test.skip(!again, 'Inbox empty after reply')

    await step('Forward → fill To → send', async () => {
      const forward = page.getByTestId('mail-action-forward')
      test.skip((await forward.count()) === 0, 'Forward not available')
      await clickMailAction(page, 'mail-action-forward')
      const subject = await readComposeSubject(page)
      expect(subject.toLowerCase()).toMatch(/^fwd(\[\d+\])?:/)
      await fillComposeRecipient(page, composeTo)
      await fillComposeBody(page, `E2E forward body ${Date.now()}`)
      await sendCompose(page)
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(15000),
      })
      console.log(`  → Forward sent: ${subject}`)
      await attachScreenshot(page, 'mail-send-02-forward')
    })
  })

  test('advanced search by subject runs', async ({ page }) => {
    test.setTimeout(T(120000))
    await gotoLoggedIn(page)
    await waitForInboxList(page)

    const firstSubject = (
      await page
        .getByTestId('mail-message-item')
        .first()
        .locator('.subject')
        .innerText()
        .catch(() => '')
    ).trim()
    test.skip(!firstSubject, 'Inbox is empty')

    const token =
      firstSubject
        .split(/\s+/)
        .map((w) => w.replace(/[^a-zA-Z0-9@._-]/g, ''))
        .find((w) => w.length > 4 && !/^(re|fwd)$/i.test(w)) || firstSubject

    await step('Open advanced search and submit subject', async () => {
      await clickReady(page.getByTestId('mail-search-advanced'))
      await expect(page.getByTestId('mail-advanced-search')).toBeVisible({
        timeout: T(15000),
      })
      await page.getByTestId('mail-adv-subject').fill(token)
      await clickReady(page.getByTestId('mail-adv-search-submit'))
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(30000),
      })
      await waitForInboxList(page)
      console.log(`  → Advanced search subject token: ${token}`)
      await attachScreenshot(page, 'mail-adv-search-01')
    })
  })
})
