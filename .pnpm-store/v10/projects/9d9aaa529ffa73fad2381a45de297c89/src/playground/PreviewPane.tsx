import type { JSONContent } from '@tiptap/core'
import { paginateDocument } from './paginate'
import { renderPreviewPageHtml } from './preview-markdown'

type PreviewPaneProps = {
  documentJson: JSONContent
  parseError: string
}

export function PreviewPane({ documentJson, parseError }: PreviewPaneProps) {
  const { pages, rootGap, usesRootStack } = paginateDocument(documentJson)

  return (
    <section className="pane preview-pane">
      {parseError ? (
        <div className="preview-error">{parseError}</div>
      ) : (
        <div className="pane-scroll">
          <div className="preview-stage">
            {pages.map(page => (
              <article key={page.index} className="page">
                <div
                  className="page-body layout-surface"
                  dangerouslySetInnerHTML={{
                    __html: renderPreviewPageHtml(page, rootGap, usesRootStack),
                  }}
                />
                <footer className="page-footer">{page.index}</footer>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
