# @indusy55/tiptap-extension-markdown-directive-layout

This package is now a markdown-first layout toolkit.

The core is built on `remark-directive`, not on Tiptap. It gives you a stable layout syntax for documents such as resume editors, plus a Milkdown-based example app that edits the same markdown visually.

## What It Provides

- Canonical layout markdown built on `remark-directive`
- Validation and normalization for `stack`, `grid`, `cell`, `box`, `break`, `avoid`, and `group`
- A remark plugin that validates layout directives and attaches normalized metadata
- Markdown AST helpers for programmatic document construction
- A Milkdown playground in `example/` showing visual edit + markdown I/O + preview + AST

Design notes:

- [Architecture (ZH)](./docs/architecture_v2_zh.md)
- [Playground Model (ZH)](./docs/playground_model_v2_zh.md)

## Installation

```bash
pnpm add @indusy55/tiptap-extension-markdown-directive-layout
```

If you want a visual editor, use the example in this repo as the reference integration for Milkdown.

## Core API

### `parseLayoutMarkdown(markdown)`

Parse markdown into mdast and validate supported layout directives.

```ts
import { parseLayoutMarkdown } from '@indusy55/tiptap-extension-markdown-directive-layout'

const ast = parseLayoutMarkdown(`
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

### `stringifyLayoutMarkdown(ast)`

Serialize a layout mdast tree back into canonical markdown.

```ts
import {
  createLayoutDirectiveNode,
  stringifyLayoutMarkdown,
} from '@indusy55/tiptap-extension-markdown-directive-layout'

const markdown = stringifyLayoutMarkdown({
  type: 'root',
  children: [
    createLayoutDirectiveNode('stack', { gap: 2 }, [
      createLayoutDirectiveNode('box', { padding: 2, border: 'subtle' }, [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Hello world' }],
        },
      ]),
    ]),
  ],
})
```

### `normalizeLayoutMarkdown(markdown)`

Parse and re-serialize markdown into the package's canonical form.

```ts
import { normalizeLayoutMarkdown } from '@indusy55/tiptap-extension-markdown-directive-layout'

const canonical = normalizeLayoutMarkdown('::::grid{cols=12 gap=0}\n:::cell{span=1}\nA\n:::\n::::')
```

### `remarkLayoutDirectives()`

Remark plugin that validates supported layout directives and attaches normalized metadata to `node.data.layoutDirective`.

```ts
import remarkDirective from 'remark-directive'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { remarkLayoutDirectives } from '@indusy55/tiptap-extension-markdown-directive-layout'

const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkLayoutDirectives)
  .use(remarkStringify)
```

### `createLayoutDirectiveNode(directive, attributes?, children?)`

Create a normalized mdast directive node in code.

```ts
import { createLayoutDirectiveNode } from '@indusy55/tiptap-extension-markdown-directive-layout'

const box = createLayoutDirectiveNode('box', { padding: 2, border: 'subtle' }, [
  {
    type: 'paragraph',
    children: [{ type: 'text', value: 'Summary' }],
  },
])
```

### Attribute Helpers

- `normalizeLayoutDirectiveAttributes(directive, rawAttributes)`
- `serializeDirectiveAttributes(directive, normalizedAttributes)`

These enforce the layout spec and omit defaults from canonical output.

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

## Canonical Rules

The package treats markdown as canonical, not character-preserving.

That means the output may:

- normalize quoting
- omit default attributes
- adjust fence length for nested directives
- trim trailing whitespace

It must not:

- lose layout structure
- change directive meaning
- silently accept invalid layout attributes

## Example App

The app in [`example/`](./example) is now the reference editor integration:

- visual editor: Milkdown
- source editor: Markdown I/O only
- preview: read-only Milkdown
- AST: latest valid markdown AST

This is intentional. The library owns layout markdown semantics; the example demonstrates one editor adapter built on top of it.

## Development

```bash
pnpm run typecheck
pnpm exec vitest run --pool=threads
cd example && pnpm exec tsc -b
```

## License

MIT
