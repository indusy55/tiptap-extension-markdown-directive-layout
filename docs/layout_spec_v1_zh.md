# 布局语法规范 v1.1（最终中文完整版）

---

# 🧠 1. 系统概述

这是一个用于：

* 简历编辑器
* 文档编辑器
* PDF 输出系统

的结构化布局语法。

---

## 核心原则

* 布局语法 = 结构（不包含 UI 行为）
* 布局 / 内容 / 流控制分离
* AST 承载真实数据（ID 在 AST 内，不暴露）
* 树结构模型

---

# 🧱 2. Directive 规范

---

## 🟢 2.1 stack（垂直布局）

```md
::stack{gap=2}
```

### 作用

垂直文档流容器（默认布局）

### Attributes

|属性|类型|取值|默认|说明|
|-|-|-|-|-|
|gap|number|>=0|0|子元素间距|

---

## 🟢 2.2 grid（二维布局）

```md
::grid{cols=12 gap=2}
```

### Attributes

|属性|类型|取值|默认|说明|
|-|-|-|-|-|
|cols|number|1-24|12|列数|
|gap|number|>=0|0|间距|

---

## 🟢 2.3 cell（网格单元）

```md
::cell{span=6}
```

### Attributes

|属性|类型|取值|默认|说明|
|-|-|-|-|-|
|span|number|1-24|1|占用列数|

---

## 🔵 2.4 box（内容容器）

```md
::box{padding=2 border="subtle" radius=2 bg="muted" shadow="sm" overflow="clip"}
```

### Attributes

|属性|类型|取值|默认|说明|
|-|-|-|-|-|
|padding|number|>=0|0|内边距|
|margin|number|>=0|0|外边距|
|border|enum|none/subtle/strong|none|边框|
|radius|number|>=0|0|圆角|
|bg|token|theme|none|背景|
|shadow|enum|none/sm/md/lg|none|阴影|
|overflow|enum|clip/visible|clip|溢出控制|

---

## 🔴 2.5 break（允许断开 flow）

```md
::break
```

---

## 🟡 2.6 avoid（尽量不要断开）

```md
::avoid
```

---

## 🟣 2.7 group（结构分组）

```md
::group
```

### 作用

* 编辑器选区
* AST 结构组织
* 折叠 / 复制
* 逻辑分组

---

# 🧱 3. 分层模型

Layout 层：

* stack / grid / cell

内容层：

* box

流控制：

* break / avoid

结构层：

* group

---

# 🧠 4. ID 系统（隐藏）

* 存在于 AST
* 用于编辑器（选区 / 拖拽 / diff）
* 不暴露在源码语法里

---

# 🎨 5. Theme（独立）

```yaml
theme:
  spacing: 4px
  radius: 2px
  colors:
    primary: "#4f46e5"
    muted: "#f3f4f6"
  shadow:
    sm: "0 1px 2px rgba(0,0,0,0.1)"
```

---

# 🧾 6. 完整示例（中文简历）

```md
::stack{gap=3}

::box{padding=3 bg="muted" radius=2}

# 张三

📧 zhangsan@email.com
📍 新加坡

::

::group

::box{padding=2}

## 技能

JavaScript · TypeScript · Vue · Node.js

::

::group

::box{padding=2}

## 工作经历

### 前端工程师 - XXX 公司

2022 - 2025

* 负责前端架构设计
* 性能优化 40%
* 构建内部布局编辑器

::

::avoid

::box{padding=2}

### 实习工程师 - YYY 公司

* 组件库开发
* WYSIWYG 编辑器协作

::

::break

::box{padding=2}

## 项目经验

* 布局排版引擎
* PDF 渲染系统
* 编辑器 AST 架构

::
```
