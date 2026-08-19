const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const { gotoLoggedIn, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const {
  FOLDER_TYPES,
  waitForInboxList,
  openFolderByType,
  openFolderByName,
  selectMessageCheckbox,
  waitForListReady,
  listReadyOptions,
  clickReady,
  confirmOkIfVisible,
  clickMailToolbarAction,
  clickMailDropdownCommand,
  ensureInboxHasMessage,
} = require('./helpers/mail')


test.describe('Desktop mail list filters and bulk actions', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test.describe('Unseen filter', () => {
    test('opens Unseen filter from folder badge and clears it', async ({
      page,
    }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await waitForInboxList(page)

    await step('Find folder with unseen badge and click it', async () => {
      const badge = page.getByTestId('mail-folder-unseen-count').first()
      try {
        await expect(badge).toBeVisible({ timeout: T(30000) })
      } catch {
        test.skip(true, 'No unseen badge after waiting for folder counts')
      }
      const folder = page
        .locator('[data-test-id="mail-folder"]')
        .filter({ has: page.getByTestId('mail-folder-unseen-count') })
        .first()
      console.log(
        `  → Unseen badge on: ${(await folder.innerText().catch(() => '')).trim().split('\n')[0]}`
      )
      await clickReady(badge)
    })

    await step('Expect unseen filter banner', async () => {
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(30000),
      })
      // Two banners share data-test-id in DOM; only one is :visible.
      // Prefer distinct ids when templates are deployed; keep legacy id for staging.
      const banner = page.locator(
        [
          '[data-test-id="mail-filter-banner"]:visible',
          '[data-test-id="mail-filter-banner-unseen-list"]:visible',
          '[data-test-id="mail-filter-banner-unseen-empty"]:visible',
        ].join(', ')
      )
      await expect(banner).toBeVisible({ timeout: T(15000) })
      await waitForListReady(page, listReadyOptions)
      await attachScreenshot(page, 'mail-filter-unseen-01')
    })

    await step('Clear filter → full folder list', async () => {
      await clickReady(
        page.locator('[data-test-id="mail-filter-clear"]:visible').first()
      )
      await expect(
        page.locator(
          [
            '[data-test-id="mail-filter-banner"]:visible',
            '[data-test-id="mail-filter-banner-unseen-list"]:visible',
            '[data-test-id="mail-filter-banner-unseen-empty"]:visible',
          ].join(', ')
        )
      ).toHaveCount(0, { timeout: T(30000) })
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(30000),
      })
      await attachScreenshot(page, 'mail-filter-unseen-02-cleared')
    })
    })
  })

  test('opens Starred (flagged) virtual folder', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await waitForInboxList(page)

    await step('Open Starred folder', async () => {
      const byType = page.locator(
        '[data-test-id="mail-folder"][data-folder-type="starred"]'
      )
      // Starred may have neither items nor empty-state — soft wait only.
      if ((await byType.count()) > 0) {
        await openFolderByType(page, FOLDER_TYPES.STARRED, { soft: true })
      } else {
        await openFolderByName(page, 'Starred', { soft: true })
      }
      await expect(page.getByTestId('mail-message-list')).toBeVisible({
        timeout: T(15000),
      })
      await attachScreenshot(page, 'mail-filter-starred-01')
    })
  })

  test('multi-select and bulk delete moves messages to Trash', async ({
    page,
  }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await waitForInboxList(page)

    const items = page.getByTestId('mail-message-item')
    const beforeCount = await items.count()
    test.skip(beforeCount === 0, 'Inbox is empty — need at least one message')

    let deletedSubject = ''

    await step('Check first message checkbox', async () => {
      const first = items.first()
      deletedSubject = (
        await first.locator('.subject').innerText().catch(() => '')
      ).trim()
      await selectMessageCheckbox(page, first)
      console.log(`  → Selected subject: ${deletedSubject}`)
      await attachScreenshot(page, 'mail-select-01')
    })

    if (beforeCount > 1) {
      await step('Check second message checkbox', async () => {
        await selectMessageCheckbox(page, items.nth(1))
      })
    }

    await step('Bulk delete → confirm', async () => {
      await clickMailToolbarAction(page, 'mail-action-delete')
      await confirmOkIfVisible(page)
      await waitForListReady(page, listReadyOptions)
      await attachScreenshot(page, 'mail-select-02-deleted')
    })

    await step('Deleted message appears in Trash', async () => {
      test.skip(!deletedSubject, 'No subject captured from deleted message')
      await openFolderByType(page, FOLDER_TYPES.TRASH)
      await expect(
        page
          .getByTestId('mail-message-item')
          .filter({ hasText: deletedSubject })
          .first()
      ).toBeVisible({ timeout: T(30000) })
      console.log(`  → Found in Trash: ${deletedSubject}`)
      await attachScreenshot(page, 'mail-select-03-trash')
    })
  })

  test('empties Trash folder', async ({ page }) => {
    test.setTimeout(T(180000))
    await gotoLoggedIn(page)
    await waitForInboxList(page)

    await step('Open Trash', async () => {
      await openFolderByType(page, FOLDER_TYPES.TRASH)
    })

    const emptyBtn = page.getByTestId('mail-empty-folder-button')
    test.skip(
      !(await emptyBtn.isVisible().catch(() => false)),
      'Trash is empty — Empty Trash button is hidden'
    )

    await step('Empty Trash → confirm', async () => {
      await clickReady(emptyBtn)
      await confirmOkIfVisible(page)
      await expect(page.getByTestId('mail-empty-folder')).toBeVisible({
        timeout: T(60000),
      })
      console.log('  → Trash emptied')
      await attachScreenshot(page, 'mail-empty-trash-01')
    })
  })

  test.describe('Mark read / unread', () => {
    test('marks a list message unread then read', async ({ page }) => {
      test.setTimeout(T(240000))
      await gotoLoggedIn(page)
      await ensureInboxHasMessage(page)

      const items = page.getByTestId('mail-message-item')
      const first = items.first()

      await step('Select first message checkbox', async () => {
        await selectMessageCheckbox(page, first)
        await attachScreenshot(page, 'mail-mark-01-selected')
      })

      await step('Mark as unread', async () => {
        await expect(first).toHaveClass(/checked/, { timeout: T(10000) })
        await expect(
          page.locator('.messages_panel [data-test-id="mail-mark-read"]').first()
        ).not.toHaveClass(/command-disabled|unavailable/, { timeout: T(30000) })
        await clickMailToolbarAction(page, 'mail-mark-dropdown')
        await clickMailDropdownCommand(page, 'mail-mark-unread')
        await expect(first).toHaveClass(/unseen/, { timeout: T(30000) })
        console.log('  → Marked unread')
        await attachScreenshot(page, 'mail-mark-02-unread')
      })

      await step('Mark as read', async () => {
        if (
          !(await first
            .getByTestId('mail-message-checkbox')
            .locator('.checked, .icon')
            .count())
        ) {
          await selectMessageCheckbox(page, first)
        }
        await clickMailToolbarAction(page, 'mail-mark-read')
        await expect(first).not.toHaveClass(/unseen/, { timeout: T(30000) })
        console.log('  → Marked read')
        await attachScreenshot(page, 'mail-mark-03-read')
      })
    })
  })

  test.describe('Empty Spam', () => {
    test('empties Spam folder', async ({ page }) => {
      test.setTimeout(T(240000))
      await gotoLoggedIn(page)
      await ensureInboxHasMessage(page)

      await step('Ensure Spam has a message', async () => {
        await openFolderByType(page, FOLDER_TYPES.SPAM)
        const spamRow = page
          .locator('[data-test-id="mail-message-item"]:visible')
          .first()
        if (await spamRow.isVisible().catch(() => false)) {
          return
        }
        await openFolderByType(page, FOLDER_TYPES.INBOX)
        const first = page
          .locator('[data-test-id="mail-message-item"]:visible')
          .first()
        await expect(first).toBeVisible({ timeout: T(30000) })
        await selectMessageCheckbox(page, first)
        await clickMailToolbarAction(page, 'mail-action-toSpam')
        await openFolderByType(page, FOLDER_TYPES.SPAM)
        await expect(spamRow).toBeVisible({ timeout: T(60000) })
      })

      await step('Empty Spam → confirm', async () => {
        await clickMailToolbarAction(page, 'mail-empty-spam-button')
        await confirmOkIfVisible(page)
        await expect(page.getByTestId('mail-empty-folder')).toBeVisible({
          timeout: T(60000),
        })
        console.log('  → Spam emptied')
        await attachScreenshot(page, 'mail-empty-spam-01')
      })
    })
  })
})
