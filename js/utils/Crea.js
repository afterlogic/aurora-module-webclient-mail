'use strict'

function getExelStyles(html, className) {
  const re = new RegExp(`.${className}\\s*{([^}]*)}`, 'gm')
  const matches = [...html.matchAll(re)]
  if (matches.length === 1 && matches[0].length === 2) {
    const styles = matches[0][1].replaceAll('\r', '').replaceAll('\n', '').replaceAll('\t', '').split(';')
    const stylesProperties = {}
    styles.forEach((style) => {
      if (style) {
        const styleParts = style.split(':')
        stylesProperties[styleParts[0]] = styleParts[1]
      }
    })
    return stylesProperties
  }
  return false
}

module.exports = {
  /**
   * Fragments pasted from MS Excel contain a bunch of styles in the style tag, the browser cuts them out.
   * This method finds the MS Excel class names in the fragment and, if found, places the styles from the classes as inline styles to the elements.
   */
  preparePastedHtml(html) {
    const regex = /class=["']{0,1}(xl\d+)["']{0,1}/gm
    const matches = [...html.matchAll(regex)]
    if (matches.length > 0) {
      const fragment = $(`<div>${html}</div>`)
      matches.forEach((group) => {
        const className = group[1]
        const styles = getExelStyles(html, className)
        if (styles) {
          const elem = fragment.find(`.${className}`)
          elem.css(styles)
        }
      })

      return fragment.html()
    }
    return false
  },
}
