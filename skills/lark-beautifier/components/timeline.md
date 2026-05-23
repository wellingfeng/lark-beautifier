---
name: timeline
slot: roadmap / release-plan / milestones
when: 有 3+ 时间点排序的事件，且每点有简短说明
---

# Component: timeline

飞书原生不支持 timeline 组件，但可以用 **lark-table 三列布局** 模拟，效果直观。

## 标准版

```markdown
<lark-table column-widths="140,180,400" header-row="true">
<lark-tr>
<lark-td>

**阶段**

</lark-td>
<lark-td>

**时间**

</lark-td>
<lark-td>

**关键动作**

</lark-td>
</lark-tr>
<lark-tr>
<lark-td>

🔬 Preview

</lark-td>
<lark-td>

<text color="blue">**2026.05**</text>

</lark-td>
<lark-td>

Preview 通过 Launcher / GitHub 发布；建议复制工程测试

</lark-td>
</lark-tr>
<lark-tr>
<lark-td>

🚀 Stable

</lark-td>
<lark-td>

<text color="green">**2026.06**</text>

</lark-td>
<lark-td>

随 Unreal Fest Chicago 2026 同步推出

</lark-td>
</lark-tr>
<lark-tr>
<lark-td>

🛠️ Hotfix

</lark-td>
<lark-td>

<text color="purple">**2026.Q3**</text>

</lark-td>
<lark-td>

预计 5.8.1 / 5.8.2 修复 Preview 期间反馈的问题

</lark-td>
</lark-tr>
</lark-table>
```

## 反模式

- 阶段名超过 6 个字 —— 视觉上会和「时间」「动作」列冲突
- 时间格式不统一（YYYY-MM 和「明年 Q3」混用）
- 时间倒序 —— timeline 永远正序
