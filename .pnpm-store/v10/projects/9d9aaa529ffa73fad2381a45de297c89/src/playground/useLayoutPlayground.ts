import { useEffect, useRef, useState } from 'react'
import type { JSONContent } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import StarterKit from '@tiptap/starter-kit'
import { useEditor } from '@tiptap/react'
import { LayoutKit } from '../../../src'
import { exampleMarkdown } from '../demo'
import {
  canonicalizeSourceMarkdown,
  parseSourceMarkdown,
  resolveModeSwitch,
  type PlaygroundEditorMode,
} from './source-sync'

export function useLayoutPlayground() {
  const [editorMode, setEditorMode] = useState<PlaygroundEditorMode>('visual')
  const [documentJson, setDocumentJson] = useState<JSONContent>(
    parseSourceMarkdown(exampleMarkdown).documentJson!,
  )
  const [sourceMarkdown, setSourceMarkdown] = useState(exampleMarkdown)
  const [parseError, setParseError] = useState('')
  const previousEditorModeRef = useRef<PlaygroundEditorMode>('visual')

  function updateSourceMarkdown(nextMarkdown: string) {
    setSourceMarkdown(nextMarkdown)

    const { documentJson: nextDocument, parseError: nextParseError } =
      parseSourceMarkdown(nextMarkdown)

    if (nextDocument) {
      setDocumentJson(nextDocument)
    }

    setParseError(nextParseError)
  }

  function formatSourceMarkdown() {
    if (parseError) {
      return
    }

    setSourceMarkdown(canonicalizeSourceMarkdown(documentJson))
  }

  function updateEditorMode(nextMode: PlaygroundEditorMode) {
    const resolved = resolveModeSwitch({
      currentMode: editorMode,
      nextMode,
      documentJson,
      sourceMarkdown,
      parseError,
    })

    setEditorMode(resolved.nextMode)
    setSourceMarkdown(resolved.sourceMarkdown)
  }

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'layout-surface',
      },
    },
    extensions: [StarterKit, Highlight, LayoutKit],
    content: documentJson,
    onCreate: ({ editor: currentEditor }) => {
      setDocumentJson(currentEditor.getJSON())
      setSourceMarkdown(canonicalizeSourceMarkdown(currentEditor.getJSON()))
      setParseError('')
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextDocument = currentEditor.getJSON()
      setDocumentJson(nextDocument)
      setSourceMarkdown(canonicalizeSourceMarkdown(nextDocument))
      setParseError('')
    },
  })

  useEffect(() => {
    const previousEditorMode = previousEditorModeRef.current
    previousEditorModeRef.current = editorMode

    if (
      !editor
      || editorMode !== 'visual'
      || previousEditorMode === 'visual'
      || parseError
    ) {
      return
    }

    editor.commands.setContent(documentJson, { emitUpdate: false })
  }, [documentJson, editor, editorMode, parseError])

  return {
    documentJson,
    editor,
    editorMode,
    formatSourceMarkdown,
    parseError,
    setEditorMode: updateEditorMode,
    setSourceMarkdown: updateSourceMarkdown,
    sourceMarkdown,
  }
}
