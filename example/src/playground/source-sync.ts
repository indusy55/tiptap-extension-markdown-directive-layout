import {
  normalizeLayoutMarkdown,
  parseLayoutMarkdown,
  type MarkdownRoot,
} from '../../../src'

export type PlaygroundEditorMode = 'visual' | 'source'

export function canonicalizeSourceMarkdown(markdown: string): string {
  return normalizeLayoutMarkdown(markdown)
}

export function parseSourceMarkdown(nextMarkdown: string): {
  documentAst: MarkdownRoot | null
  parseError: string
} {
  try {
    return {
      documentAst: parseLayoutMarkdown(nextMarkdown),
      parseError: '',
    }
  } catch (error) {
    return {
      documentAst: null,
      parseError: error instanceof Error ? error.message : 'Unknown parse error',
    }
  }
}

export function resolveModeSwitch(options: {
  currentMode: PlaygroundEditorMode
  nextMode: PlaygroundEditorMode
  committedMarkdown: string
  sourceMarkdown: string
  parseError: string
}): {
  committedMarkdown: string
  nextMode: PlaygroundEditorMode
  sourceMarkdown: string
} {
  const {
    currentMode,
    nextMode,
    committedMarkdown,
    sourceMarkdown,
    parseError,
  } = options

  if (currentMode === nextMode) {
    return {
      committedMarkdown,
      nextMode,
      sourceMarkdown,
    }
  }

  if (nextMode === 'source') {
    return {
      committedMarkdown,
      nextMode,
      sourceMarkdown: committedMarkdown,
    }
  }

  if (parseError) {
    return {
      committedMarkdown,
      nextMode: currentMode,
      sourceMarkdown,
    }
  }

  const canonicalMarkdown = canonicalizeSourceMarkdown(sourceMarkdown)

  return {
    committedMarkdown: canonicalMarkdown,
    nextMode,
    sourceMarkdown: canonicalMarkdown,
  }
}
