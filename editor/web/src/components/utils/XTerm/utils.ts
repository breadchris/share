import type { Theme } from '@fluentui/theme'
import type { ITheme } from '@xterm/xterm'

/**
 * Constructs XTerm theme from FluentUI theme
 * @see https://xtermjs.org/docs/api/terminal/interfaces/itheme/
 *
 * @param theme Current FluentUI theme
 */
export const buildXtermTheme = (theme: Theme): ITheme => {
  const { palette, semanticColors } = theme

  return {
    foreground: palette.neutralPrimary,
    background: semanticColors.bodyBackgroundChecked,
    cursor: palette.neutralSecondary,
    cursorAccent: palette.neutralSecondaryAlt,
    selectionBackground: palette.blue,
    selectionForeground: palette.neutralDark,
    black: palette.neutralPrimary,
    red: palette.red,
    green: palette.green,
    yellow: palette.yellow,
    blue: palette.blue,
    magenta: palette.magenta,
    cyan: '#99ffff',
    white: palette.neutralLighter,
    brightBlack: palette.neutralPrimary,
    brightRed: palette.red,
    brightGreen: palette.green,
    brightYellow: palette.yellow,
    brightBlue: palette.blue,
    brightMagenta: palette.magenta,
    brightCyan: '#78ffff',
    brightWhite: palette.neutralLighter,
  }
}
