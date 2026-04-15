import type { MarkdownRoot } from '../../../src'

type AstDrawerProps = {
  astOpen: boolean
  documentAst: MarkdownRoot | null
  parseError: string
  onToggle: () => void
}

export function AstDrawer({
  astOpen,
  documentAst,
  parseError,
  onToggle,
}: AstDrawerProps) {
  return (
    <aside className={`ast-drawer ${astOpen ? 'is-open' : ''}`}>
      <button type="button" className="ast-toggle" onClick={onToggle}>
        AST
      </button>
      <div className="ast-panel">
        <pre>{parseError || JSON.stringify(documentAst, null, 2)}</pre>
      </div>
    </aside>
  )
}
