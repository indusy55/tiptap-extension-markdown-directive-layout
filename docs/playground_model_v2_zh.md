# Playground 状态模型 v3

## 目的

新的 playground 只证明一件事：

- 同一份 Markdown，能同时驱动 visual editor、preview 和 AST

所以它不再围绕 “Tiptap JSON 是不是唯一真值” 来设计，而是围绕：

- 最近一次合法 Markdown

## 核心状态

playground 只保留这几类核心状态：

- `editorMode`
- `sourceMarkdown`
- `committedMarkdown`
- `documentAst`
- `parseError`

其中：

- `sourceMarkdown` 是 textarea 当前文本
- `committedMarkdown` 是最近一次校验通过的 Markdown
- `documentAst` 是 `committedMarkdown` 对应的 AST

## Visual 模式

Visual 模式下：

- Milkdown 内部状态负责交互
- 通过 listener 拿到最新 Markdown
- 这份 Markdown 经过 layout core 校验后，写回 `committedMarkdown`
- `sourceMarkdown` 也同步显示这份最新合法 Markdown

这里最重要的规则是：

- 不在每次键入时用 source textarea 反向覆盖编辑器

## Source 模式

Source 模式下：

- textarea 的 `sourceMarkdown` 是当前输入真值
- 每次输入都尝试走 layout core parse
- parse 成功则更新 `committedMarkdown` 和 `documentAst`
- parse 失败则只更新 `parseError`

所以 source 模式允许出现：

- 用户当前文本非法
- 右侧 preview 仍然停留在上一份合法内容

这是故意的，不是 bug。

## Preview

Preview 只消费 `committedMarkdown`。

这意味着：

- preview 不展示非法 source 草稿
- preview 始终展示最近一次合法结构
- visual 和 preview 使用同一套语法语义

## AST

AST 抽屉也只展示 `committedMarkdown` 对应的 AST。

如果当前 source 非法：

- AST 面板显示错误
- 不会伪造半合法结构

## 模式切换

### Visual -> Source

- 直接显示最新 `committedMarkdown`

### Source -> Visual

- 只有 `parseError` 为空时才允许切回 visual
- 切回时把 `committedMarkdown` 重新灌入 Milkdown

这个过程允许编辑器把 Markdown 做一次自身的 canonical 输出。

## 这份模型故意不保证的东西

下面这些不是 playground 的目标：

- Source 文本细节和 visual DOM 逐字符一致
- Source 模式输入时也保持 WYSIWYG 光标体验
- 非法 Markdown 也强行同步到 preview

新的约束是：

- 语义一致优先于文本细节一致
- 最近合法状态优先于半同步假象
