import { readFileSync, writeFileSync } from 'fs'

function charsAfterAnnotation(str: string) {
  const annotationIndex = str.indexOf('@begin')

  if (annotationIndex === -1) {
    throw new Error('Annotation not found, write @begin where the exportable code starts.')
  }

  const substr = str.slice(annotationIndex)
  const nextNewlineIndex = substr.indexOf('\n')

  if (nextNewlineIndex === -1) {
    throw new Error('Annotation must be on its own line and have at least one line of code following it')
  }

  return substr.slice(nextNewlineIndex)
}

function main() {
  const htmlTemplateContent = readFileSync('../index.html', 'utf-8')
  const compiledJavascriptContent = readFileSync('../index.js', 'utf-8')
  const compiledStrippedJavascript = charsAfterAnnotation(compiledJavascriptContent)

  const insertionStr = '<script id="compiled"></script>'
  if (htmlTemplateContent.includes(insertionStr)) {
    const output = htmlTemplateContent.replace(
      '<script id="compiled"></script>',
      `<script id="compiled">${compiledStrippedJavascript}</script>`
    )

    writeFileSync(
      '../index.out.html',
      output
    )
  } else {
    throw new Error(`Insertion point not found in template, must match this string exactly: '<script id="compiled"></script>'`)
  }
}

main()
