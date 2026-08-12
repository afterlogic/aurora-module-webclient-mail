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

async function isSeparatedMailLayout(page) {
  return (
    (await page.locator('html.layout-separated').count()) > 0 ||
    (await page.locator('.separate_layout_mode').count()) > 0
  )
}

async function isSeparatedMessageOpened(page) {
  return (await page.locator('.separate_layout_mode.separate_message_opened').count()) > 0
}

/** Knockout longUid from a list row (desktop CMessageModel). */
async function getMessageUidFromItem(item) {
  return item.evaluate((el) => {
    const ko = window.ko
    if (!ko) return null
    const msg = ko.dataFor(el)
    if (!msg || typeof msg.longUid !== 'function') return null
    const uid = msg.longUid()
    return uid ? String(uid) : null
  })
}

/** jQuery delegated dblclick — Playwright dblclick() often misses CSelector handlers. */
async function triggerMailItemDblClick(item) {
  await item.evaluate((el) => {
    if (window.jQuery) {
      window.jQuery(el).trigger('dblclick')
      return
    }
    el.dispatchEvent(
      new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window })
    )
  })
}

/**
 * Force hash routing to msg{uid} even when routeForMessage skips (same uid).
 * CMailView.onRoute always resets isOpenedSeparatedMessage(false) on hash change.
 */
async function forceMessageHashRoute(page, uid) {
  await page.evaluate((uid) => {
    const parts = window.location.hash
      .replace(/^#/, '')
      .split('/')
      .filter(Boolean)
      .filter((p) => !p.startsWith('msg'))
    const target = [...parts, 'msg' + uid].join('/')
    if (window.location.hash.replace(/^#/, '') === target) {
      window.location.hash = parts.join('/')
      window.location.hash = target
    } else {
      window.location.hash = target
    }
  }, uid)
  await page
    .waitForFunction((u) => window.location.hash.includes('msg' + u), uid, {
      timeout: T(15000),
    })
    .catch(() => undefined)
}

/** Reading pane is mounted early but may stay hidden until load / layout opens it. */
async function waitForOpenedMessageView(page, timeout = T(60000)) {
  await expect(
    page
      .locator(
        [
          '[data-test-id="mail-message-subject"]:visible',
          '[data-test-id="mail-message-sender"]:visible',
          '[data-test-id="mail-action-reply"]:visible',
        ].join(', ')
      )
      .first()
  ).toBeVisible({ timeout })
}

/** jQuery delegated click on .subject/.from — Playwright click blocked by reading-pane overlap. */
async function clickListItemSubject(item) {
  const clickTarget = item.locator('.subject, .from').first()
  await expect(clickTarget).toBeVisible({ timeout: T(30000) })
  await clickTarget.evaluate((el) => {
    if (window.jQuery) {
      window.jQuery(el).trigger('click')
      return
    }
    el.click()
  })
}

async function clickMessageListItem(page, item) {
  const uid = await getMessageUidFromItem(item)
  const separated = await isSeparatedMailLayout(page)

  const tryOpen = async () => {
    if (separated) {
      // Separated: .message_viewer { display: none } until dblclick →
      // isOpenedSeparatedMessage(true). Single click only routes uid.
      await clickListItemSubject(item)
      if (uid) {
        await page
          .waitForFunction((u) => window.location.hash.includes('msg' + u), uid, {
            timeout: T(8000),
          })
          .catch(() => undefined)
      }
      await triggerMailItemDblClick(item)
      return visibleSubject(page)
        .waitFor({ state: 'visible', timeout: T(8000) })
        .then(() => true)
        .catch(() => false)
    }

    await clickListItemSubject(item)
    return visibleSubject(page)
      .waitFor({ state: 'visible', timeout: T(8000) })
      .then(() => true)
      .catch(() => false)
  }

  if (await tryOpen()) {
    return
  }

  // Vertical/horizontal: re-click on currentMessage is a no-op (routeForMessage
  // skips when uid unchanged). Select another row, then the target again.
  const items = page.getByTestId('mail-message-item')
  if ((await items.count()) > 1) {
    await clickListItemSubject(items.nth(1))
    if (separated) {
      await triggerMailItemDblClick(items.nth(1))
    }
  }

  if (!(await tryOpen()) && uid) {
    await forceMessageHashRoute(page, uid)
    if (separated && !(await isSeparatedMessageOpened(page))) {
      await triggerMailItemDblClick(item)
    }
  }

  if (!(await visibleSubject(page).isVisible().catch(() => false))) {
    await page.keyboard.press('Enter').catch(() => undefined)
  }

  await waitForOpenedMessageView(page)
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
  await step('Open INBOX folder', async () => {
    await openFolder(page, FOLDER_TYPES.INBOX)
  })

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
    await clickMessageListItem(page, items.first())
    await waitForOpenedMessageView(page)
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
  const enabledSelector = `[data-test-id="${testId}"]:visible:not(.disabled):not(.command-disabled):not(.unavailable)`
  const enabled = page.locator(enabledSelector).first()
  await expect(enabled).toBeVisible({ timeout: T(30000) })

  const inMessagesPanel = await enabled.evaluate((el) =>
    Boolean(el.closest('.messages_panel'))
  )

  if (inMessagesPanel) {
    await page.locator('.messages_panel .toolbar').scrollIntoViewIfNeeded()
    // Split layout overlap + Knockout delegated handlers: jQuery trigger is
    // reliable for toolbar commands/dropdowns; Playwright click may be blocked
    // or miss koBindings fControlClick.
    await enabled.evaluate((el) => {
      if (window.jQuery) {
        window.jQuery(el).trigger('click')
        return
      }
      el.click()
    })
    return
  }

  await clickReady(enabled)
}

/**
 * Open Move dropdown and pick a folder (jQuery delegated click on span.folder).
 * @param {string|string[]} folderFullNames — e.g. 'Trash' or ['Trash', 'INBOX.Trash']
 */
async function clickMoveToFolder(page, folderFullNames) {
  const names = Array.isArray(folderFullNames) ? folderFullNames : [folderFullNames]
  await clickMailToolbarAction(page, 'mail-action-moveToFolder')
  await expect(page.locator('.messages_panel .item.move.expand')).toBeVisible({
    timeout: T(10000),
  })

  const selector = names
    .map(
      (name) =>
        `.item.move.expand [data-test-id="mail-move-folder-item"][data-folder="${name}"]`
    )
    .join(', ')
  const folderItem = page.locator(selector).first()
  await expect(folderItem).toBeVisible({ timeout: T(15000) })
  await folderItem.evaluate((el) => {
    if (window.jQuery) {
      window.jQuery(el).trigger('click')
      return
    }
    el.click()
  })
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

/** List row whose .subject contains the given text (more precise than hasText on row). */
function messageItemBySubject(page, subject) {
  return page
    .getByTestId('mail-message-item')
    .filter({
      has: page.locator('.subject').filter({ hasText: subject }),
    })
    .first()
}

/** Desktop toolbar "Check mail" — refreshes folder list from server. */
async function triggerCheckMail(page) {
  const checkBtn = page
    .locator('#selenium_mail_check_button, .toolbar .item.checkstate')
    .first()
  if (!(await checkBtn.isVisible().catch(() => false))) {
    return
  }
  await clickReady(checkBtn)
  await page
    .locator('.toolbar .item.checkstate.process')
    .waitFor({ state: 'hidden', timeout: T(60000) })
    .catch(() => undefined)
}

/** Wait until compose attachment finished uploading (Send stays disabled until then). */
async function waitForComposeAttachmentReady(page, fileName) {
  const attachment = page
    .locator('.attachments_panel .item.file, .attachments_container .item.file')
    .filter({ hasText: fileName })
    .first()
  await expect(attachment).toBeVisible({ timeout: T(60000) })
  await expect(attachment.locator('.progress:visible')).toHaveCount(0, {
    timeout: T(120000),
  })
  await expect(attachment.locator('.status_text.error:visible')).toHaveCount(0)
  const sendBtn = page.locator('[data-test-id="mail-compose-send"]:visible').first()
  await expect(sendBtn).not.toHaveClass(
    /(?:^|\s)(?:compose_shell_disabled|command-disabled|disable|disabled)(?:\s|$)/,
    { timeout: T(120000) }
  )
}

/**
 * Poll folder list until a message subject appears (IMAP sync can lag after send).
 * Re-opens folder and triggers Check mail between attempts.
 */
async function waitForMessageInFolder(
  page,
  folderType,
  subject,
  { timeout = 120000 } = {}
) {
  await expect
    .poll(
      async () => {
        await openFolder(page, folderType)
        await triggerCheckMail(page)
        await waitForListReady(page, listReadyOptions).catch(() => undefined)
        return messageItemBySubject(page, subject)
          .isVisible()
          .catch(() => false)
      },
      { timeout: T(timeout), intervals: [2000, 3000, 5000, 8000] }
    )
    .toBe(true)
  return messageItemBySubject(page, subject)
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
  clickMoveToFolder,
  visibleSubject,
  waitForListReady,
  waitForListReadySoft,
  listReadyOptions,
  clickReady,
  step,
  attachScreenshot,
  messageItemBySubject,
  triggerCheckMail,
  waitForComposeAttachmentReady,
  waitForMessageInFolder,
  clickMessageListItem,
  waitForOpenedMessageView,
}
