import { readFileSync, writeFileSync } from "fs"

function charsAfterAnnotation(str: string) {
  const annotationIndex = str.indexOf('@begin')

  if (annotationIndex === -1) {
    throw new Error('Annotation not found, write "@begin" where the exportable code starts.')
  }

  const substr = str.slice(annotationIndex)
  const nextNewlineIndex = substr.indexOf('\n')

  if (nextNewlineIndex === -1) {
    throw new Error('Annotation must be on its own line and have at least one line of code following it')
  }

  return substr.slice(nextNewlineIndex)
}

function main() {
  const fileContent = readFileSync('../index.ts', 'utf-8')
  const realFile = charsAfterAnnotation(fileContent)
  writeFileSync('../index.temp.ts', realFile)
}

main()