import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outDir = resolve("tmp/readme-demo");
await mkdir(outDir, { recursive: true });

const articles = [
  {
    slug: "ue5-world-partition",
    title: "UE5 World Partition 技术细节",
    summary:
      "World Partition 是 UE5 面向大世界的关卡管理与流送体系。它把持久化关卡自动拆分为网格单元，通过 Streaming Source、Runtime Grid、Data Layer、HLOD 和 One File Per Actor 协同，让编辑器协作、运行时加载和开放世界构建进入同一套数据路径。",
    kpis: [
      ["核心粒度", "Actor / Cell / Runtime Grid"],
      ["流送驱动", "Streaming Source + 距离阈值"],
      ["协作方式", "One File Per Actor"],
      ["关键配套", "Data Layer + HLOD"]
    ],
    imageCaption:
      "示意图：World Partition 把世界划分为运行时网格，Streaming Source 决定加载哪些 cell，HLOD 为远景提供聚合代理。",
    sections: [
      [
        "系统定位：从手工子关卡到自动分区",
        [
          "传统开放世界通常依赖人工维护多个 streaming level：关卡设计、美术、任务脚本和运行时加载策略耦合在一起，团队越大越容易出现文件冲突、加载边界不一致和远景代理维护成本。",
          "World Partition 的关键变化是把世界拆分规则放进引擎数据模型。编辑器里仍然面对一个持久化世界，但保存时 actor 可以分散到独立文件；运行时系统再根据网格、距离和数据层状态决定哪些 cell 进入内存。"
        ]
      ],
      [
        "运行时网格与 Cell",
        [
          "Runtime Grid 定义世界如何被切成 cell。较粗的网格适合低频大对象或远景结构，较细的网格适合需要精确流送的 gameplay 区域。一个项目可以配置多个 runtime grid，但网格越多，调试和 HLOD 生成成本也会增加。",
          "Cell 的加载不是简单的二维格子开关。引擎会结合 Streaming Source 的位置、半径、优先级、目标状态和 Data Layer 状态计算加载集合。玩家 Pawn、摄像机、传送目标、过场镜头或自定义组件都可以成为流送源。"
        ]
      ],
      [
        "一帧中的流送决策",
        [
          "下面的流程图概括 World Partition 在运行时从流送源到可见世界的核心路径。真实项目还会叠加异步 IO、对象初始化、蓝图 BeginPlay、导航和物理状态切换。"
        ],
        "```mermaid\nflowchart TD\n  A[Streaming Source Update] --> B[Runtime Grid Query]\n  B --> C[Select Candidate Cells]\n  C --> D{Data Layer Active?}\n  D -- Yes --> E[Request Cell Load]\n  D -- No --> F[Keep Cell Unloaded]\n  E --> G[Async Package Load]\n  G --> H[Actor Registration]\n  H --> I[Visibility and Gameplay Ready]\n  C --> J[HLOD Range Check]\n  J --> K[Use HLOD Proxy for Far Cells]\n```"
      ],
      [
        "Data Layer：同一空间的多套状态",
        [
          "Data Layer 让同一个空间位置可以拥有不同逻辑状态，例如昼夜版本、任务阶段、破坏前后、地下/地上切换或编辑器组织分组。运行时 Data Layer 切换会影响 cell 的加载集合，因此它既是内容组织工具，也是 gameplay 状态的一部分。",
          "风险在于把 Data Layer 当作万能开关。若频繁切换大范围 Data Layer，可能触发大量 actor 加载、初始化和 GC；若把 gameplay 依赖拆得过细，又会让 QA 难以覆盖状态组合。"
        ]
      ],
      [
        "HLOD 与远景成本",
        [
          "HLOD 用代理网格或聚合表示替代远处未加载的细节 cell。它不是单纯的美术优化，而是 World Partition 让开放世界保持远景连续性的必要配套：近景加载真实 actor，远景加载 HLOD proxy。",
          "HLOD 构建质量会直接影响穿帮：代理几何过粗会导致远处轮廓跳变，材质烘焙不一致会暴露切换，Cell 边界设计不合理会让 HLOD cluster 出现不自然分块。"
        ]
      ],
      [
        "配置与排查代码",
        [],
        "```ini\n[/Script/Engine.WorldPartitionRuntimeSpatialHash]\nCellSize=12800\nLoadingRange=76800\n\n; 常见排查命令，具体可用项以目标 UE 版本为准\nwp.Runtime.ToggleDrawRuntimeHash2D\nwp.Runtime.ToggleDrawRuntimeHash3D\nwp.Runtime.DumpState\n```"
      ],
      [
        "上线检查清单",
        [
          "- 明确每个 Runtime Grid 的 CellSize、LoadingRange 和内容类型，不让所有 actor 都落入默认网格。",
          "- 用真实移动速度、传送、载具和过场镜头测试 Streaming Source，观察加载尖峰和可见性空洞。",
          "- 把 Data Layer 状态组合列入 QA 矩阵，特别是任务阶段和破坏状态。",
          "- 为远景核心地标单独检查 HLOD 代理、材质一致性和切换距离。",
          "- 保持 One File Per Actor 工作流，减少多人编辑同一大关卡文件的冲突。"
        ]
      ]
    ],
    references: [
      "https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition-in-unreal-engine",
      "https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition---hierarchical-level-of-detail-in-unreal-engine",
      "https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition---data-layers-in-unreal-engine"
    ]
  },
  {
    slug: "mobile-render-pipeline",
    title: "移动端渲染的管线优化",
    summary:
      "移动端渲染优化不是把 PC 渲染管线简单降档，而是在 CPU 提交、GPU tile memory、带宽、功耗、热限制和帧节奏之间重新分配预算。真正稳定的管线需要把场景组织、pass 合并、资源格式、帧 pacing 和 profiling 放进同一个闭环。",
    kpis: [
      ["首要瓶颈", "带宽 / Overdraw / Thermal"],
      ["CPU 侧重点", "提交批次与线程同步"],
      ["GPU 侧重点", "Tile 内完成与少写回"],
      ["验证方式", "真机 profile + 长时运行"]
    ],
    imageCaption:
      "示意图：移动端渲染优化需要同时控制 CPU 提交、GPU pass 组织、内存带宽和最终呈现节奏。",
    sections: [
      [
        "移动 GPU 的预算模型",
        [
          "多数移动 GPU 采用 tile-based rendering 思路：屏幕被切成小 tile，片元在片上内存里完成尽可能多的计算，最后再写回系统内存。只要中间 pass 频繁 store/load、过度使用全屏后处理或多次采样大纹理，带宽和功耗就会比 ALU 更早成为瓶颈。",
          "优化目标因此不是单纯减少 draw call 或降低三角形数，而是让每一帧少搬数据、少重复 shading、少触发同步等待，并让设备在 5 到 20 分钟真实运行后仍能维持目标帧率。"
        ]
      ],
      [
        "CPU 提交：减少驱动和同步成本",
        [
          "CPU 端常见问题是 draw call 过多、材质状态切换频繁、资源更新跨线程同步，以及每帧创建/销毁 GPU 对象。移动端 CPU 核心的持续频率受功耗限制明显，短时间不掉帧不代表长时间稳定。",
          "有效策略包括：静态合批或实例化、材质变体收敛、渲染对象排序、缓存 pipeline/state、使用 ring buffer 管理动态 uniform，以及把可预计算的裁剪、LOD 和可见性结果提前到工作线程。"
        ]
      ],
      [
        "GPU Pass：把数据留在 tile 内",
        [
          "移动端最怕把中间结果反复写回系统内存。GBuffer 过宽、多个全屏 pass、未压缩 HDR buffer、深度纹理频繁采样，都会放大带宽压力。Forward+、clustered lighting 或经过压缩的 deferred 方案，需要根据目标设备实际测量。",
          "对于 post-processing，优先合并 pass、降低中间 buffer 分辨率、避免不必要的 MSAA resolve，并明确哪些 attachment 可以 discard。UI、透明物和粒子要控制 overdraw，因为它们经常绕过早期深度收益。"
        ]
      ],
      [
        "管线优化闭环",
        [
          "下面的流程图强调“测量 -> 定位 -> 修改 -> 长测”的闭环。移动端优化如果只看编辑器或单次 benchmark，很容易漏掉热降频、后台干扰和机型差异。"
        ],
        "```mermaid\nflowchart TD\n  A[Target Device Matrix] --> B[Frame Time Capture]\n  B --> C{CPU Bound or GPU Bound?}\n  C -- CPU --> D[Batching / State Cache / Threading]\n  C -- GPU --> E[Pass Merge / Bandwidth / Overdraw]\n  D --> F[Build on Real Device]\n  E --> F\n  F --> G[Long Run Thermal Test]\n  G --> H{Stable Frame Pacing?}\n  H -- No --> B\n  H -- Yes --> I[Lock Quality Tier]\n```"
      ],
      [
        "资源格式与内存",
        [
          "纹理格式通常比美术分辨率更容易被忽视。ASTC/ETC2 等压缩格式可以显著降低带宽和包体，但法线、HDR、UI 和字体需要分开评估质量。大纹理 atlas 能减少绑定切换，但过大也会降低缓存命中并增加上传成本。",
          "几何资源同样需要移动端口径：压缩顶点属性、避免不必要的 tangent/UV、控制 skinning bone 数量、为远景准备 LOD 或 impostor。资源优化必须和实际 shader 读取路径一起看，否则只是把瓶颈从显存挪到 ALU。"
        ]
      ],
      [
        "配置与排查代码",
        [],
        "```text\nFrame budget example for 60 FPS:\nCPU game + render submit  <= 6 ms\nGPU opaque + lighting     <= 6 ms\nPost + UI + present       <= 3 ms\nThermal / OS headroom     >= 1.6 ms\n\nChecklist:\n- Capture GPU counters on target devices\n- Sort transparent objects after opaque depth\n- Merge full-screen passes when inputs match\n- Avoid per-frame allocation of GPU resources\n```"
      ],
      [
        "上线检查清单",
        [
          "- 按高中低三档设备建立 profile 矩阵，不用单一旗舰机代表全部移动端。",
          "- 同时记录 CPU frame time、GPU frame time、present interval、温度和频率。",
          "- 对 overdraw、带宽、shader ALU、纹理采样和 render pass store/load 分别定位。",
          "- 为画质档位保留可解释的开关：分辨率、阴影、后处理、反射、粒子和 UI 特效。",
          "- 做 20 分钟以上长测，确认热稳定后的帧 pacing，而不是只看冷启动前两分钟。"
        ]
      ]
    ],
    references: [
      "https://developer.android.com/games/optimize",
      "https://developer.android.com/games/sdk/frame-pacing",
      "https://developer.android.com/agi",
      "https://developer.arm.com/documentation/101897/latest"
    ]
  },
  {
    slug: "mobile-vulkan",
    title: "移动端 Vulkan 渲染",
    summary:
      "Vulkan 在移动端的价值是把驱动隐式工作显式化：应用自己管理 swapchain、command buffer、同步、descriptor、pipeline 和资源生命周期。它能降低 CPU 提交开销并提升多线程构建能力，但也会把同步错误、内存布局和设备差异暴露给引擎。",
    kpis: [
      ["核心收益", "低驱动开销 + 显式控制"],
      ["关键对象", "Swapchain / Command Buffer / Pipeline"],
      ["主要风险", "同步、生命周期、设备差异"],
      ["调试工具", "Validation + AGI + RenderDoc"]
    ],
    imageCaption:
      "示意图：移动端 Vulkan 渲染从 swapchain 获取图像，录制 command buffer，提交队列并通过同步对象控制呈现。",
    sections: [
      [
        "为什么移动端需要 Vulkan",
        [
          "OpenGL ES 让驱动承担大量隐式状态管理，使用简单但 CPU 开销和跨设备行为更难预测。Vulkan 把 pipeline、descriptor、render pass、barrier 和队列提交显式交给应用，适合需要稳定帧时间和多线程提交的中大型移动游戏。",
          "代价是复杂度上升。应用必须处理 swapchain 重建、图像布局转换、同步对象复用、内存分配策略、pipeline cache 和设备 feature probing。没有 validation、捕获工具和工程规范，Vulkan 项目很容易把偶发花屏变成长期问题。"
        ]
      ],
      [
        "Swapchain 与帧节奏",
        [
          "移动端 swapchain 配置要同时考虑延迟、吞吐和系统合成器。图像数量太少容易让 CPU/GPU 互相等待，太多又会增加输入延迟。Android 上还需要关注 surface 旋转、窗口尺寸变化、后台/前台切换和帧 pacing。",
          "Frame pacing 库或平台节奏 API 的意义，是把游戏模拟、GPU submit 和 display present 对齐到稳定节拍。Vulkan 只提供显式提交能力，最终体验仍取决于是否避免长短帧交替。"
        ]
      ],
      [
        "Command Buffer 与多线程录制",
        [
          "Vulkan 的优势之一是 command buffer 可以在多个线程构建。常见做法是按 pass、可见性批次或场景区域生成 secondary command buffer，再由主线程组合提交。这样可以减少 render thread 峰值，但要求资源生命周期和 descriptor 更新足够稳定。",
          "不要每帧重建所有对象。Pipeline、descriptor set layout、sampler、render pass 兼容信息和 pipeline cache 应该长期复用；每帧变化的数据放入 ring buffer 或动态 offset，避免 CPU 等待 GPU 读完上一帧资源。"
        ]
      ],
      [
        "一帧 Vulkan 渲染路径",
        [
          "下面的流程图展示移动端 Vulkan 一帧的基本路径。实际引擎会增加异步纹理上传、pipeline cache warming、GPU timestamp、debug markers 和设备丢失恢复。"
        ],
        "```mermaid\nflowchart TD\n  A[Acquire Swapchain Image] --> B[Wait Fence for Frame Slot]\n  B --> C[Update Ring Buffers]\n  C --> D[Record Command Buffers]\n  D --> E[Pipeline Barriers / Layout Transitions]\n  E --> F[Queue Submit]\n  F --> G[GPU Executes Render Passes]\n  G --> H[Signal Semaphore]\n  H --> I[Present]\n  I --> J{Swapchain Out of Date?}\n  J -- Yes --> K[Recreate Swapchain]\n  J -- No --> A\n```"
      ],
      [
        "Render Pass、Subpass 与 Tile Memory",
        [
          "在 tile-based GPU 上，render pass 组织会显著影响带宽。把能在同一 tile 内完成的深度、颜色和 lighting 工作放进兼容的 render pass/subpass，可以减少中间 attachment 写回。相反，把每个效果拆成独立 pass 并频繁采样前一 pass 结果，会把 tile 优势抵消掉。",
          "Attachment load/store op、transient attachment、MSAA resolve 和 layout transition 都需要明确写出意图。能 discard 的内容不要 store，能 transient 的 attachment 不要当长期纹理使用。"
        ]
      ],
      [
        "同步与内存管理",
        [
          "Vulkan 同步错误在移动端很常见：fence 复用过早、semaphore 链接错误、barrier stage mask 过宽或过窄、descriptor 指向已释放资源，都会产生偶现问题。同步策略应该围绕 frame-in-flight、队列所有权和资源生命周期建立统一约定。",
          "内存分配方面，不建议为小 buffer/image 直接频繁调用底层分配。项目通常需要 sub-allocation、资源池、staging upload 队列和延迟销毁队列，保证 GPU 不再使用后再释放真实资源。"
        ]
      ],
      [
        "配置与排查代码",
        [],
        "```cpp\n// Per-frame high-level Vulkan loop\nvkAcquireNextImageKHR(device, swapchain, timeout, imageAvailable, VK_NULL_HANDLE, &imageIndex);\nvkWaitForFences(device, 1, &frameFence, VK_TRUE, UINT64_MAX);\nvkResetFences(device, 1, &frameFence);\nrecordCommandBuffer(cmd[frameIndex], imageIndex);\nsubmitInfo.waitSemaphoreCount = 1;\nsubmitInfo.pWaitSemaphores = &imageAvailable;\nsubmitInfo.signalSemaphoreCount = 1;\nsubmitInfo.pSignalSemaphores = &renderFinished;\nvkQueueSubmit(graphicsQueue, 1, &submitInfo, frameFence);\nvkQueuePresentKHR(presentQueue, &presentInfo);\n```"
      ],
      [
        "上线检查清单",
        [
          "- 默认开启 validation layer 的开发构建，并把同步 validation 作为 CI 或夜间测试的一部分。",
          "- 对每个 GPU family 建立 feature/extension allowlist，不假设所有设备支持同一格式、采样数或 present mode。",
          "- 使用 AGI、RenderDoc 或厂商工具检查 render pass、barrier、overdraw、带宽和 GPU timestamp。",
          "- 缓存 pipeline 并预热关键 PSO，避免首战或切场景时 shader/pipeline 编译尖峰。",
          "- 明确 swapchain 重建、后台恢复、设备丢失和窗口旋转路径，避免只覆盖理想启动流程。"
        ]
      ]
    ],
    references: [
      "https://developer.android.com/games/develop/vulkan/overview",
      "https://developer.android.com/games/sdk/frame-pacing",
      "https://docs.vulkan.org/guide/latest/",
      "https://developer.arm.com/documentation/101897/latest"
    ]
  }
];

for (const article of articles) {
  await writeFile(resolve(outDir, `${article.slug}-raw.md`), renderRaw(article), "utf8");
}

console.log(JSON.stringify({
  outDir,
  files: articles.map((article) => `tmp/readme-demo/${article.slug}-raw.md`)
}, null, 2));

function renderRaw(article) {
  const kpiLines = article.kpis.map(([label, value]) => `**${label}**：${value}`).join("\n");
  const tableRows = article.kpis.map(([label, value]) => `| ${label} | ${value} |`).join("\n");
  const body = article.sections
    .map(([heading, paragraphs, extra]) => {
      return [`## ${heading}`, ...(paragraphs ?? []), extra].filter(Boolean).join("\n\n");
    })
    .join("\n\n");

  return `# ${article.title}

摘要：${article.summary}

${kpiLines}

${article.imageCaption}

## 核心参数表

| 维度 | 说明 |
| --- | --- |
${tableRows}

${body}

## 官方参考

${article.references.map((url) => `- ${url}`).join("\n")}
`;
}
