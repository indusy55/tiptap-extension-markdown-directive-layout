# @indusy55/tiptap-extension-markdown-directive-layout

`@indusy55/tiptap-extension-markdown-directive-layout` is a small layout toolkit for Tiptap built on top of the official `@tiptap/markdown` pipeline.

It gives you:

- Tiptap node extensions for layout directives such as `stack`, `grid`, `cell`, `box`, `break`, `avoid`, and `group`
- A preconfigured markdown manager that turns directive-based markdown into Tiptap JSON and back
- Command helpers for inserting, wrapping, and updating layout nodes

The package is useful when you want to keep layout information in a structured, text-friendly format while still editing content through Tiptap.

The intended architecture is:

- Markdown is the input/output format
- Tiptap JSON is the live editor state
- The conversion layer is explicit and based on official `@tiptap/markdown`
- Custom layout directives only extend the markdown layer where necessary

## Recommended API

Most integrations only need these five entry points:

- `LayoutKit`: register the full layout extension set in a Tiptap editor
- `createLayoutMarkdownManager()`: create an official `MarkdownManager` preloaded with layout support
- `parseLayoutDocument()`: convert directive markdown into Tiptap JSON
- `serializeLayoutDocument()`: convert Tiptap JSON back into canonical directive markdown
- `createLayoutDirectiveNode()`: build normalized layout nodes programmatically

Everything else exported by the package is either lower-level composition API or directive internals for advanced use cases.

Design notes:

- [Architecture (ZH)](./docs/architecture_v2_zh.md)
- [Playground Model (ZH)](./docs/playground_model_v2_zh.md)

## Installation

```bash
pnpm add @indusy55/tiptap-extension-markdown-directive-layout
```

If your editor does not already include common block and inline nodes, install the Tiptap extensions you want to use alongside it, for example:

```bash
pnpm add @tiptap/core @tiptap/starter-kit
```

## Quick Start

```ts
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'
import {
  createLayoutMarkdownManager,
  LayoutKit,
} from '@indusy55/tiptap-extension-markdown-directive-layout'

const markdown = createLayoutMarkdownManager()

const source = `
::::stack{gap=3}
:::box{padding=2 bg="muted"}
Hello layout
:::
::break
::::
`

const editor = new Editor({
  extensions: [StarterKit, LayoutKit, Markdown],
  content: markdown.parse(source),
})

const output = editor.getMarkdown()
```

## How It Works

The library bridges three representations of the same document:

1. Directive-based markdown for storage or interchange
2. Tiptap JSON for editor state
3. Tiptap node extensions for editing and rendering

In practice, a common flow looks like this:

- Parse markdown with `createLayoutMarkdownManager()` or `parseLayoutDocument()`
- Feed the returned JSON into a Tiptap editor
- Let users edit through Tiptap JSON / ProseMirror state
- Serialize the updated document with `editor.getMarkdown()` or `serializeLayoutDocument()`

### Source and Visual Modes

If you build a dual-mode editor like the playground in this repo, the intended synchronization model is:

- `Visual` mode: Tiptap JSON is the live source of truth
- `Source` mode: Markdown text is the live source of truth
- preview and AST always render from the latest valid JSON
- mode switches are the place where markdown is canonicalized through `parse -> serialize`

This means source mode is not WYSIWYG. Blank lines and equivalent markdown spellings may be normalized when you format the source or switch back into visual mode.

## Stability Contract

The library-level contract we intend to keep stable is:

- Markdown is the public persistence format
- Tiptap JSON is the in-memory editing format
- `stack`, `grid`, `cell`, `box`, `break`, `avoid`, and `group` keep their directive names, node names, and normalized attribute rules
- `parseLayoutDocument()`, `serializeLayoutDocument()`, and `createLayoutMarkdownManager()` stay aligned with the official `@tiptap/markdown` pipeline
- `LayoutKit` and the `Layout` commands remain the supported editor integration surface
- direct child block editing inside layout containers keeps the guarded `Enter` behavior needed to avoid unintentionally leaving the container

The following should be treated as advanced API, not the primary compatibility target:

- low-level directive tokenizer helpers from `./directive`
- internal singleton reuse in `getLayoutMarkdownManager()`
- playground-only source/visual synchronization utilities in `example/`

## Markdown API

### `createLayoutMarkdownManager(options?)`

Creates a preconfigured official `MarkdownManager` with `StarterKit` and all layout extensions registered.

```ts
import { createLayoutMarkdownManager } from '@indusy55/tiptap-extension-markdown-directive-layout'

const markdown = createLayoutMarkdownManager()
const document = markdown.parse(':::box\n\nHello\n\n:::')
const source = markdown.serialize(document)
```

If you need extra markdown-aware extensions, pass your own `extensions` array.

`createLayoutMarkdownManager()` is the recommended entry point when you want the library to own markdown parsing and serialization behavior explicitly.

### `parseLayoutDocument(markdown)`

Parses directive-based markdown into a Tiptap `doc` JSON object using the shared preconfigured markdown manager.

```ts
import { parseLayoutDocument } from '@indusy55/tiptap-extension-markdown-directive-layout'

const document = parseLayoutDocument(`
::::grid{cols=6 gap=2}
:::cell{span=3}
Left
:::
:::cell{span=3}
Right
:::
::::
`)
```

### `serializeLayoutDocument(content)`

Serializes a Tiptap JSON document back into markdown using directive syntax on top of the official markdown pipeline.

```ts
import {
  createLayoutDirectiveNode,
  serializeLayoutDocument,
} from '@indusy55/tiptap-extension-markdown-directive-layout'

const document = {
  type: 'doc',
  content: [
    createLayoutDirectiveNode('stack', { gap: 2 }, [
      createLayoutDirectiveNode('box', { padding: 2, border: 'subtle' }, [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ]),
    ]),
  ],
}

const markdown = serializeLayoutDocument(document)
```

## Editor Integration

### `LayoutKit`

`LayoutKit` is the easiest way to register the complete layout feature set.

```ts
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { LayoutKit } from '@indusy55/tiptap-extension-markdown-directive-layout'

const editor = new Editor({
  extensions: [StarterKit, LayoutKit],
})
```

### Official Markdown Integration

If you want the editor instance itself to expose `editor.getMarkdown()` and `editor.markdown`, mount the official `Markdown` extension alongside `LayoutKit`.

```ts
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'
import { LayoutKit } from '@indusy55/tiptap-extension-markdown-directive-layout'

const editor = new Editor({
  extensions: [StarterKit, LayoutKit, Markdown],
})
```

This keeps the architecture aligned with Tiptap's official model:

- Markdown at the boundary
- JSON during editing
- custom layout directives handled through extension-level markdown specs

## Advanced API

The package also exports low-level directive helpers such as `createDirectiveContainerTokenizer()` and `renderDirectiveMarkdown()`. They are useful when you want to extend directive parsing yourself, but most consumers should prefer the higher-level layout API above.

### `getLayoutExtensions()` and `createLayoutKit()`

If you prefer to spread the extensions manually:

```ts
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import {
  getLayoutExtensions,
} from '@indusy55/tiptap-extension-markdown-directive-layout'

const editor = new Editor({
  extensions: [StarterKit, ...getLayoutExtensions()],
})
```

`createLayoutKit()` returns the same extension array and can be used the same way.

### `Layout` Commands

The `Layout` extension adds three commands to Tiptap:

- `editor.commands.insertLayoutDirective(directive, attributes?)`
- `editor.commands.wrapInLayoutDirective(directive, attributes?)`
- `editor.commands.updateLayoutDirectiveAttributes(directive, attributes?)`

Example:

```ts
editor.commands.insertLayoutDirective('break')

editor.commands.wrapInLayoutDirective('box', {
  padding: 2,
  border: 'subtle',
})

editor.commands.updateLayoutDirectiveAttributes('grid', {
  cols: 8,
  gap: 2,
})
```

## Building Documents Programmatically

### `createLayoutDirectiveNode(directive, attributes?, content?)`

Use `createLayoutDirectiveNode()` to generate normalized Tiptap JSON nodes in code.

```ts
import { createLayoutDirectiveNode } from '@indusy55/tiptap-extension-markdown-directive-layout'

const grid = createLayoutDirectiveNode('grid', { cols: '6', gap: 2 }, [
  createLayoutDirectiveNode('cell', { span: 3 }, [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Left column' }],
    },
  ]),
  createLayoutDirectiveNode('cell', { span: 3 }, [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Right column' }],
    },
  ]),
])
```

Attributes are normalized and validated before the node is created. For example, numeric strings such as `{ cols: '6' }` are accepted, while invalid values throw errors.

## Supported Directives

Container directives:

- `stack`
- `grid`
- `cell`
- `box`
- `avoid`
- `group`

Leaf directive:

- `break`

### Attribute Reference

| Directive | Attributes | Defaults |
| --- | --- | --- |
| `stack` | `gap` | `gap: 0` |
| `grid` | `cols`, `gap` | `cols: 12`, `gap: 0` |
| `cell` | `span` | `span: 1` |
| `box` | `padding`, `margin`, `border`, `radius`, `bg`, `shadow`, `overflow` | `padding: 0`, `margin: 0`, `border: 'none'`, `radius: 0`, `bg: 'none'`, `shadow: 'none'`, `overflow: 'clip'` |
| `avoid` | none | no attributes |
| `group` | none | no attributes |
| `break` | none | no attributes |

Validation rules enforced by the package include:

- `grid.cols` must be an integer between `1` and `24`
- `cell.span` must be an integer between `1` and `24`
- numeric spacing values must be integers greater than or equal to `0`
- `box.border` must be one of `none`, `subtle`, or `strong`
- `box.shadow` must be one of `none`, `sm`, `md`, or `lg`
- `box.overflow` must be `clip` or `visible`

## Markdown Syntax Notes

- `break` must use leaf directive syntax: `::break`
- `stack`, `grid`, `cell`, `box`, `avoid`, and `group` must use container directive syntax
- Nested containers may use longer fence markers, which is standard `remark-directive` behavior
- Inline directives are intentionally not supported
- During serialization, default attributes are omitted from the markdown output

Example:

```md
::::stack{gap=3}
:::box{padding="2" bg="muted"}
## Profile
:::
::break
::::
```

## HTML Output

Each layout node renders as a `div` with a `data-layout-directive` attribute and a directive-specific class name.

Examples:

- `layoutStack` renders with `data-layout-directive="stack"`
- `layoutBox` renders with `class="layout-directive layout-box"`
- numeric and string attributes are exposed as `data-layout-*` attributes when they differ from their defaults

This makes it straightforward to attach your own styling or rendering rules on top of the structural nodes.

## Development

```bash
pnpm run typecheck
pnpm test
pnpm run build
```

## License

MIT
