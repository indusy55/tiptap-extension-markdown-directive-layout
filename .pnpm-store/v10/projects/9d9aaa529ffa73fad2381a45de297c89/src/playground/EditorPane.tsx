import type { Editor, JSONContent } from '@tiptap/core'
import { EditorContent } from '@tiptap/react'
import { createLayoutDirectiveNode } from '../../../src'

type EditorPaneProps = {
  editor: Editor | null
  editorMode: 'visual' | 'source'
  sourceMarkdown: string
  onEditorModeChange: (mode: 'visual' | 'source') => void
  onSourceMarkdownChange: (value: string) => void
}

type ToolbarAction = {
  label: string
  title: string
  run: (editor: Editor) => void
}

function createParagraph(text: string): JSONContent {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  }
}

const insertActions: ToolbarAction[] = [
  {
    label: 'Stack',
    title: 'Insert a vertical stack section',
    run: editor => {
      editor
        .chain()
        .focus()
        .insertContent(
          createLayoutDirectiveNode('stack', { gap: 2 }, [
            createParagraph('Stack item'),
          ]),
        )
        .run()
    },
  },
  {
    label: 'Grid',
    title: 'Insert a simple two-cell grid',
    run: editor => {
      editor
        .chain()
        .focus()
        .insertContent(
          createLayoutDirectiveNode('grid', { cols: 12, gap: 2 }, [
            createLayoutDirectiveNode('cell', { span: 6 }, [
              createParagraph('Left column'),
            ]),
            createLayoutDirectiveNode('cell', { span: 6 }, [
              createParagraph('Right column'),
            ]),
          ]),
        )
        .run()
    },
  },
  {
    label: 'Break',
    title: 'Insert a page break',
    run: editor => {
      editor.chain().focus().insertLayoutDirective('break').run()
    },
  },
]

const wrapActions: ToolbarAction[] = [
  {
    label: 'Box',
    title: 'Wrap the current block in a box',
    run: editor => {
      editor
        .chain()
        .focus()
        .wrapInLayoutDirective('box', {
          padding: 2,
          border: 'subtle',
        })
        .run()
    },
  },
  {
    label: 'Avoid',
    title: 'Keep the current block together across pages',
    run: editor => {
      editor.chain().focus().wrapInLayoutDirective('avoid').run()
    },
  },
  {
    label: 'Group',
    title: 'Wrap the current block in a group',
    run: editor => {
      editor.chain().focus().wrapInLayoutDirective('group').run()
    },
  },
]

export function EditorPane({
  editor,
  editorMode,
  sourceMarkdown,
  onEditorModeChange,
  onSourceMarkdownChange,
}: EditorPaneProps) {
  const visualDisabled = editorMode !== 'visual' || !editor

  return (
    <section className="pane editor-pane">
      <div className="editor-toolbar">
        <button
          type="button"
          className={editorMode === 'visual' ? 'is-active' : ''}
          onClick={() => onEditorModeChange('visual')}
        >
          Visual
        </button>
        <button
          type="button"
          className={editorMode === 'source' ? 'is-active' : ''}
          onClick={() => onEditorModeChange('source')}
        >
          Source
        </button>
        <span className="toolbar-separator" />
        {insertActions.map(action => (
          <button
            key={action.label}
            type="button"
            disabled={visualDisabled}
            title={action.title}
            onClick={() => {
              if (!editor || visualDisabled) {
                return
              }

              action.run(editor)
            }}
          >
            {action.label}
          </button>
        ))}
        <span className="toolbar-separator" />
        {wrapActions.map(action => (
          <button
            key={action.label}
            type="button"
            disabled={visualDisabled}
            title={action.title}
            onClick={() => {
              if (!editor || visualDisabled) {
                return
              }

              action.run(editor)
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {editor ? (
        <div className="editor-stage">
          {editorMode === 'visual' ? (
            <div className="pane-scroll">
              <article className="page editor-page">
                <div className="page-body">
                  <EditorContent editor={editor} />
                </div>
              </article>
            </div>
          ) : (
            <article className="page editor-page source-page">
              <div className="page-body">
                <textarea
                  aria-label="Layout source editor"
                  className="source-editor"
                  spellCheck={false}
                  value={sourceMarkdown}
                  onChange={event => onSourceMarkdownChange(event.target.value)}
                />
              </div>
            </article>
          )}
        </div>
      ) : (
        <div className="editor-loading">Loading editor...</div>
      )}
    </section>
  )
}
