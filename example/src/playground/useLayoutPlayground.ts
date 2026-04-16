import { useState } from 'react'
import { exampleMarkdown } from '../demo'
import {
  canonicalizeSourceMarkdown,
  parseSourceMarkdown,
  resolveModeSwitch,
  type PlaygroundEditorMode,
} from './source-sync'

export function useLayoutPlayground() {
  const initialMarkdown = canonicalizeSourceMarkdown(exampleMarkdown)
  const initialParsed = parseSourceMarkdown(initialMarkdown)
  const [editorMode, setEditorMode] = useState<PlaygroundEditorMode>('visual')
  const [documentAst, setDocumentAst] = useState(initialParsed.documentAst)
  const [committedMarkdown, setCommittedMarkdown] = useState(initialMarkdown)
  const [sourceMarkdown, setSourceMarkdown] = useState(initialMarkdown)
  const [parseError, setParseError] = useState('')

  function updateSourceMarkdown(nextMarkdown: string) {
    setSourceMarkdown(nextMarkdown)

    const { documentAst: nextDocumentAst, parseError: nextParseError } =
      parseSourceMarkdown(nextMarkdown)

    if (nextDocumentAst) {
      setCommittedMarkdown(nextMarkdown)
      setDocumentAst(nextDocumentAst)
    }

    setParseError(nextParseError)
  }

  function formatSourceMarkdown() {
    if (parseError) {
      return
    }

    const nextMarkdown = canonicalizeSourceMarkdown(sourceMarkdown)
    setCommittedMarkdown(nextMarkdown)
    setSourceMarkdown(nextMarkdown)
    setDocumentAst(parseSourceMarkdown(nextMarkdown).documentAst)
  }

  function updateEditorMode(nextMode: PlaygroundEditorMode) {
    const resolved = resolveModeSwitch({
      currentMode: editorMode,
      nextMode,
      committedMarkdown,
      sourceMarkdown,
      parseError,
    })

    setEditorMode(resolved.nextMode)
    setCommittedMarkdown(resolved.committedMarkdown)
    setSourceMarkdown(resolved.sourceMarkdown)
  }

  function updateVisualMarkdown(nextMarkdown: string) {
    setCommittedMarkdown(nextMarkdown)
    setSourceMarkdown(nextMarkdown)

    const { documentAst: nextDocumentAst, parseError: nextParseError } =
      parseSourceMarkdown(nextMarkdown)

    setDocumentAst(nextDocumentAst)
    setParseError(nextParseError)
  }

  return {
    committedMarkdown,
    documentAst,
    editorMode,
    formatSourceMarkdown,
    parseError,
    setEditorMode: updateEditorMode,
    setSourceMarkdown: updateSourceMarkdown,
    setVisualMarkdown: updateVisualMarkdown,
    sourceMarkdown,
  }
}
