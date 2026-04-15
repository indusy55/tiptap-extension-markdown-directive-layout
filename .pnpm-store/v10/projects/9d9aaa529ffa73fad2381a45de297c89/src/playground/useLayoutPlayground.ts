import { useEffect, useRef, useState } from 'react'
import type { JSONContent } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import StarterKit from '@tiptap/starter-kit'
import { useEditor } from '@tiptap/react'
import {
  LayoutKit,
  parseLayoutDocument,
  serializeLayoutDocument,
} from '../../../src'
import { exampleMarkdown } from '../demo'

export function useLayoutPlayground() {
  const [editorMode, setEditorMode] = useState<'visual' | 'source'>('visual')
  const [documentJson, setDocumentJson] = useState<JSONContent>(
    parseLayoutDocument(exampleMarkdown),
  )
  const [sourceMarkdown, setSourceMarkdown] = useState(exampleMarkdown)
  const [parseError, setParseError] = useState('')
  const previousEditorModeRef = useRef<'visual' | 'source'>('visual')

  function updateSourceMarkdown(nextMarkdown: string) {
    setSourceMarkdown(nextMarkdown)

    try {
      const nextDocument = parseLayoutDocument(nextMarkdown)
      setDocumentJson(nextDocument)
      setParseError('')
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Unknown parse error')
    }
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
      setSourceMarkdown(serializeLayoutDocument(currentEditor.getJSON()))
      setParseError('')
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextDocument = currentEditor.getJSON()
      setDocumentJson(nextDocument)
      setSourceMarkdown(serializeLayoutDocument(nextDocument))
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
    parseError,
    setEditorMode,
    setSourceMarkdown: updateSourceMarkdown,
    sourceMarkdown,
  }
}
