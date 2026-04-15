import { useEffect } from 'react'
import {
  defaultValueCtx,
  Editor,
  editorViewOptionsCtx,
  remarkPluginsCtx,
  rootCtx,
} from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { replaceAll } from '@milkdown/kit/utils'
import {
  Milkdown,
  MilkdownProvider,
  useEditor,
  useInstance,
} from '@milkdown/react'
import remarkDirective from 'remark-directive'
import {
  remarkLayoutDirectiveEmptyLines,
  remarkLayoutDirectives,
} from '../../../src'
import { milkdownLayoutPlugins } from './milkdown-layout'

type PreviewPaneProps = {
  markdown: string
  parseError: string
}

function PreviewSurface({ markdown }: { markdown: string }) {
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
        ctx.update(editorViewOptionsCtx, options => ({
          ...options,
          editable: () => false,
        }))
      })
      .use(commonmark)
      .use(milkdownLayoutPlugins)
  }, [])

  const [instanceLoading, getEditor] = useInstance()

  useEffect(() => {
    if (instanceLoading) {
      return
    }

    const editor = getEditor()
    editor?.action(replaceAll(markdown, true))
  }, [getEditor, instanceLoading, markdown])

  return (
    <div className="preview-document">
      <div className="layout-surface preview-surface">
        {loading ? <div className="editor-loading">Loading preview...</div> : null}
        <Milkdown />
      </div>
    </div>
  )
}

export function PreviewPane({ markdown, parseError }: PreviewPaneProps) {
  return (
    <section className="pane preview-pane">
      {parseError ? (
        <div className="preview-error">{parseError}</div>
      ) : (
        <div className="pane-scroll">
          <div className="preview-stage">
            <MilkdownProvider>
              <PreviewSurface markdown={markdown} />
            </MilkdownProvider>
          </div>
        </div>
      )}
    </section>
  )
}
