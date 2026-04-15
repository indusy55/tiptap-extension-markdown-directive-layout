import { useState } from 'react'
import './App.css'
import { AstDrawer } from './playground/AstDrawer'
import { EditorPane } from './playground/EditorPane'
import { PreviewPane } from './playground/PreviewPane'
import { useLayoutPlayground } from './playground/useLayoutPlayground'

function App() {
  const [astOpen, setAstOpen] = useState(false)
  const {
    documentJson,
    editor,
    editorMode,
    parseError,
    setEditorMode,
    setSourceMarkdown,
    sourceMarkdown,
  } = useLayoutPlayground()

  return (
    <div className="app-shell">
      <div className="playground-title">Tiptap Layout Playground</div>
      <main className="playground">
        <EditorPane
          editor={editor}
          editorMode={editorMode}
          sourceMarkdown={sourceMarkdown}
          onEditorModeChange={setEditorMode}
          onSourceMarkdownChange={setSourceMarkdown}
        />
        <PreviewPane documentJson={documentJson} parseError={parseError} />
      </main>
      <AstDrawer
        astOpen={astOpen}
        parseError={parseError}
        documentJson={documentJson}
        onToggle={() => setAstOpen(open => !open)}
      />
    </div>
  )
}

export default App
