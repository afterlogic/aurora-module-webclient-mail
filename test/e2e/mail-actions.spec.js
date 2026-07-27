const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { test, expect } = require('@playwright/test')
const { loginAsTestUser, step, attachScreenshot, hasCredentials } = sharedHelper('login')
const { clickReady } = sharedHelper('ready')
const {
  openFirstInboxMessage,
  expectComposeOpen,
  readComposeSubject,
  closeComposeWithoutSending,
  waitForInboxList,
  clickMailAction,
} = require('./helpers/mail')


test.describe('Desktop mail message actions', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_0/E2E_PASSWORD_0 (or E2E_LOGIN/E2E_PASSWORD) in .env.e2e')

  test('toggles details and star on opened message', async ({ page }) => {
    test.setTimeout(120000)
    await loginAsTestUser(page)

    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty — need at least one message')

    await step('Expect message chrome (sender, actions, more)', async () => {
      await expect(page.getByTestId('mail-message-sender')).toBeVisible()
      await expect(page.getByTestId('mail-action-reply')).toBeVisible()
      await expect(page.getByTestId('mail-message-more')).toBeVisible()
      await attachScreenshot(page, 'mail-actions-01-view')
    })

    await step('Toggle message details', async () => {
      const details = page.getByTestId('mail-message-details')
      const wasVisible = await details.isVisible().catch(() => false)
      await clickReady(page.getByTestId('mail-message-toggle-details'))
      if (wasVisible) {
        await expect(details).toBeHidden({ timeout: 10000 })
        console.log('  → Details collapsed')
        await clickReady(page.getByTestId('mail-message-toggle-details'))
        await expect(details).toBeVisible({ timeout: 10000 })
        console.log('  → Details expanded')
      } else {
        await expect(details).toBeVisible({ timeout: 10000 })
        console.log('  → Details expanded')
        await clickReady(page.getByTestId('mail-message-toggle-details'))
        await expect(details).toBeHidden({ timeout: 10000 })
        console.log('  → Details collapsed')
      }
    })

    await step('Toggle star flag on list item', async () => {
      // Desktop star lives on the list item (not message pane).
      const starredItem = page
        .getByTestId('mail-message-item')
        .filter({ has: page.locator('.selected, .checked') })
        .first()
      const item =
        (await starredItem.count()) > 0
          ? starredItem
          : page.getByTestId('mail-message-item').first()
      const star = item.getByTestId('mail-message-star')
      await expect(star).toBeVisible({ timeout: 10000 })
      const wasFlagged = await star.evaluate((el) =>
        el.classList.contains('flagged')
      )
      await clickReady(star)
      await expect
        .poll(async () =>
          star.evaluate((el) => el.classList.contains('flagged'))
        )
        .not.toBe(wasFlagged)
      console.log(`  → Star toggled from ${wasFlagged}`)
      // Restore
      await clickReady(star)
      await expect
        .poll(async () =>
          star.evaluate((el) => el.classList.contains('flagged'))
        )
        .toBe(wasFlagged)
      await attachScreenshot(page, 'mail-actions-02-star')
    })
  })

  test('reply opens compose with Re: subject', async ({ page }) => {
    test.setTimeout(120000)
    await loginAsTestUser(page)

    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty — need at least one message')

    await step('Click Reply in toolbar', async () => {
      await clickMailAction(page, 'mail-action-reply')
      await attachScreenshot(page, 'mail-reply-01-compose')
    })

    await step('Expect Re: subject', async () => {
      await expect
        .poll(async () => (await readComposeSubject(page)).toLowerCase(), {
          timeout: 30000,
        })
        .toMatch(/^re:/)
      console.log(`  → Reply subject: ${await readComposeSubject(page)}`)
    })

    await closeComposeWithoutSending(page)
  })

  test('reply-all opens compose', async ({ page }) => {
    test.setTimeout(120000)
    await loginAsTestUser(page)

    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty — need at least one message')

    await step('Click Reply all in toolbar', async () => {
      const replyAll = page.locator(
        '[data-test-id="mail-action-replyAll"]:visible'
      )
      test.skip((await replyAll.count()) === 0, 'Reply all not available')
      await clickMailAction(page, 'mail-action-replyAll')
      await attachScreenshot(page, 'mail-reply-all-01-compose')
    })

    await step('Expect Re: subject', async () => {
      await expect
        .poll(async () => (await readComposeSubject(page)).toLowerCase(), {
          timeout: 30000,
        })
        .toMatch(/^re:/)
      console.log(`  → Reply-all subject: ${await readComposeSubject(page)}`)
    })

    await closeComposeWithoutSending(page)
  })

  test('forward opens compose with Fwd:', async ({ page }) => {
    test.setTimeout(120000)
    await loginAsTestUser(page)

    const opened = await openFirstInboxMessage(page)
    test.skip(!opened, 'Inbox is empty — need at least one message')

    await step('Click Forward in toolbar', async () => {
      const forward = page.locator(
        '[data-test-id="mail-action-forward"]:visible'
      )
      test.skip((await forward.count()) === 0, 'Forward not available')
      await clickMailAction(page, 'mail-action-forward')
      await attachScreenshot(page, 'mail-forward-01-compose')
    })

    await step('Expect Fwd: subject', async () => {
      await expect
        .poll(async () => (await readComposeSubject(page)).toLowerCase(), {
          timeout: 30000,
        })
        .toMatch(/^fwd:/)
      console.log(`  → Forward subject: ${await readComposeSubject(page)}`)
    })

    await closeComposeWithoutSending(page)
  })

  test('search header opens and runs a query', async ({ page }) => {
    test.setTimeout(90000)
    await loginAsTestUser(page)
    await waitForInboxList(page)

    await step('Focus search and type a query', async () => {
      await expect(page.getByTestId('mail-search')).toBeVisible({
        timeout: 30000,
      })
      const input = page.getByTestId('mail-search-input')
      await expect(input).toBeVisible({ timeout: 15000 })
      await input.click()
      await page.keyboard.type('e2e')
      await page.keyboard.press('Enter')
      await attachScreenshot(page, 'mail-search-01-open')
    })

    await step('Advanced search control is present', async () => {
      await expect(page.getByTestId('mail-search-advanced')).toBeVisible()
    })
  })
})
