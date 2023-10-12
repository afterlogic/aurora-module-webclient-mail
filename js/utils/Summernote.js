'use strict'

const TextUtils = require("%PathToCoreWebclientModule%/js/utils/Text.js"),
  UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js')

const Settings = require('modules/%ModuleName%/js/Settings.js')

module.exports = {
  getFontNameWithFamily(fontName) {
    if (typeof fontName !== 'string' || fontName === '') {
      return 'sans-serif'
    }

    switch (fontName) {
      case 'Arial':
      case 'Arial Black':
      case 'Tahoma':
      case 'Verdana':
        return `${fontName}, sans-serif`
      case 'Courier New':
        return `${fontName}, monospace`
      case 'Times New Roman':
        return `${fontName}, serif`
      default:
        return `${fontName}, sans-serif`
    }
  },

  getBasicStyles() {
    const basicStyles = {
      direction: UserSettings.IsRTL ? 'rtl' : 'ltr',
    }
    if (Settings.DefaultFontName !== '') {
      basicStyles['font-family'] = this.getFontNameWithFamily(Settings.DefaultFontName)
    }
    if (Settings.DefaultFontSize > 0) {
      basicStyles['font-size'] = `${Settings.DefaultFontSize}px`
    }
    return basicStyles
  },

  getBasicStylesFromNode(node) {
    const basicStyles = {}
    if (node.css('direction')) {
      basicStyles['direction'] = node.css('direction')
    }
    if (node.css('font-family')) {
      basicStyles['font-family'] = node.css('font-family')
    }
    if (node.css('font-size')) {
      basicStyles['font-size'] = node.css('font-size')
    }
    return basicStyles
  },

  getBasicStylesString(node) {
    let direction = node ? node.css('direction') : null
    if (!direction) {
      direction = UserSettings.IsRTL ? 'rtl' : 'ltr'
    }
    const basicStyles = [`direction: ${direction}`]
    const fontName = node && node.css('font-family') ? node.css('font-family') : Settings.DefaultFontName
    if (fontName) {
      basicStyles.push(`font-family: ${this.getFontNameWithFamily(fontName)}`)
    }
    const fontSize = node && node.css('font-size') ? node.css('font-size') : `${Settings.DefaultFontSize}px`
    if (!!fontSize) {
      basicStyles.push(`font-size: ${fontSize}`)
    }
    return basicStyles.join('; ')
  },

  getFontSizeButtonCreateHandler() {
    return function (context) {
      const ui = $.summernote.ui
      const buttonGroup = ui.buttonGroup([
        ui.button({
          className: 'dropdown-toggle',
          contents: ui.dropdownButtonContents('<span class="note-current-fontsize"></span>', ui.options),
          data: {
            toggle: 'dropdown',
          },
        }),
        ui.dropdownCheck({
          className: 'dropdown-fontsize',
          checkClassName: ui.options.icons.menuCheck,
          items: Settings.FontSizes.map((fontSizeData) => fontSizeData.value.toString()),
          template: (value) => {
            const sizePx = `${value}px`
            const fontSizeData = Settings.FontSizes.find((fontSizeData) => fontSizeData.value.toString() === value)
            const sizeName = fontSizeData ? `${TextUtils.i18n(fontSizeData.label)} (${value}px)` : sizePx
            return `<span style="font-size: ${sizePx};">${sizeName}</span>`
          },
          click: context.createInvokeHandlerAndUpdateState('editor.fontSize'),
        }),
      ])

      return buttonGroup.render() // return button as jquery object
    }
  },
}
