const path = require('path')
const { sharedHelper, fixturePath } = require(path.join(
  process.env.AURORA_E2E_ROOT,
  'helpers/paths'
))
const { expect } = require('@playwright/test')
const { step, attachScreenshot, fieldControl } = sharedHelper('login')
const { waitForListReady, waitForListReadySoft, clickReady, confirmOkIfVisible } = sharedHelper('ready')
const { T } = sharedHelper('timeouts')

const FOLDER_TYPES = {
  INBOX: 'inbox',
  SENT: 'sent',
  DRAFTS: 'drafts',
  SPAM: 'spam',
  TRASH: 'trash',
  STARRED: 'starred',
}

const listReadyOptions = {
  itemTestIds: 'mail-message-item',
  emptyTestId: 'mail-empty-folder',
  spinnerSelectors: [
    '.panel.messages .list_loading',
    '.panel.messages .list_notification.loading',
    '.message_list .list_loading',
  ],
  timeout: 60000,
}

function visibleSubject(page) {
  return page.locator('[data-test-id="mail-message-subject"]:visible').first()
}

async function waitForInboxList(page) {
  await expect(page.getByTestId('mail-message-list')).toBeVisible({
    timeout: T(60000),
  })
  await waitForListReady(page, listReadyOptions)
}

async function openFolder(page, folderType, { soft = false } = {}) {
  const folder = page
    .locator(`[data-test-id="mail-folder"][data-folder-type="${folderType}"]`)
    .first()
  await clickReady(folder)
  await expect(page.getByTestId('mail-message-list')).toBeVisible({
    timeout: T(30000),
  })
  if (soft) {
    await waitForListReadySoft(page, listReadyOptions, {
      listVisibleTestId: 'mail-message-list',
      softTimeout: 15000,
    })
  } else {
    await waitForListReady(page, listReadyOptions)
  }
  return folderType
}

/** Alias for mobile-style imports. */
const openFolderByType = openFolder

async function openFolderByName(page, folderName, { soft = false } = {}) {
  const folder = page
    .locator(`[data-test-id="mail-folder"]`)
    .filter({ hasText: new RegExp(folderName, 'i') })
    .first()
  await expect(folder).toBeVisible({ timeout: T(15000) })
  await clickReady(folder)
  await expect(page.getByTestId('mail-message-list')).toBeVisible({
    timeout: T(30000),
  })
  if (soft) {
    await waitForListReadySoft(page, listReadyOptions, {
      listVisibleTestId: 'mail-message-list',
      softTimeout: 15000,
    })
  } else {
    await waitForListReady(page, listReadyOptions)
  }
  return folderName
}

/**
 * Wait for inbox list and open the first message.
 * @returns {{ listSubject: string, viewSubject: string, count: number } | null}
 */
async function openFirstInboxMessage(page) {
  await step('Wait for inbox list', async () => {
    await waitForInboxList(page)
  })

  const items = page.getByTestId('mail-message-item')
  const count = await items.count()
  if (count === 0) {
    await attachScreenshot(page, 'mail-inbox-empty')
    return null
  }

  const listSubject = (
    await items
      .first()
      .locator('.subject')
      .innerText()
      .catch(() => '')
  ).trim()

  await step('Open first inbox message', async () => {
    await clickReady(items.first())
    await expect(page.getByTestId('mail-message-view')).toBeVisible({
      timeout: T(30000),
    })
    await expect(visibleSubject(page)).toBeVisible({ timeout: T(60000) })
  })

  const viewSubject = (await visibleSubject(page).innerText()).trim()

  return { listSubject, viewSubject, count }
}

async function expectComposeOpen(page) {
  // Maximized popup: panels visible. If minimized, expand first.
  const minimized = page.locator('.minimized_compose')
  if (await minimized.isVisible().catch(() => false)) {
    await clickReady(minimized.locator('.item.maximize, .toolbar').first())
  }
  // Reply/forward may open ComposePopup slightly after the click.
  // Prefer a popup that is not display:none, or the subject field.
  await expect(
    page
      .locator('.compose_popup.popup:not([style*="display: none"])')
      .or(page.getByTestId('mail-compose-subject'))
      .or(page.getByTestId('mail-compose'))
      .first()
  ).toBeVisible({ timeout: T(30000) })
  if (await minimized.isVisible().catch(() => false)) {
    await clickReady(minimized.locator('.item.maximize, .toolbar').first())
  }
  await expect(page.getByTestId('mail-compose')).toBeVisible({
    timeout: T(30000),
  })
  await expect(
    page
      .getByTestId('mail-compose-send')
      .or(page.getByTestId('mail-compose-subject'))
      .first()
  ).toBeVisible({ timeout: T(15000) })
}

/**
 * Click a mail toolbar action that opens compose (reply / forward / …).
 */
async function clickMailAction(page, testId) {
  await clickMailToolbarAction(page, testId)
  await expectComposeOpen(page)
}

/**
 * Click a visible, enabled mail toolbar button.
 * List toolbar + message toolbar may share the same data-test-id.
 */
async function clickMailToolbarAction(page, testId) {
  const enabled = page
    .locator(
      `[data-test-id="${testId}"]:visible:not(.disabled):not(.command-disabled):not(.unavailable)`
    )
    .first()
  await expect(enabled).toBeVisible({ timeout: T(30000) })
  await clickReady(enabled)
}

async function readComposeSubject(page) {
  return (await fieldControl(page, 'mail-compose-subject').inputValue()).trim()
}

/**
 * Desktop ComposePopup: cancel with unsaved changes minimizes the popup
 * (does not show ConfirmPopup). Fully leave via save_and_close on the
 * minimized bar, or close when already clean.
 *
 * Note: `.close` is often not "visible" to Playwright while painted — prefer Escape.
 */
async function closeComposeWithoutSending(page) {
  await step('Close compose without sending', async () => {
    const minimized = page.locator('.minimized_compose')
    const saveAndClose = page
      .getByTestId('mail-compose-save-and-close')
      .or(page.locator('.minimized_compose .item.save_and_close'))

    if (await minimized.isVisible().catch(() => false)) {
      await saveAndClose.first().click({ force: true })
    } else if (
      await page.getByTestId('mail-compose').isVisible().catch(() => false)
    ) {
      // Escape → minimize when dirty; closePopup when clean.
      await page.keyboard.press('Escape')
      // isVisible() does not actually wait/poll (Playwright ignores its
      // timeout option) — use waitFor so a minimize that renders a beat
      // late isn't missed.
      const didMinimize = await minimized
        .waitFor({ state: 'visible', timeout: T(3000) })
        .then(() => true)
        .catch(() => false)
      if (didMinimize) {
        await saveAndClose.first().click({ force: true })
      }
    }

    await expect(minimized).toBeHidden({ timeout: T(30000) })
    await expect(page.getByTestId('mail-compose')).toBeHidden({
      timeout: T(15000),
    })
  })
}

async function waitForDraftSavedReport(page) {
  // Avoid matching the "Save" toolbar label — require past-tense / report copy.
  await expect(
    page
      .getByText(
        /message has been saved|successfully saved|сообщение сохранено|сохранено\.|Ваше сообщение сохранено/i
      )
      .first()
  ).toBeVisible({ timeout: T(30000) })
}

/**
 * Fill inputosaurus recipient field and commit with Enter.
 */
async function fillComposeRecipient(
  page,
  email,
  fieldTestId = 'mail-compose-to'
) {
  const input = page.getByTestId(fieldTestId).locator('input').first()
  await expect(input).toBeVisible({ timeout: T(15000) })
  await input.fill(email)
  await input.press('Enter')
}

async function composeFullyClosed(page) {
  const composeVisible = await page
    .getByTestId('mail-compose')
    .isVisible()
    .catch(() => false)
  const minimizedVisible = await page
    .locator('.minimized_compose')
    .isVisible()
    .catch(() => false)
  return !composeVisible && !minimizedVisible
}

async function tryDismissComposeOnce(page) {
  const minimized = page.locator('.minimized_compose')
  const saveAndClose = page
    .getByTestId('mail-compose-save-and-close')
    .or(page.locator('.minimized_compose .item.save_and_close'))

  if (await minimized.isVisible().catch(() => false)) {
    await saveAndClose.first().click({ force: true }).catch(() => undefined)
    return
  }
  if (await page.getByTestId('mail-compose').isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    if (await minimized.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveAndClose.first().click({ force: true }).catch(() => undefined)
    }
  }
}

async function sendCompose(page) {
  const sendBtn = page
    .locator('[data-test-id="mail-compose-send"]:visible')
    .first()

  // Send is a non-native <span> (no `disabled` attribute, click always reaches
  // the DOM handler). Both apps guard the actual send behind a canSend/
  // isEnableSending check that stays false until GetFolders resolves — the
  // handler silently no-ops while that class is present, so clicking on
  // visibility alone can fire before folders are loaded (especially under a
  // slow backend) and leave compose open with no error. Wait for the
  // disabled marker to clear on top of visibility: legacy toggles
  // `command-disabled disable disabled`, next toggles `compose_shell_disabled`.
  await expect(sendBtn).toBeVisible({ timeout: T(30000) })
  await expect(sendBtn).not.toHaveClass(
    /(?:^|\s)(?:compose_shell_disabled|command-disabled|disable|disabled)(?:\s|$)/,
    { timeout: T(30000) }
  )
  await clickReady(sendBtn)

  let closed = false
  try {
    await expect
      .poll(async () => composeFullyClosed(page), {
        timeout: T(60000),
        intervals: [400, 800, 1200],
      })
      .toBeTruthy()
    closed = true
  } catch {
    closed = false
  }

  if (!closed) {
    // Send may leave compose minimized; dismiss once then re-assert.
    await tryDismissComposeOnce(page)
    if (!(await composeFullyClosed(page))) {
      await attachScreenshot(page, 'mail-compose-send-still-open')
      throw new Error(
        'Compose stayed open after send (compose or minimized still visible)'
      )
    }
  }

  await expect(page.getByTestId('mail-compose')).toBeHidden({
    timeout: T(15000),
  })
  await expect(page.locator('.minimized_compose')).toBeHidden({
    timeout: T(15000),
  })
}

async function selectMessageCheckbox(page, item) {
  const checkbox = item.getByTestId('mail-message-checkbox')
  await clickReady(checkbox)
}

async function fillComposeBody(page, text) {
  const body = page.getByTestId('mail-compose-body')
  await expect(body).toBeVisible({ timeout: T(15000) })

  const iframe = body.locator('iframe').first()
  if ((await iframe.count()) > 0) {
    const frame = page
      .frameLocator('[data-test-id="mail-compose-body"] iframe')
      .first()
    const editable = frame.locator('body')
    await editable.click({ timeout: T(15000) })
    await editable.fill(text)
    return
  }

  const contentEditable = body.locator('[contenteditable="true"]').first()
  if ((await contentEditable.count()) > 0) {
    await contentEditable.click()
    await contentEditable.fill(text)
    return
  }

  const textarea = body.locator('textarea').first()
  if ((await textarea.count()) > 0) {
    await textarea.fill(text)
  }
}

module.exports = {
  FOLDER_TYPES,
  waitForInboxList,
  openFirstInboxMessage,
  expectComposeOpen,
  readComposeSubject,
  closeComposeWithoutSending,
  openFolder,
  openFolderByType,
  openFolderByName,
  fillComposeRecipient,
  sendCompose,
  selectMessageCheckbox,
  confirmOkIfVisible,
  fillComposeBody,
  waitForDraftSavedReport,
  clickMailAction,
  clickMailToolbarAction,
  visibleSubject,
  waitForListReady,
  waitForListReadySoft,
  listReadyOptions,
  clickReady,
  step,
  attachScreenshot,
}
