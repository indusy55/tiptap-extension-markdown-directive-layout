import type { JSONContent } from '@tiptap/core'

type AstDrawerProps = {
  astOpen: boolean
  parseError: string
  documentJson: JSONContent
  onToggle: () => void
}

export function AstDrawer({
  astOpen,
  parseError,
  documentJson,
  onToggle,
}: AstDrawerProps) {
  return (
    <aside className={`ast-drawer ${astOpen ? 'is-open' : ''}`}>
      <button type="button" className="ast-toggle" onClick={onToggle}>
        AST
      </button>
      <div className="ast-panel">
        <pre>{parseError || JSON.stringify(documentJson, null, 2)}</pre>
      </div>
    </aside>
  )
}
