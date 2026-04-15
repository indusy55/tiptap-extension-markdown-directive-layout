import type { JSONContent } from '@tiptap/core'
import { parseLayoutDocument, serializeLayoutDocument } from '../../../src'

export type PlaygroundEditorMode = 'visual' | 'source'

export function canonicalizeSourceMarkdown(documentJson: JSONContent): string {
  return serializeLayoutDocument(documentJson)
}

export function parseSourceMarkdown(nextMarkdown: string): {
  documentJson: JSONContent | null
  parseError: string
} {
  try {
    return {
      documentJson: parseLayoutDocument(nextMarkdown),
      parseError: '',
    }
  } catch (error) {
    return {
      documentJson: null,
      parseError: error instanceof Error ? error.message : 'Unknown parse error',
    }
  }
}

export function resolveModeSwitch(options: {
  currentMode: PlaygroundEditorMode
  nextMode: PlaygroundEditorMode
  documentJson: JSONContent
  sourceMarkdown: string
  parseError: string
}): {
  nextMode: PlaygroundEditorMode
  sourceMarkdown: string
} {
  const {
    currentMode,
    nextMode,
    documentJson,
    sourceMarkdown,
    parseError,
  } = options

  if (currentMode === nextMode) {
    return {
      nextMode,
      sourceMarkdown,
    }
  }

  if (nextMode === 'source') {
    return {
      nextMode,
      sourceMarkdown: canonicalizeSourceMarkdown(documentJson),
    }
  }

  if (parseError) {
    return {
      nextMode: currentMode,
      sourceMarkdown,
    }
  }

  return {
    nextMode,
    sourceMarkdown: canonicalizeSourceMarkdown(documentJson),
  }
}
