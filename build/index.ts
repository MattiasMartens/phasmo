import { readFileSync, writeFileSync } from 'fs'

function main() {
  const htmlTemplateContent = readFileSync('../index.html', 'utf-8')
  const compiledJavascriptContent = readFileSync('../index.temp.js', 'utf-8')

  const insertionStr = '<script id="compiled"></script>'
  if (htmlTemplateContent.includes(insertionStr)) {
    const output = htmlTemplateContent.replace(
      '<script id="compiled"></script>',
      `<script id="compiled">${compiledJavascriptContent}</script>`
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
