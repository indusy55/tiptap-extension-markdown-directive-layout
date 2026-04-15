import type {
  MarkdownToken,
  MarkdownTokenizer,
} from '@tiptap/core'

export type DirectiveMarkdownToken = MarkdownToken & {
  attributes?: Record<string, string>
  tokens?: MarkdownToken[]
}

type DirectiveKind = 'container' | 'leaf'

const closingFencePattern = /^[ \t]{0,3}(:{3,})[ \t]*$/

export function parseDirectiveAttributes(
  attrSource = '',
): Record<string, string> {
  const attributes: Record<string, string> = {}
  const pattern =
    /([A-Za-z][\w-]*)(?:=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s]+))?/g

  for (const match of attrSource.matchAll(pattern)) {
    const key = match[1]
    const rawValue = match[2]

    if (!key) {
      continue
    }

    if (!rawValue) {
      attributes[key] = ''
      continue
    }

    if (
      (rawValue.startsWith('"') && rawValue.endsWith('"'))
      || (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      attributes[key] = rawValue.slice(1, -1)
      continue
    }

    attributes[key] = rawValue
  }

  return attributes
}

export function serializeDirectiveAttributeString(
  attributes?: Record<string, string>,
): string {
  if (!attributes || Object.keys(attributes).length === 0) {
    return ''
  }

  const parts = Object.entries(attributes).map(
    ([key, value]) => `${key}="${value}"`,
  )

  return parts.length > 0 ? `{${parts.join(' ')}}` : ''
}

function findContainerDirectiveBounds(
  source: string,
  openingLength: number,
  directiveNamesPattern: string,
): { content: string; endIndex: number } | null {
  const stack = [openingLength]
  let cursor = 0

  while (cursor < source.length) {
    const nextLineBreak = source.indexOf('\n', cursor)
    const endIndex = nextLineBreak === -1 ? source.length : nextLineBreak + 1
    const rawLine = source.slice(cursor, endIndex)
    const line = rawLine.replace(/\r?\n$/, '')
    const openingMatch = line.match(
      new RegExp(
        `^[ \\t]{0,3}(:{3,})(${directiveNamesPattern})(?:\\{([^}]*)\\})?[ \\t]*$`,
      ),
    )

    if (openingMatch) {
      stack.push(openingMatch[1]!.length)
      cursor = endIndex
      continue
    }

    const closingMatch = line.match(closingFencePattern)
    if (closingMatch) {
      const closingLength = closingMatch[1]!.length
      const expectedLength = stack[stack.length - 1]

      if (closingLength >= expectedLength) {
        stack.pop()

        if (stack.length === 0) {
          return {
            content: source.slice(0, cursor).replace(/(?:\r?\n)+$/, ''),
            endIndex,
          }
        }
      }
    }

    cursor = endIndex
  }

  return null
}

export function createDirectiveContainerTokenizer(options: {
  tokenName: string
  directiveName: string
  directiveNames: readonly string[]
}): MarkdownTokenizer {
  const { tokenName, directiveName, directiveNames } = options
  const directiveNamesPattern = directiveNames.join('|')

  return {
    name: tokenName,
    level: 'block',
    start(source) {
      const pattern = new RegExp(`^:{3,}${directiveName}(?:\\{|[ \\t]|$)`, 'm')
      const match = source.match(pattern)
      return match?.index ?? -1
    },
    tokenize(source, _tokens, lexer) {
      const openingMatch = source.match(
        new RegExp(
          `^[ \\t]{0,3}(:{3,})${directiveName}(?:\\{([^}]*)\\})?[ \\t]*(?:\\r?\\n|$)`,
        ),
      )

      if (!openingMatch) {
        return undefined
      }

      const openingFence = openingMatch[1]!
      const rawAttributes = openingMatch[2] ?? ''
      const innerSource = source.slice(openingMatch[0].length)
      const bounds = findContainerDirectiveBounds(
        innerSource,
        openingFence.length,
        directiveNamesPattern,
      )

      if (!bounds) {
        return undefined
      }

      const tokens = bounds.content
        ? lexer.blockTokens(bounds.content).map(token => {
            if (token.text && (!token.tokens || token.tokens.length === 0)) {
              return {
                ...token,
                tokens: lexer.inlineTokens(token.text),
              }
            }

            return token
          })
        : []

      return {
        type: tokenName,
        raw: source.slice(0, openingMatch[0].length + bounds.endIndex),
        attributes: parseDirectiveAttributes(rawAttributes),
        tokens,
      }
    },
  }
}

export function createDirectiveLeafTokenizer(options: {
  tokenName: string
  directiveName: string
}): MarkdownTokenizer {
  const { tokenName, directiveName } = options

  return {
    name: tokenName,
    level: 'block',
    start(source) {
      const match = source.match(
        new RegExp(`^::${directiveName}(?:\\{|[ \\t]|$)`, 'm'),
      )
      return match?.index ?? -1
    },
    tokenize(source) {
      const match = source.match(
        new RegExp(
          `^[ \\t]{0,3}::${directiveName}(?:\\{([^}]*)\\})?[ \\t]*(?:\\r?\\n|$)`,
        ),
      )

      if (!match) {
        return undefined
      }

      return {
        type: tokenName,
        raw: match[0],
        attributes: parseDirectiveAttributes(match[1] ?? ''),
      }
    },
  }
}

function getContainerFence(content: string): string {
  const matches = content.match(/^:+/gm) ?? []
  const maxLength = matches.reduce(
    (longest, current) => Math.max(longest, current.length),
    2,
  )

  return ':'.repeat(Math.max(3, maxLength + 1))
}

export function renderDirectiveMarkdown(options: {
  kind: DirectiveKind
  directiveName: string
  attributes?: Record<string, string>
  content?: string
}): string {
  const {
    kind,
    directiveName,
    attributes,
    content = '',
  } = options
  const serializedAttributes = serializeDirectiveAttributeString(attributes)

  if (kind === 'leaf') {
    return `::${directiveName}${serializedAttributes}`
  }

  const fence = getContainerFence(content)

  if (!content) {
    return `${fence}${directiveName}${serializedAttributes}\n${fence}`
  }

  return `${fence}${directiveName}${serializedAttributes}\n${content}\n${fence}`
}
