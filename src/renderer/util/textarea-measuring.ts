
const measuringDiv = document.createElement('div')
measuringDiv.style.whiteSpace = 'pre-wrap'
measuringDiv.style.wordWrap = 'break-word'
measuringDiv.style.position = 'absolute'
measuringDiv.style.visibility = 'hidden'

function copyStylesToMeasuringDiv(textarea: HTMLTextAreaElement) {
  const styles = window.getComputedStyle(textarea)
  measuringDiv.style.width = styles.width
  measuringDiv.style.font = styles.font
  measuringDiv.style.lineHeight = styles.lineHeight
  measuringDiv.style.padding = styles.padding
  measuringDiv.style.border = styles.border
  measuringDiv.style.boxSizing = styles.boxSizing
}

export function calculateCursorPosition(
  textarea: HTMLTextAreaElement,
): { firstLine: boolean, lastLine: boolean } {
  copyStylesToMeasuringDiv(textarea)
  document.body.appendChild(measuringDiv)
  const cursorPosition = textarea.selectionStart;
  const textBeforeCursor = textarea.value.substring(0, cursorPosition);
  const textAfterCursor = textarea.value.substring(cursorPosition);
  measuringDiv.innerHTML = textBeforeCursor + '<span id="cursor"></span>' + textAfterCursor;
  const cursorSpan = measuringDiv.querySelector('#cursor');
  if (!cursorSpan) {
    console.error('Cursor span not found')
    return { firstLine: false, lastLine: false }
  }
  const cursorRect = cursorSpan.getBoundingClientRect()
  const styles = window.getComputedStyle(textarea)
  const lineHeight = parseFloat(styles.lineHeight)
  if (Number.isNaN(lineHeight)) {
    console.warn('Couldn\'t parse lineHeight value: \'' + styles.lineHeight + '\'')
    return { firstLine: false, lastLine: false }
  }
  const textBoxRect = measuringDiv.getBoundingClientRect()
  document.body.removeChild(measuringDiv)
  return {
    firstLine: Math.abs(textBoxRect.top - cursorRect.top) < lineHeight,
    lastLine: Math.abs(textBoxRect.bottom - cursorRect.bottom) < lineHeight,
  };
}
