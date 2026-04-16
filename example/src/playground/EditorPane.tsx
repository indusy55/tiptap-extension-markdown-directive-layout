import {
  defaultValueCtx,
  Editor,
  editorViewCtx,
  remarkPluginsCtx,
  rootCtx,
} from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { history } from '@milkdown/kit/plugin/history'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { TextSelection } from '@milkdown/kit/prose/state'
import { insert } from '@milkdown/kit/utils'
import {
  Milkdown,
  MilkdownProvider,
  useEditor,
  useInstance,
} from '@milkdown/react'
import { useEffect, useRef } from 'react'
import remarkDirective from 'remark-directive'
import {
  remarkLayoutDirectiveEmptyLines,
  remarkLayoutDirectives,
} from '../../../src'
import { milkdownLayoutPlugins } from './milkdown-layout'

type EditorPaneProps = {
  committedMarkdown: string
  editorMode: 'visual' | 'source'
  parseError: string
  sourceMarkdown: string
  onEditorModeChange: (mode: 'visual' | 'source') => void
  onFormatSource: () => void
  onSourceMarkdownChange: (value: string) => void
  onVisualMarkdownChange: (value: string) => void
}

type ToolbarAction = {
  label: string
  markdown: string
  title: string
}

const insertActions: ToolbarAction[] = [
  {
    label: 'Stack',
    title: 'Insert a vertical stack section',
    markdown: [
      '',
      '::::stack{gap="2"}',
      'Paragraph',
      '::::',
      '',
    ].join('\n'),
  },
  {
    label: 'Grid',
    title: 'Insert a simple two-column grid',
    markdown: [
      '',
      '::::grid{cols="12" gap="2"}',
      ':::cell{span="6"}',
      'Left column',
      ':::',
      ':::cell{span="6"}',
      'Right column',
      ':::',
      '::::',
      '',
    ].join('\n'),
  },
  {
    label: 'Box',
    title: 'Insert a boxed section',
    markdown: [
      '',
      ':::box{padding="2" border="subtle"}',
      'Box content',
      ':::',
      '',
    ].join('\n'),
  },
  {
    label: 'Avoid',
    title: 'Insert a keep-together container',
    markdown: [
      '',
      ':::avoid',
      'Paragraph',
      ':::',
      '',
    ].join('\n'),
  },
  {
    label: 'Group',
    title: 'Insert a structural group',
    markdown: [
      '',
      ':::group',
      'Paragraph',
      ':::',
      '',
    ].join('\n'),
  },
  {
    label: 'Break',
    title: 'Insert a page break marker',
    markdown: '\n::break\n',
  },
]

function moveSelectionToDocumentEnd(editor: ReturnType<typeof useInstance>[1]) {
  const instance = editor()

  instance?.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    const selection = TextSelection.atEnd(view.state.doc)

    view.dispatch(view.state.tr.setSelection(selection))
  })
}

function VisualToolbar({
  hasUserPlacedCursorRef,
}: {
  hasUserPlacedCursorRef: { current: boolean }
}) {
  const [loading, getEditor] = useInstance()

  return (
    <>
      {insertActions.map(action => (
        <button
          key={action.label}
          type="button"
          disabled={loading}
          title={action.title}
          onClick={() => {
            if (!hasUserPlacedCursorRef.current) {
              moveSelectionToDocumentEnd(getEditor)
            }

            getEditor()?.action(insert(action.markdown))
          }}
        >
          {action.label}
        </button>
      ))}
    </>
  )
}

function VisualEditorSurface({
  markdown,
  onMarkdownChange,
  onEditorFocus,
}: {
  markdown: string
  onMarkdownChange: (markdown: string) => void
  onEditorFocus: () => void
}) {
  const { loading } = useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, markdown)
        ctx.update(remarkPluginsCtx, plugins => [
          ...plugins,
          { plugin: remarkDirective, options: {} },
          { plugin: remarkLayoutDirectives, options: {} },
          { plugin: remarkLayoutDirectiveEmptyLines, options: {} },
        ])
        ctx.get(listenerCtx).markdownUpdated((_ctx, nextMarkdown) => {
          onMarkdownChange(nextMarkdown)
        })
        ctx.get(listenerCtx).focus(() => {
          onEditorFocus()
        })
      })
      .use(commonmark)
      .use(history)
      .use(listener)
      .use(milkdownLayoutPlugins)
  }, [])

  return (
    <div className="pane-scroll">
      <article className="page editor-page">
        <div className="page-body">
          <div className="layout-surface">
            {loading ? <div className="editor-loading">Loading editor...</div> : null}
            <Milkdown />
          </div>
        </div>
      </article>
    </div>
  )
}

export function EditorPane({
  committedMarkdown,
  editorMode,
  parseError,
  sourceMarkdown,
  onEditorModeChange,
  onFormatSource,
  onSourceMarkdownChange,
  onVisualMarkdownChange,
}: EditorPaneProps) {
  const hasUserPlacedCursorRef = useRef(false)
  const sourceDisabled = editorMode !== 'source'

  useEffect(() => {
    if (editorMode === 'visual') {
      hasUserPlacedCursorRef.current = false
    }
  }, [editorMode])

  if (editorMode === 'visual') {
    return (
      <MilkdownProvider>
        <section className="pane editor-pane">
          <div className="editor-toolbar">
            <button
              type="button"
              className="is-active"
              onClick={() => onEditorModeChange('visual')}
            >
              Visual
            </button>
            <button
              type="button"
              title="Edit markdown source"
              onClick={() => onEditorModeChange('source')}
            >
              Source
            </button>
            <button
              type="button"
              disabled
              title="Canonicalize source markdown in Source mode"
            >
              Canonicalize
            </button>
            <span className="toolbar-separator" />
            <VisualToolbar hasUserPlacedCursorRef={hasUserPlacedCursorRef} />
          </div>

          <div className="editor-stage">
            <VisualEditorSurface
              markdown={committedMarkdown}
              onMarkdownChange={onVisualMarkdownChange}
              onEditorFocus={() => {
                hasUserPlacedCursorRef.current = true
              }}
            />
          </div>
        </section>
      </MilkdownProvider>
    )
  }

  return (
    <section className="pane editor-pane">
      <div className="editor-toolbar">
        <button
          type="button"
          disabled={Boolean(parseError)}
          onClick={() => onEditorModeChange('visual')}
        >
          Visual
        </button>
        <button
          type="button"
          className="is-active"
          title="Edit markdown source"
          onClick={() => onEditorModeChange('source')}
        >
          Source
        </button>
        <button
          type="button"
          disabled={sourceDisabled || Boolean(parseError)}
          title={
            parseError
              ? 'Fix markdown errors before canonicalizing'
              : 'Rewrite markdown to canonical layout markdown output'
          }
          onClick={onFormatSource}
        >
          Canonicalize
        </button>
      </div>

      <div className="editor-stage">
        <article className="page editor-page source-page">
          <div className="page-body">
            <div className="source-note">
              Markdown source view. It is the canonical text format now. While the
              current text is invalid, preview and AST stay on the latest valid
              markdown.
            </div>
            <textarea
              aria-label="Layout source editor"
              className="source-editor"
              spellCheck={false}
              value={sourceMarkdown}
              onChange={event => onSourceMarkdownChange(event.target.value)}
            />
          </div>
        </article>
      </div>
    </section>
  )
}
