import { type editor, MarkerSeverity, Uri } from 'monaco-editor'

const segmentLength = 'time.Now()'.length
const timeNowUsageWarning =
  'Warning: `time.Now()` will always return fake time. ' +
  'Change current environment to WebAssembly to use real date and time.'

/**
 * Checks if passed source code contains `time.Now()` calls and returns
 * a list of warning markers for those calls.
 *
 * Returns empty array if no calls found.
 * @param code
 * @param editorInstance
 */
export const getTimeNowUsageMarkers = (
  code: string,
  editorInstance: editor.IStandaloneCodeEditor,
): editor.IMarkerData[] => {
  const regex = /\W(time\.Now\(\))/gm
  const matches: number[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(code))) {
    matches.push(match.index)
  }

  if (matches.length === 0) {
    return []
  }

  const model = editorInstance.getModel()!
  return matches.map((index) => {
    // Skip extra character or white-space before expression
    const { lineNumber, column } = model.getPositionAt(index + 1)
    return {
      code: {
        value: 'More information',
        target: new Uri(),
      },
      severity: MarkerSeverity.Warning,
      message: timeNowUsageWarning,
      startLineNumber: lineNumber,
      endLineNumber: lineNumber,
      startColumn: column,
      endColumn: column + segmentLength,
    }
  })
}

/**
 * Wraps async function with debounce timer.
 *
 * @param fn Function
 * @param delay Debounce time
 */
export const asyncDebounce = <T>(fn: (...args) => Promise<T>, delay: number) => {
  let lastTimeoutId: NodeJS.Timeout | null = null

  return async (...args) => {
    if (lastTimeoutId) {
      clearTimeout(lastTimeoutId)
    }

    return await new Promise<T>((resolve, reject) => {
      lastTimeoutId = setTimeout(() => {
        fn(...args)
          .then(resolve)
          .catch(reject)
      }, delay)
    })
  }
}

/**
 * Wraps passed function with a debouncer
 */
export const debounce = <T>(fn: (...args) => T, delay: number) => {
  let lastTimeoutId: NodeJS.Timeout | null = null

  return (...args) => {
    if (lastTimeoutId) {
      clearTimeout(lastTimeoutId)
    }

    lastTimeoutId = setTimeout(() => fn(...args), delay)
  }
}
