import { useState } from 'react'
import './App.css'
import { AstDrawer } from './playground/AstDrawer'
import { EditorPane } from './playground/EditorPane'
import { PreviewPane } from './playground/PreviewPane'
import { useLayoutPlayground } from './playground/useLayoutPlayground'

function App() {
  const [astOpen, setAstOpen] = useState(false)
  const {
    committedMarkdown,
    documentAst,
    editorMode,
    formatSourceMarkdown,
    parseError,
    setEditorMode,
    setSourceMarkdown,
    setVisualMarkdown,
    sourceMarkdown,
  } = useLayoutPlayground()

  return (
    <div className="app-shell">
      <div className="playground-title">Layout Markdown Playground</div>
      <main className="playground">
        <EditorPane
          committedMarkdown={committedMarkdown}
          editorMode={editorMode}
          parseError={parseError}
          sourceMarkdown={sourceMarkdown}
          onEditorModeChange={setEditorMode}
          onFormatSource={formatSourceMarkdown}
          onSourceMarkdownChange={setSourceMarkdown}
          onVisualMarkdownChange={setVisualMarkdown}
        />
        <PreviewPane markdown={committedMarkdown} parseError={parseError} />
      </main>
      <AstDrawer
        astOpen={astOpen}
        documentAst={documentAst}
        parseError={parseError}
        onToggle={() => setAstOpen(open => !open)}
      />
    </div>
  )
}

export default App
