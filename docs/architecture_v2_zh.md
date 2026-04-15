# Layout Markdown 架构说明 v3

## 目标

这次重写后的目标很明确：

- Markdown 是唯一长期存储格式
- layout 语法基于 `remark-directive`
- 库层不再把 Tiptap 当成核心前提
- 可视化编辑器只是 Markdown 的一个运行时适配器

换句话说：

- 库的真值是 Markdown 语义
- 编辑器的真值是当前编辑器内部状态
- 二者通过 remark / mdast 边界对接

## 总体分层

项目分成三层：

1. `layout core`
2. `editor adapter`
3. `playground`

### 1. layout core

这是 npm 包真正要稳定的部分。

它负责：

- 定义 layout directive 名称和属性规则
- 基于 `remark-directive` 解析 Markdown
- 校验并规范化 directive attributes
- 产出 canonical Markdown
- 提供 editor 无关的 AST / helper

它不负责：

- 光标
- Enter 行为
- DOM 渲染
- React 组件

这层的关键词是：

- markdown-first
- editor-agnostic
- canonical

### 2. editor adapter

这一层负责把 layout core 接进某个具体编辑器。

当前选型：

- Visual 编辑器使用 Milkdown
- Milkdown 继续内部用 ProseMirror state
- Markdown 解析和序列化走 remark 管线

它负责：

- remark plugin 注入
- 自定义 container / leaf directive node
- 编辑器中的块级渲染
- source / visual 模式切换时的同步

它不负责：

- 改写 layout 语法规范
- 发明第二套 AST

### 3. playground

playground 只是演示和调试层。

它负责：

- 左侧编辑
- 右侧预览
- AST 抽屉
- source import / export

它不负责：

- 定义库的核心语义
- 修补库层遗漏的解析规则

## 这次为什么不再以 Tiptap 为核心

之前的主要问题不是“代码写得不够多”，而是边界不对：

- 库层直接绑死 Tiptap JSON
- 自定义 directive 逻辑和编辑行为逻辑混在一起
- example 为了同步 source / preview / visual，开始承担本该属于库层的语义

这会导致：

- 解析层和编辑层互相污染
- 替换编辑器成本极高
- 稳定性问题不好定位

重写后的判断标准是：

- 只要 Markdown 和 AST 规则稳定，编辑器可以换

## canonical Markdown 的定义

这里的 canonical 不是“保留用户原始每一个字符”，而是：

- 保留语义
- 统一等价写法
- 去掉默认属性
- 让同一份结构尽量输出成固定形式

比如：

- `gap=2` 和 `gap="2"` 可以统一成一种
- 默认值属性可以被省略
- fence 长度可以按嵌套自动扩展

可以接受的变化：

- 引号风格统一
- 默认属性被删除
- 尾部空白被裁掉

不能接受的变化：

- 结构丢失
- directive 类型变化
- 属性语义变化

## 新的稳定边界

这次重写后，优先保证稳定的是下面这些接口和规则：

- layout directive 名称集合
- attribute normalization / validation
- `remark-directive` 解析结果
- canonical Markdown 输出
- editor 适配器对这些规则的忠实映射

不再把下面这些当成库的核心契约：

- Tiptap extension 名称
- Tiptap JSON 结构
- `parseLayoutDocument()` 这类 Tiptap 专属 IO API

## source / visual 同步原则

新的同步原则很简单：

- Visual 模式下，以编辑器输出的 Markdown 为准
- Source 模式下，以 textarea 当前文本为准
- Preview 和 AST 永远显示“最近一次合法 Markdown”
- Source 输入非法时，保留错误，不污染 visual / preview

所以 source 模式本质上是：

- Markdown I/O
- import / export
- 调试入口

不是严格 WYSIWYG

## remark-directive 在这里的角色

`remark-directive` 是这次架构的中心，而不是补丁。

它负责把如下语法纳入统一 Markdown AST：

- `:::box`
- `::::grid`
- `::break`

layout core 在它之上只做两件事：

1. 识别哪些 directive 属于 layout
2. 校验并规范化这些 directive

这样可以保证：

- 库层和 Markdown 生态兼容
- Milkdown 只是消费同一套 mdast 规则
- 以后如果要接别的 renderer，也不用重写语法层

## 本次重写的结论

这次之后的推荐心智模型是：

- layout core = `remark-directive` 语义层
- Milkdown = 一个官方友好的可视化编辑适配器
- source 面板 = Markdown I/O，不抢运行时真值
- preview = 对最近合法 Markdown 的只读呈现
