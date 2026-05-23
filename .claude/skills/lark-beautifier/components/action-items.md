---
name: action-items
slot: bottom
when: 文档结尾要求读者执行动作时（升级、检查、报名、审阅）
---

# Component: action-items

替代普通 todo 清单的「行动卡片」。每个 action 一个 callout，含 emoji + 时间 + 责任暗示。

## 标准版（technical-blue）

```markdown
### 升级前检查清单

<grid cols="2">
<column>

<callout emoji="🔍" background-color="light-blue" border-color="blue">
**评估关键特性影响**

- Mesh Terrain、MegaLights 对现有项目的影响
- 建议时间：升级前 1-2 周
</callout>

</column>
<column>

<callout emoji="🛠️" background-color="light-green" border-color="green">
**准备 C++ toolchain**

- 升级到 MSVC 17.11+
- 启用 `bUseIncrementalLinking = true`
</callout>

</column>
</grid>

<grid cols="2">
<column>

<callout emoji="🔌" background-color="light-orange" border-color="orange">
**插件兼容性测试**

- 重点关注：MetaHuman、Niagara 自定义模块
- 建议时间：副本工程验证
</callout>

</column>
<column>

<callout emoji="🧪" background-color="light-purple" border-color="purple">
**关键场景回归**

- 在副本工程跑过 P0/P1 场景
- 确认无回归后再迁移主线
</callout>

</column>
</grid>
```

## 极简版（clean-minimal / safe 模式）

```markdown
### 行动清单

- [ ] 评估关键特性对现有项目的影响
- [ ] 准备 toolchain（MSVC 17.11+）
- [ ] 验证插件兼容性
- [ ] 在副本工程回归 P0/P1 场景
```

## 反模式

- 卡片超过 4 个 —— 拆成两组，否则视觉上压垮章末
- 每张卡片正文 > 4 行 —— 失去「行动指令」的紧凑感
- 没有负责人/时间暗示就堆 8 条 —— 没有 owner 的 action 等于没有 action
