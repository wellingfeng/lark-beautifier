---
name: quote-block
slot: emphasis
when: 有一句核心洞察、用户原话、警句、官方表述需要单独突出
---

# Component: quote-block

不是普通 `>` 引用 —— 是 callout + 引用语 + 出处的「拉式引言」。

## 标准版（technical-blue / warm-product）

```markdown
<callout emoji="💬" background-color="light-purple" border-color="purple">
> **「**传统流程下，动画师只能通过骨骼控制网格变形；而 DMC 允许在网格层面直接设置控制器，对面部细节、肌肉局部变形、布料褶皱等场景特别有用。**」**

—— Epic 官方文档，UE 5.8 Direct Mesh Controls 章节
</callout>
```

## 用户原话版（warm-product / vivid-marketing）

```markdown
<callout emoji="🗣️" background-color="light-orange" border-color="orange">
> **「**升级到 5.8 之后，我们 LOD 流式资产的烘焙时间砍掉一半，clean build 也快了 20%。**」**

—— 资深技术美术，某 AAA 工作室
</callout>
```

## 反模式

- 包装伪造的「用户原话」—— 必须真实存在
- 引用超过 3 句 —— 失去「金句」效果，应改为正文
- 同一节出现 ≥ 2 个 quote-block —— 让读者疲劳
