'use strict'

const _ = require('underscore'),
  $ = require('jquery'),
  ko = require('knockout')

const AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
  TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
  Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')

const App = require('%PathToCoreWebclientModule%/js/App.js'),
  Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
  CJua = require('%PathToCoreWebclientModule%/js/CJua.js'),
  UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js')

const Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
  AlertPopup = require('%PathToCoreWebclientModule%/js/popups/AlertPopup.js'),
  ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js')

const CAttachmentModel = require('modules/%ModuleName%/js/models/CAttachmentModel.js'),
  CColorPickerView = require('modules/%ModuleName%/js/views/CColorPickerView.js'),
  CCrea = require('modules/%ModuleName%/js/CCrea.js'),
  MailCache = require('modules/%ModuleName%/js/Cache.js'),
  Settings = require('modules/%ModuleName%/js/Settings.js'),
  TemplatesUtils = require('modules/%ModuleName%/js/utils/Templates.js'),
  sourceEditor = require('modules/%ModuleName%/js/views/html-editor/SourceEditor.js')

/**
 * @constructor
 * @param {boolean} bInsertImageAsBase64
 * @param {boolean} bAllowComposePlainText
 * @param {Object=} oParent
 */
function CHtmlEditorView(bInsertImageAsBase64, bAllowComposePlainText, oParent) {
  this.oParent = oParent

  this.creaId = 'creaId' + Math.random().toString().replace('.', '')
  this.textFocused = ko.observable(false)
  this.workareaDom = ko.observable()
  this.plaintextDom = ko.observable()
  this.uploaderAreaDom = ko.observable()
  this.editorUploaderBodyDragOver = ko.observable(false)

  this.htmlEditorDom = ko.observable()
  this.toolbarDom = ko.observable()
  this.colorPickerDropdownDom = ko.observable()
  this.insertLinkDropdownDom = ko.observable()
  this.insertImageDropdownDom = ko.observable()

  this.isFWBold = ko.observable(false)
  this.isFSItalic = ko.observable(false)
  this.isTDUnderline = ko.observable(false)
  this.isTDStrikeThrough = ko.observable(false)
  this.isEnumeration = ko.observable(false)
  this.isBullets = ko.observable(false)

  this.isEnable = ko.observable(true)
  this.isEnable.subscribe(function () {
    if (this.oCrea) {
      this.oCrea.setEditable(this.isEnable())
    }
  }, this)

  this.bInsertImageAsBase64 = bInsertImageAsBase64
  this.bAllowFileUpload = !(bInsertImageAsBase64 && window.File === undefined)
  this.bAllowInsertImage = Settings.AllowInsertImage
  this.bAllowHorizontalLineButton = Settings.AllowHorizontalLineButton

  this.bAllowComposePlainText = bAllowComposePlainText
  this.plainTextMode = ko.observable(false)
  this.changeTextModeTitle = ko.computed(function () {
    return this.plainTextMode()
      ? TextUtils.i18n('%MODULENAME%/LINK_TURNOFF_PLAINTEXT')
      : TextUtils.i18n('%MODULENAME%/LINK_TURNON_PLAINTEXT')
  }, this)

  this.bAllowEditHtmlSource = Settings.AllowEditHtmlSource
  this.editSourceMode = ko.observable(false)
  this.htmlSourceDom = ko.observable()
  this.htmlSourceDom.subscribe(() => {
    sourceEditor.setHtmlSourceDom(this.htmlSourceDom())
  })
  this.sourceCodeButtonText = ko.computed(() => {
    return this.editSourceMode()
      ? TextUtils.i18n('%MODULENAME%/ACTION_EDIT_HTML_PREVIEW')
      : TextUtils.i18n('%MODULENAME%/ACTION_EDIT_HTML_SOURCE_CODE')
  })

  this.lockFontSubscribing = ko.observable(false)
  this.bAllowImageDragAndDrop = !Browser.ie10AndAbove

  this.aFonts = ['Arial', 'Arial Black', 'Courier New', 'Tahoma', 'Times New Roman', 'Verdana']
  this.sDefaultFont = Settings.DefaultFontName
  this.correctFontFromSettings()
  this.selectedFont = ko.observable('')
  this.selectedFont.subscribe(function () {
    if (this.oCrea && !this.lockFontSubscribing() && !this.inactive()) {
      this.oCrea.fontName(this.selectedFont())
    }
  }, this)

  this.iDefaultSize = Settings.DefaultFontSize
  this.selectedSize = ko.observable(0)
  this.selectedSize.subscribe(function () {
    if (this.oCrea && !this.lockFontSubscribing() && !this.inactive()) {
      this.oCrea.fontSize(this.selectedSize())
    }
  }, this)

  this.visibleInsertLinkPopup = ko.observable(false)
  this.linkForInsert = ko.observable('')
  this.linkFocused = ko.observable(false)
  this.visibleLinkPopup = ko.observable(false)
  this.linkPopupDom = ko.observable(null)
  this.linkHrefDom = ko.observable(null)
  this.linkHref = ko.observable('')
  this.visibleLinkHref = ko.observable(false)

  this.visibleImagePopup = ko.observable(false)
  this.visibleImagePopup.subscribe(function () {
    this.onImageOut()
  }, this)
  this.imagePopupTop = ko.observable(0)
  this.imagePopupLeft = ko.observable(0)
  this.imageSelected = ko.observable(false)

  this.tooltipText = ko.observable('')
  this.tooltipPopupTop = ko.observable(0)
  this.tooltipPopupLeft = ko.observable(0)

  this.visibleInsertImagePopup = ko.observable(false)
  this.imageUploaderButton = ko.observable(null)
  this.aUploadedImagesData = []
  this.imagePathFromWeb = ko.observable('')
  this.visibleTemplatePopup = ko.observable(false)

  this.visibleFontColorPopup = ko.observable(false)
  this.oFontColorPickerView = new CColorPickerView(
    TextUtils.i18n('%MODULENAME%/LABEL_TEXT_COLOR'),
    this.setTextColorFromPopup,
    this
  )
  this.oBackColorPickerView = new CColorPickerView(
    TextUtils.i18n('%MODULENAME%/LABEL_BACKGROUND_COLOR'),
    this.setBackColorFromPopup,
    this
  )

  this.inactive = ko.observable(false)
  this.sPlaceholderText = ''

  this.bAllowChangeInputDirection = UserSettings.IsRTL || Settings.AllowChangeInputDirection
  this.disableEdit = ko.observable(false)

  this.textChanged = ko.observable(false)

  this.actualTextChanged = ko.observable(false)

  this.templates = ko.observableArray([])
  TemplatesUtils.initTemplatesSubscription(this.templates)

  this.imageResizeOptions = []

  _.each(Settings.ImageResizerOptions, (value, label) => {
    this.imageResizeOptions.push({
      label: TextUtils.i18n(label),
      value: value,
    })
  })
}

CHtmlEditorView.prototype.ViewTemplate = '%ModuleName%_HtmlEditorView'

CHtmlEditorView.prototype.setInactive = function (bInactive) {
  this.inactive(bInactive)
  if (this.inactive()) {
    if (this.editSourceMode()) {
      this.toggleSourceEdit()
    }
    this.setPlaceholder()
  } else {
    this.removePlaceholder()
  }
}

CHtmlEditorView.prototype.setPlaceholder = function () {
  var sText = this.removeAllTags(this.getText())
  if (sText === '' || sText === '&nbsp;') {
    this.setText('<span>' + this.sPlaceholderText + '</span>')
    if (this.oCrea) {
      this.oCrea.setBlur()
    }
  }
}

CHtmlEditorView.prototype.removePlaceholder = function () {
  var sText = this.oCrea ? this.removeAllTags(this.oCrea.getText(false)) : ''
  if (sText === this.sPlaceholderText) {
    this.setText('')
    if (this.oCrea) {
      this.oCrea.setFocus(true)
    }
  }
}

CHtmlEditorView.prototype.hasOpenedPopup = function () {
  return (
    this.visibleInsertLinkPopup() ||
    this.visibleLinkPopup() ||
    this.visibleImagePopup() ||
    this.visibleInsertImagePopup() ||
    this.visibleFontColorPopup() ||
    this.visibleTemplatePopup()
  )
}

CHtmlEditorView.prototype.setDisableEdit = function (bDisableEdit) {
  this.disableEdit(!!bDisableEdit)
}

CHtmlEditorView.prototype.correctFontFromSettings = function () {
  var sDefaultFont = this.sDefaultFont,
    bFound = false
  _.each(this.aFonts, function (sFont) {
    if (sFont.toLowerCase() === sDefaultFont.toLowerCase()) {
      sDefaultFont = sFont
      bFound = true
    }
  })

  if (bFound) {
    this.sDefaultFont = sDefaultFont
  } else {
    this.aFonts.push(sDefaultFont)
  }
}

/**
 * @param {Object} $link
 */
CHtmlEditorView.prototype.showLinkPopup = function ($link) {
  var $workarea = $(this.workareaDom()),
    $composePopup = $workarea.closest('.panel.compose'),
    oWorkareaPos = $workarea.position(),
    oPos = $link.position(),
    iHeight = $link.height(),
    iLeft = Math.round(oPos.left + oWorkareaPos.left),
    iTop = Math.round(oPos.top + iHeight + oWorkareaPos.top)
  this.linkHref($link.attr('href') || $link.text())
  $(this.linkPopupDom()).css({
    left: iLeft,
    top: iTop,
  })
  $(this.linkHrefDom()).css({
    left: iLeft,
    top: iTop,
  })

  if (!Browser.firefox && $composePopup.length === 1) {
    $(this.linkPopupDom()).css({
      'max-width': $composePopup.width() - iLeft - 40 + 'px',
      'white-space': 'pre-line',
      'word-wrap': 'break-word',
    })
  }

  this.visibleLinkPopup(true)
}

CHtmlEditorView.prototype.hideLinkPopup = function () {
  this.visibleLinkPopup(false)
}

CHtmlEditorView.prototype.showChangeLink = function () {
  this.visibleLinkHref(true)
  this.hideLinkPopup()
}

CHtmlEditorView.prototype.changeLink = function () {
  this.oCrea.changeLink(this.linkHref())
  this.hideChangeLink()
}

CHtmlEditorView.prototype.hideChangeLink = function () {
  this.visibleLinkHref(false)
}

/**
 * @param {jQuery} $image
 * @param {Object} oEvent
 */
CHtmlEditorView.prototype.showImagePopup = function ($image, oEvent) {
  var $workarea = $(this.workareaDom()),
    oWorkareaPos = $workarea.position(),
    oWorkareaOffset = $workarea.offset()
  this.imagePopupLeft(Math.round(oEvent.pageX + oWorkareaPos.left - oWorkareaOffset.left))
  this.imagePopupTop(Math.round(oEvent.pageY + oWorkareaPos.top - oWorkareaOffset.top))

  this.visibleImagePopup(true)
}

CHtmlEditorView.prototype.hideImagePopup = function () {
  this.visibleImagePopup(false)
}

CHtmlEditorView.prototype.resizeImage = function (sSize) {
  var oParams = {
    width: 'auto',
    height: 'auto',
  }

  if (sSize) {
    oParams.width = sSize
  }

  this.oCrea.changeCurrentImage(oParams)

  this.visibleImagePopup(false)
}

CHtmlEditorView.prototype.onImageOver = function (oEvent) {
  if (oEvent.target.nodeName === 'IMG' && !this.visibleImagePopup()) {
    this.imageSelected(true)

    this.tooltipText(TextUtils.i18n('%MODULENAME%/ACTION_CLICK_TO_EDIT_IMAGE'))

    var self = this,
      $workarea = $(this.workareaDom())
    $workarea.bind('mousemove.image', function (oEvent) {
      var oWorkareaPos = $workarea.position(),
        oWorkareaOffset = $workarea.offset()
      self.tooltipPopupTop(Math.round(oEvent.pageY + oWorkareaPos.top - oWorkareaOffset.top))
      self.tooltipPopupLeft(Math.round(oEvent.pageX + oWorkareaPos.left - oWorkareaOffset.left))
    })
  }

  return true
}

CHtmlEditorView.prototype.onImageOut = function (oEvent) {
  if (this.imageSelected()) {
    this.imageSelected(false)

    var $workarea = $(this.workareaDom())
    $workarea.unbind('mousemove.image')
  }

  return true
}

CHtmlEditorView.prototype.commit = function () {
  this.textChanged(false)
}

/**
 * @param {string} sText
 * @param {boolean} bPlain
 * @param {string} sTabIndex
 * @param {string} sPlaceholderText
 */
CHtmlEditorView.prototype.init = function (sText, bPlain, sTabIndex, sPlaceholderText) {
  this.sPlaceholderText = sPlaceholderText || ''

  if (this.oCrea) {
    this.oCrea.$container = $('#' + this.oCrea.oOptions.creaId)
    // in case if knockoutjs destroyed dom element with html editor
    if (this.oCrea.$container.children().length === 0) {
      this.oCrea.start(this.isEnable())
      // this.editorUploader must be re-initialized because compose popup is destroyed after it is closed
      this.initEditorUploader()
    }
  } else {
    $(document.body).on(
      'click',
      _.bind(function (oEvent) {
        var oParent = $(oEvent.target).parents('span.dropdown_helper')
        if (oParent.length === 0) {
          this.closeAllPopups(true)
        }
      }, this)
    )

    this.initEditorUploader()

    this.oCrea = new CCrea({
      creaId: this.creaId,
      fontNameArray: this.aFonts,
      defaultFontName: this.sDefaultFont,
      defaultFontSize: this.iDefaultSize,
      alwaysTryUseImageWhilePasting: Settings.AlwaysTryUseImageWhilePasting,
      isRtl: UserSettings.IsRTL,
      enableDrop: false,
      onChange: _.bind(function () {
        this.textChanged(true)
        this.actualTextChanged.valueHasMutated()
      }, this),
      onCursorMove: _.bind(this.setFontValuesFromText, this),
      onFocus: _.bind(this.onCreaFocus, this),
      onBlur: _.bind(this.onCreaBlur, this),
      onUrlIn: _.bind(this.showLinkPopup, this),
      onUrlOut: _.bind(this.hideLinkPopup, this),
      onImageSelect: _.bind(this.showImagePopup, this),
      onImageBlur: _.bind(this.hideImagePopup, this),
      onItemOver: Browser.mobileDevice || App.isMobile() ? null : _.bind(this.onImageOver, this),
      onItemOut: Browser.mobileDevice || App.isMobile() ? null : _.bind(this.onImageOut, this),
      openInsertLinkDialog: _.bind(this.insertLink, this),
      onUrlClicked: true,
    })
    this.oCrea.start(this.isEnable())

    sourceEditor.setOnChangeHandler(() => {
      this.textChanged(true)
      this.actualTextChanged.valueHasMutated()
    })
  }

  if (this.plaintextDom()) {
    this.plaintextDom().on('keyup paste', () => {
      this.textChanged(true)
      this.actualTextChanged.valueHasMutated()
    })
  }

  this.oCrea.setTabIndex(sTabIndex)
  this.clearUndoRedo()
  this.editSourceMode(false)
  sourceEditor.clear()
  this.setText(sText, bPlain)
  this.setFontValuesFromText()
  this.aUploadedImagesData = []
  this.selectedFont(this.sDefaultFont)
  this.selectedSize(this.iDefaultSize)

  TemplatesUtils.fillTemplatesOptions(this.templates)
}

CHtmlEditorView.prototype.toggleTemplatePopup = function (oViewModel, oEvent) {
  if (this.visibleTemplatePopup()) {
    this.visibleTemplatePopup(false)
  } else {
    oEvent.stopPropagation()
    this.closeAllPopups()
    this.visibleTemplatePopup(true)
  }
}

CHtmlEditorView.prototype.insertTemplate = function (sHtml, oEvent) {
  oEvent.stopPropagation()
  this.insertHtml(sHtml)
}

CHtmlEditorView.prototype.isInitialized = function () {
  return !!this.oCrea
}

CHtmlEditorView.prototype.setFocus = function () {
  if (this.oCrea) {
    this.oCrea.setFocus(false)
  }
}

/**
 * @param {string} sNewSignatureContent
 * @param {string} sOldSignatureContent
 */
CHtmlEditorView.prototype.changeSignatureContent = function (sNewSignatureContent, sOldSignatureContent) {
  if (this.oCrea && !this.disableEdit()) {
    this.oCrea.changeSignatureContent(sNewSignatureContent, sOldSignatureContent)
  }
}

CHtmlEditorView.prototype.setFontValuesFromText = function () {
  this.lockFontSubscribing(true)
  this.isFWBold(this.oCrea.getIsBold())
  this.isFSItalic(this.oCrea.getIsItalic())
  this.isTDUnderline(this.oCrea.getIsUnderline())
  this.isTDStrikeThrough(this.oCrea.getIsStrikeThrough())
  this.isEnumeration(this.oCrea.getIsEnumeration())
  this.isBullets(this.oCrea.getIsBullets())
  this.selectedFont(this.oCrea.getFontName())
  this.selectedSize(this.oCrea.getFontSizeInNumber().toString())
  this.lockFontSubscribing(false)
}

CHtmlEditorView.prototype.isUndoAvailable = function () {
  if (this.oCrea) {
    return this.oCrea.isUndoAvailable()
  }

  return false
}

CHtmlEditorView.prototype.getPlainText = function () {
  if (this.oCrea) {
    return this.oCrea.getPlainText()
  }

  return ''
}

/**
 * @param {boolean=} bRemoveSignatureAnchor = false
 */
CHtmlEditorView.prototype.getText = function (bRemoveSignatureAnchor) {
  if (this.plainTextMode()) {
    return this.plaintextDom() ? this.plaintextDom().val() : ''
  }

  if (this.editSourceMode() && sourceEditor.isInitialized()) {
    return sourceEditor.getText()
  }

  const sText = this.oCrea ? this.oCrea.getText(bRemoveSignatureAnchor) : ''
  return this.sPlaceholderText !== '' && this.removeAllTags(sText) === this.sPlaceholderText ? '' : sText
}

CHtmlEditorView.prototype.getEditableArea = function () {
  return this.oCrea.$editableArea
}

/**
 * @param {string} sText
 * @param {boolean} bPlain
 */
CHtmlEditorView.prototype.setText = function (sText, bPlain = null) {
  if (this.oCrea && !this.disableEdit()) {
    if (bPlain !== null) {
      this.plainTextMode(!!bPlain)
    }
    if (this.plainTextMode()) {
      if (TextUtils.isHtml(sText)) {
        sText = TextUtils.htmlToPlain(sText)
      }
      this.plaintextDom().val(sText)
    } else {
      if (!TextUtils.isHtml(sText)) {
        sText = TextUtils.plainToHtml(sText)
      }
      this.oCrea.setText(sText)
    }
    if (this.inactive() && sText === '') {
      this.setPlaceholder()
    }
  }
}

CHtmlEditorView.prototype.undoAndClearRedo = function () {
  if (this.oCrea) {
    this.oCrea.undo()
    this.oCrea.clearRedo()
  }
}

CHtmlEditorView.prototype.clearUndoRedo = function () {
  if (this.oCrea) {
    this.oCrea.clearUndoRedo()
  }
}

/**
 * @param {string} sText
 */
CHtmlEditorView.prototype.removeAllTags = function (sText) {
  return sText.replace(/<style>.*<\/style>/g, '').replace(/<[^>]*>/g, '')
}

CHtmlEditorView.prototype.onCreaFocus = function () {
  if (this.oCrea) {
    this.closeAllPopups()
    this.textFocused(true)
  }
}

CHtmlEditorView.prototype.onCreaBlur = function () {
  if (this.oCrea) {
    this.textFocused(false)
  }
}

CHtmlEditorView.prototype.onEscHandler = function () {
  if (!Popups.hasOpenedMaximizedPopups()) {
    this.closeAllPopups()
  }
}

/**
 * @param {boolean} bWithoutLinkPopup
 */
CHtmlEditorView.prototype.closeAllPopups = function (bWithoutLinkPopup) {
  bWithoutLinkPopup = !!bWithoutLinkPopup
  if (!bWithoutLinkPopup) {
    this.visibleLinkPopup(false)
  }
  this.visibleInsertLinkPopup(false)
  this.visibleImagePopup(false)
  this.visibleInsertImagePopup(false)
  this.visibleFontColorPopup(false)
  this.visibleTemplatePopup(false)
}

/**
 * @param {string} sHtml
 */
CHtmlEditorView.prototype.insertHtml = function (sHtml) {
  if (this.oCrea) {
    if (!this.oCrea.isFocused()) {
      this.oCrea.setFocus(true)
    }

    this.oCrea.insertHtml(sHtml, false)
  }
}

/**
 * @param {Object} oViewModel
 * @param {Object} oEvent
 */
CHtmlEditorView.prototype.insertLink = function (oViewModel, oEvent) {
  if (!this.inactive() && !this.visibleInsertLinkPopup()) {
    if (oEvent && _.isFunction(oEvent.stopPropagation)) {
      oEvent.stopPropagation()
    }
    this.linkForInsert(this.oCrea.getSelectedText())
    this.closeAllPopups()
    this.visibleInsertLinkPopup(true)
    this.linkFocused(true)
  }
}

/**
 * @param {Object} oCurrentViewModel
 * @param {Object} event
 */
CHtmlEditorView.prototype.insertLinkFromPopup = function (oCurrentViewModel, event) {
  if (this.linkForInsert().length > 0) {
    if (AddressUtils.isCorrectEmail(this.linkForInsert())) {
      this.oCrea.insertEmailLink(this.linkForInsert())
    } else {
      this.oCrea.insertLink(this.linkForInsert())
    }
  }

  this.closeInsertLinkPopup(oCurrentViewModel, event)

  return false
}

/**
 * @param {Object} oCurrentViewModel
 * @param {Object} event
 */
CHtmlEditorView.prototype.closeInsertLinkPopup = function (oCurrentViewModel, event) {
  this.visibleInsertLinkPopup(false)
  if (event) {
    event.stopPropagation()
  }
}

CHtmlEditorView.prototype.textColor = function (oViewModel, oEvent) {
  if (!this.inactive()) {
    this.closeAllPopups()
    if (!this.visibleFontColorPopup()) {
      oEvent.stopPropagation()
      this.visibleFontColorPopup(true)
      this.oFontColorPickerView.onShow()
      this.oBackColorPickerView.onShow()
    }
  }
}

/**
 * @param {string} sColor
 * @return string
 */
CHtmlEditorView.prototype.colorToHex = function (sColor) {
  if (sColor.substr(0, 1) === '#') {
    return sColor
  }

  /*jslint bitwise: true*/
  var aDigits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(sColor),
    iRed = Types.pInt(aDigits[2]),
    iGreen = Types.pInt(aDigits[3]),
    iBlue = Types.pInt(aDigits[4]),
    iRgb = iBlue | (iGreen << 8) | (iRed << 16),
    sRgb = iRgb.toString(16)
  /*jslint bitwise: false*/

  while (sRgb.length < 6) {
    sRgb = '0' + sRgb
  }

  return aDigits[1] + '#' + sRgb
}

/**
 * @param {string} sColor
 */
CHtmlEditorView.prototype.setTextColorFromPopup = function (sColor) {
  this.oCrea.textColor(this.colorToHex(sColor))
  this.closeAllPopups()
}

/**
 * @param {string} sColor
 */
CHtmlEditorView.prototype.setBackColorFromPopup = function (sColor) {
  this.oCrea.backgroundColor(this.colorToHex(sColor))
  this.closeAllPopups()
}

CHtmlEditorView.prototype.insertImage = function (oViewModel, oEvent) {
  if (!this.inactive() && Settings.AllowInsertImage && !this.visibleInsertImagePopup()) {
    oEvent.stopPropagation()
    this.imagePathFromWeb('')
    this.closeAllPopups()
    this.visibleInsertImagePopup(true)
    this.initUploader()
  }

  return true
}

/**
 * @param {Object} oCurrentViewModel
 * @param {Object} event
 */
CHtmlEditorView.prototype.insertWebImageFromPopup = function (oCurrentViewModel, event) {
  if (Settings.AllowInsertImage && this.imagePathFromWeb().length > 0) {
    this.oCrea.insertImage(this.imagePathFromWeb())
  }

  this.closeInsertImagePopup(oCurrentViewModel, event)
}

/**
 * @param {string} sUid
 * @param oAttachmentData
 */
CHtmlEditorView.prototype.insertComputerImageFromPopup = function (sUid, oAttachmentData) {
  var iAccountId = _.isFunction(this.oParent && this.oParent.senderAccountId)
      ? this.oParent.senderAccountId()
      : MailCache.currentAccountId(),
    oAttachment = new CAttachmentModel(iAccountId),
    sViewLink = '',
    bResult = false
  oAttachment.parse(oAttachmentData)
  sViewLink = oAttachment.getActionUrl('view')

  if (Settings.AllowInsertImage && sViewLink.length > 0) {
    bResult = this.oCrea.insertImage(sViewLink)
    if (bResult) {
      $(this.oCrea.$editableArea)
        .find('img[src="' + sViewLink + '"]')
        .attr('data-x-src-cid', sUid)

      oAttachmentData.CID = sUid
      this.aUploadedImagesData.push(oAttachmentData)
    }
  }

  this.closeInsertImagePopup()
}

CHtmlEditorView.prototype.getUploadedImagesData = function () {
  return this.aUploadedImagesData
}

/**
 * @param {?=} oCurrentViewModel
 * @param {?=} event
 */
CHtmlEditorView.prototype.closeInsertImagePopup = function (oCurrentViewModel, event) {
  this.visibleInsertImagePopup(false)
  if (event) {
    event.stopPropagation()
  }
}

/**
 * Initializes file uploader.
 */
CHtmlEditorView.prototype.initUploader = function () {
  // this.oJua must be re-initialized because compose popup is destroyed after it is closed
  if (this.imageUploaderButton()) {
    this.oJua = new CJua({
      action: '?/Api/',
      name: 'jua-uploader',
      queueSize: 2,
      clickElement: this.imageUploaderButton(),
      hiddenElementsPosition: UserSettings.IsRTL ? 'right' : 'left',
      disableMultiple: true,
      disableAjaxUpload: false,
      disableDragAndDrop: true,
      hidden: _.extendOwn(
        {
          Module: Settings.ServerModuleName,
          Method: 'UploadAttachment',
          Parameters: function () {
            return JSON.stringify({
              AccountID: MailCache.currentAccountId(),
            })
          },
        },
        App.getCommonRequestParameters()
      ),
    })

    if (this.bInsertImageAsBase64) {
      this.oJua.on('onSelect', _.bind(this.onEditorDrop, this))
    } else {
      this.oJua
        .on('onSelect', _.bind(this.onFileUploadSelect, this))
        .on('onComplete', _.bind(this.onFileUploadComplete, this))
    }
  }
}

/**
 * Initializes file uploader for editor.
 */
CHtmlEditorView.prototype.initEditorUploader = function () {
  // this.editorUploader must be re-initialized because compose popup is destroyed after it is closed
  if (Settings.AllowInsertImage && this.uploaderAreaDom()) {
    var fBodyDragEnter = null,
      fBodyDragOver = null
    if (
      this.oParent &&
      this.oParent.composeUploaderDragOver &&
      this.oParent.onFileUploadProgress &&
      this.oParent.onFileUploadStart &&
      this.oParent.onFileUploadComplete
    ) {
      fBodyDragEnter = _.bind(function () {
        this.editorUploaderBodyDragOver(true)
        this.oParent.composeUploaderDragOver(true)
      }, this)

      fBodyDragOver = _.bind(function () {
        this.editorUploaderBodyDragOver(false)
        this.oParent.composeUploaderDragOver(false)
      }, this)

      this.editorUploader = new CJua({
        action: '?/Api/',
        name: 'jua-uploader',
        queueSize: 1,
        dragAndDropElement: this.bAllowImageDragAndDrop ? this.uploaderAreaDom() : null,
        disableMultiple: true,
        disableAjaxUpload: false,
        disableDragAndDrop: !this.bAllowImageDragAndDrop,
        hidden: _.extendOwn(
          {
            Module: Settings.ServerModuleName,
            Method: 'UploadAttachment',
            Parameters: function () {
              return JSON.stringify({
                AccountID: MailCache.currentAccountId(),
              })
            },
          },
          App.getCommonRequestParameters()
        ),
      })

      this.editorUploader
        .on('onDragEnter', _.bind(this.oParent.composeUploaderDragOver, this.oParent, true))
        .on('onDragLeave', _.bind(this.oParent.composeUploaderDragOver, this.oParent, false))
        .on('onBodyDragEnter', fBodyDragEnter)
        .on('onBodyDragLeave', fBodyDragOver)
        .on('onProgress', _.bind(this.oParent.onFileUploadProgress, this.oParent))
        .on('onSelect', _.bind(this.onEditorDrop, this))
        .on('onStart', _.bind(this.oParent.onFileUploadStart, this.oParent))
        .on('onComplete', _.bind(this.oParent.onFileUploadComplete, this.oParent))
    } else {
      fBodyDragEnter = _.bind(this.editorUploaderBodyDragOver, this, true)
      fBodyDragOver = _.bind(this.editorUploaderBodyDragOver, this, false)

      this.editorUploader = new CJua({
        queueSize: 1,
        dragAndDropElement: this.bAllowImageDragAndDrop ? this.uploaderAreaDom() : null,
        disableMultiple: true,
        disableAjaxUpload: false,
        disableDragAndDrop: !this.bAllowImageDragAndDrop,
      })

      this.editorUploader
        .on('onBodyDragEnter', fBodyDragEnter)
        .on('onBodyDragLeave', fBodyDragOver)
        .on('onSelect', _.bind(this.onEditorDrop, this))
    }
  }
}

CHtmlEditorView.prototype.isDragAndDropSupported = function () {
  return this.editorUploader ? this.editorUploader.isDragAndDropSupported() : false
}

CHtmlEditorView.prototype.onEditorDrop = function (sUid, oData) {
  var oReader = null,
    oFile = null,
    self = this,
    bCreaFocused = false,
    hash = Math.random().toString(),
    sId = ''
  if (oData && oData.File && typeof oData.File.type === 'string') {
    if (Settings.AllowInsertImage && 0 === oData.File.type.indexOf('image/')) {
      oFile = oData.File
      if (Settings.ImageUploadSizeLimit > 0 && oFile.size > Settings.ImageUploadSizeLimit) {
        Popups.showPopup(AlertPopup, [TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_SIZE')])
      } else {
        oReader = new window.FileReader()
        bCreaFocused = this.oCrea.isFocused()
        if (!bCreaFocused) {
          this.oCrea.setFocus(true)
        }

        sId = oFile.name + '_' + hash
        this.oCrea.insertHtml('<img id="' + sId + '" src="./static/styles/images/wait.gif" />', true)
        if (!bCreaFocused) {
          this.oCrea.fixFirefoxCursorBug()
        }

        oReader.onload = function (oEvent) {
          self.oCrea.changeImageSource(sId, oEvent.target.result)
        }

        oReader.readAsDataURL(oFile)
      }
    } else {
      if (this.oParent && this.oParent.onFileUploadSelect) {
        this.oParent.onFileUploadSelect(sUid, oData)
        return true
      } else if (!Browser.ie10AndAbove) {
        Popups.showPopup(AlertPopup, [TextUtils.i18n('%MODULENAME%/ERROR_NOT_IMAGE_CHOOSEN')])
      }
    }
  }

  return false
}

/**
 * @param {Object} oFile
 */
CHtmlEditorView.prototype.isFileImage = function (oFile) {
  if (typeof oFile.Type === 'string') {
    return -1 !== oFile.Type.indexOf('image')
  } else {
    var iDotPos = oFile.FileName.lastIndexOf('.'),
      sExt = oFile.FileName.substr(iDotPos + 1),
      aImageExt = ['jpg', 'jpeg', 'gif', 'tif', 'tiff', 'png']
    return -1 !== $.inArray(sExt, aImageExt)
  }
}

/**
 * @param {string} sUid
 * @param {Object} oFile
 */
CHtmlEditorView.prototype.onFileUploadSelect = function (sUid, oFile) {
  if (!this.isFileImage(oFile)) {
    Popups.showPopup(AlertPopup, [TextUtils.i18n('%MODULENAME%/ERROR_NOT_IMAGE_CHOOSEN')])
    return false
  }

  this.closeInsertImagePopup()
  return true
}

/**
 * @param {string} sUid
 * @param {boolean} bResponseReceived
 * @param {Object} oData
 */
CHtmlEditorView.prototype.onFileUploadComplete = function (sUid, bResponseReceived, oData) {
  var sError = ''

  if (oData && oData.Result) {
    if (oData.Result.Error) {
      sError =
        oData.Result.Error === 'size'
          ? TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_SIZE')
          : TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_UNKNOWN')

      Popups.showPopup(AlertPopup, [sError])
    } else {
      this.oCrea.setFocus(true)
      this.insertComputerImageFromPopup(sUid, oData.Result.Attachment)
    }
  } else {
    Popups.showPopup(AlertPopup, [TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_UNKNOWN')])
  }
}

CHtmlEditorView.prototype.undo = function () {
  if (!this.inactive()) {
    this.oCrea.undo()
  }
  return false
}

CHtmlEditorView.prototype.redo = function () {
  if (!this.inactive()) {
    this.oCrea.redo()
  }
  return false
}

CHtmlEditorView.prototype.bold = function () {
  if (!this.inactive()) {
    this.oCrea.bold()
    this.isFWBold(!this.isFWBold())
  }
  return false
}

CHtmlEditorView.prototype.italic = function () {
  if (!this.inactive()) {
    this.oCrea.italic()
    this.isFSItalic(!this.isFSItalic())
  }
  return false
}

CHtmlEditorView.prototype.underline = function () {
  if (!this.inactive()) {
    this.oCrea.underline()
    this.isTDUnderline(!this.isTDUnderline())
  }
  return false
}

CHtmlEditorView.prototype.strikeThrough = function () {
  if (!this.inactive()) {
    this.oCrea.strikeThrough()
    this.isTDStrikeThrough(!this.isTDStrikeThrough())
  }
  return false
}

CHtmlEditorView.prototype.numbering = function () {
  if (!this.inactive()) {
    this.oCrea.numbering()
    this.isBullets(false)
    this.isEnumeration(!this.isEnumeration())
  }
  return false
}

CHtmlEditorView.prototype.bullets = function () {
  if (!this.inactive()) {
    this.oCrea.bullets()
    this.isEnumeration(false)
    this.isBullets(!this.isBullets())
  }
  return false
}

CHtmlEditorView.prototype.insertHorizontalLine = function () {
  if (!this.inactive()) {
    this.oCrea.insertHorizontalLine()
  }
  return false
}

CHtmlEditorView.prototype.blockquote = function () {
  if (!this.inactive()) {
    this.oCrea.blockquote()
  }
  return false
}

CHtmlEditorView.prototype.removeFormat = function () {
  if (!this.inactive()) {
    this.oCrea.removeFormat()
  }
  return false
}

CHtmlEditorView.prototype.setRtlDirection = function () {
  if (!this.inactive()) {
    this.oCrea.setRtlDirection()
  }
  return false
}

CHtmlEditorView.prototype.setLtrDirection = function () {
  if (!this.inactive()) {
    this.oCrea.setLtrDirection()
  }
  return false
}

/**
 * Changes text mode - html or plain text.
 */
CHtmlEditorView.prototype.changeTextMode = function () {
  const changeTextModeHandler = () => {
    if (this.plainTextMode()) {
      const plainText = '<div>' + TextUtils.plainToHtml(this.getText()) + '</div>'
      this.setText(plainText, false)
    } else {
      this.setText(this.getPlainText(), true)
    }
  }

  if (this.plainTextMode()) {
    changeTextModeHandler()
  } else {
    const confirmText = TextUtils.i18n('%MODULENAME%/CONFIRM_HTML_TO_PLAIN_FORMATTING')
    Popups.showPopup(ConfirmPopup, [
      confirmText,
      function (changeConfirmed) {
        if (changeConfirmed) {
          changeTextModeHandler()
        }
      },
    ])
  }
}

/**
 * Turns on/off plain text mode.
 * @param {boolean} bPlainTextMode
 */
CHtmlEditorView.prototype.setPlainTextMode = function (bPlainTextMode) {
  this.plainTextMode(bPlainTextMode)
}

CHtmlEditorView.prototype.toggleSourceEdit = function () {
  if (this.editSourceMode()) {
    this.setText(sourceEditor.getText())
    this.editSourceMode(false)
  } else {
    sourceEditor.setText(this.getText())
    this.editSourceMode(true)
  }
}

CHtmlEditorView.prototype.getHotKeysDescriptions = function () {
  return [
    { value: 'Ctrl+Z', action: TextUtils.i18n('%MODULENAME%/LABEL_UNDO_HOTKEY'), visible: ko.observable(true) },
    { value: 'Ctrl+Y', action: TextUtils.i18n('%MODULENAME%/LABEL_REDO_HOTKEY'), visible: ko.observable(true) },
    { value: 'Ctrl+K', action: TextUtils.i18n('%MODULENAME%/LABEL_LINK_HOTKEY'), visible: ko.observable(true) },
    { value: 'Ctrl+B', action: TextUtils.i18n('%MODULENAME%/LABEL_BOLD_HOTKEY'), visible: ko.observable(true) },
    { value: 'Ctrl+I', action: TextUtils.i18n('%MODULENAME%/LABEL_ITALIC_HOTKEY'), visible: ko.observable(true) },
    { value: 'Ctrl+U', action: TextUtils.i18n('%MODULENAME%/LABEL_UNDERLINE_HOTKEY'), visible: ko.observable(true) },
  ]
}

module.exports = CHtmlEditorView
