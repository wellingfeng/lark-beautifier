import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outDir = resolve("tmp/readme-demo");
const assetDir = resolve("doc/assets/readme");
await mkdir(outDir, { recursive: true });
await mkdir(assetDir, { recursive: true });

const articles = [
  {
    slug: "nanite",
    title: "UE5 Nanite 虚拟化几何技术拆解",
    imageTitle: "Nanite Virtualized Geometry",
    accent: "#2563eb",
    official: [
      "https://dev.epicgames.com/documentation/unreal-engine/nanite-virtualized-geometry-in-unreal-engine"
    ],
    summary:
      "Nanite 是 UE5 的虚拟化几何系统，官方定位是通过内部网格格式和渲染路径实现像素级细节与高对象数量。它把高精度网格离线拆分成 Cluster 层级，运行时只处理屏幕可见且需要的细节，并配合压缩格式、细粒度流送和自动 LOD 降低手工资产维护成本。",
    kpis: [
      ["核心单位", "Cluster / Cluster Group"],
      ["运行目标", "按像素级需求选择细节"],
      ["主要收益", "减少手工 LOD 与烘焙负担"],
      ["主要边界", "材质、变形与平台支持受限"]
    ],
    imageCaption:
      "示意图：Nanite 的数据路径不是传统 Static Mesh 直接提交三角形，而是先构建层级 Cluster，再由运行时选择可见 Cluster。",
    sections: [
      [
        "为什么 Nanite 改变资产管线",
        [
          "传统实时项目通常需要在 DCC、烘焙、LOD、碰撞和流送之间反复折中。Nanite 的目标不是让面数限制消失，而是把几何细节管理转移到引擎内部：美术可以更直接地导入扫描、雕刻或影视级高模，运行时系统再决定当前视角真正需要哪些细节。",
          "这不等于“无限多边形”。Nanite 仍然受材质复杂度、遮挡效率、实例数量、显存、平台 RHI 和渲染路径约束。正确理解它的关键，是把它看成一套虚拟几何数据库和可见性驱动的 rasterizer，而不是单纯的 LOD 开关。"
        ]
      ],
      [
        "离线构建：从 Triangle 到 Cluster DAG",
        [
          "导入阶段会把网格划分为很多小 Cluster，并把相邻 Cluster 组织成层级结构。每个层级携带边界、误差、材质分组和压缩后的几何数据。运行时不需要一次性加载整份高模，而是把可见 Cluster 对应的数据页流送到 GPU。",
          "Cluster 层级的价值在于“局部替换”：远处像素覆盖小的区域可以使用更粗的父级表示，近处再逐步展开子级。由于选择依据接近屏幕误差而不是固定距离，Nanite 在大尺度场景中能比传统 LOD 更稳定。"
        ]
      ],
      [
        "运行时流程图",
        [
          "下面的 Mermaid 流程图概括了 Nanite 在一帧中的高层路径。真实实现还包含软件/硬件光栅分支、HZB 遮挡、page residency 和 material resolve 等细节。"
        ],
        "```mermaid\nflowchart TD\n  A[Static Mesh Import] --> B[Build Nanite Cluster Hierarchy]\n  B --> C[Compressed Page Store]\n  C --> D[Runtime View + Instance Culling]\n  D --> E[HZB Occlusion]\n  D --> F[Screen Error Selection]\n  E --> G[Request Resident Pages]\n  F --> G\n  G --> H[Nanite Rasterization]\n  H --> I[Depth / Visibility Buffer]\n  I --> J[Material Resolve + GBuffer]\n```"
      ],
      [
        "关键数据结构与成本",
        [
          "Nanite 的成本通常不来自“原始三角形总数”本身，而来自屏幕上实际可见的微三角形、材质切换、实例数量、遮挡失败、page miss 以及非 Nanite 物体的混合渲染。",
          "Fallback Mesh 仍然重要。官方文档指出，不支持 Nanite 的渲染路径、碰撞、某些烘焙和射线追踪路径会依赖 fallback；Fallback Relative Error 太高会让这些路径失真，太低又会增加内存和构建成本。"
        ]
      ],
      [
        "配置与调试代码",
        [],
        "```ini\n; DefaultEngine.ini 示例：项目级 Nanite 相关设置通常与 RHI / Shader Model 一起检查\n[/Script/Engine.RendererSettings]\nr.Nanite.ProjectEnabled=True\nr.RayTracing=True\n\n; 常用运行时排查命令\nr.Nanite.Visualize 1\nr.Nanite.ShowStats 1\nr.Nanite.Streaming.StreamingPoolSize 512\n```"
      ],
      [
        "版本演进时间线",
        [
          "Nanite 从 UE5.0 开始承担虚拟几何核心角色，后续版本逐步扩展到更多材质和植被相关场景。实际项目应以目标 UE 版本的官方支持矩阵为准。"
        ],
        "- UE5.0：Nanite 成为 UE5 虚拟几何核心能力，主要面向静态高精度网格。\n- UE5.1：与 World Partition、HLOD、虚拟阴影贴图等大型场景路径进一步协同。\n- UE5.2-UE5.3：持续改善 foliage、masked material、instance 和调试工具体验。\n- UE5.4+：更多生产场景开始把 Nanite 作为默认高模资产入口，同时保留 fallback 与平台分级策略。"
      ],
      [
        "上线检查清单",
        [
          "- 检查目标平台是否支持 Nanite 所需的 RHI 与 Shader Model。\n- 检查 masked、two-sided、WPO 或透明材质是否落入官方支持边界。\n- 用 Nanite visualization 查看 cluster、overdraw、page miss 和 fallback。\n- 对重要资产保留合理 fallback mesh，避免碰撞、烘焙或 RT 路径失真。\n- 在真实关卡镜头中测量 GPU 时间，不只看资产面数。"
        ]
      ]
    ]
  },
  {
    slug: "vsm",
    title: "UE5 Virtual Shadow Maps 阴影系统拆解",
    imageTitle: "Virtual Shadow Maps",
    accent: "#7c3aed",
    official: [
      "https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine"
    ],
    summary:
      "Virtual Shadow Maps（VSM）是 UE5 面向 Nanite、Lumen 与 World Partition 场景的高分辨率阴影路径。官方文档把它描述为虚拟化的超高分辨率 shadow map：逻辑上可达到 16K x 16K，物理上以 128 x 128 page 为单位按需分配、缓存和失效。",
    kpis: [
      ["虚拟分辨率", "16K x 16K 级别"],
      ["Page 粒度", "128 x 128 texels"],
      ["核心策略", "按需分配 + 缓存"],
      ["主要风险", "动态失效与 page thrashing"]
    ],
    imageCaption:
      "示意图：VSM 把阴影贴图虚拟化为 page cache，摄像机和光源变化只更新需要的页面。",
    sections: [
      [
        "为什么传统 Shadow Map 不够用",
        [
          "UE5 的 Nanite 场景常包含海量几何细节。如果继续依赖低分辨率 cascaded shadow map，近景阴影会出现锯齿、游泳和接触阴影不足；如果简单提高整张 shadow map 分辨率，显存、带宽和渲染成本会迅速失控。",
          "VSM 的核心思路与虚拟纹理类似：逻辑上提供极高分辨率的阴影空间，物理上只为屏幕当前需要的区域分配 page。这样可以让近景接触阴影获得更多 texel，同时让远处或不可见区域不占用完整成本。"
        ]
      ],
      [
        "Page 缓存与失效机制",
        [
          "每个 VSM page 对应阴影空间中的一个固定区域。页面可以在多帧之间缓存；当光源、投影物、接收物或相关材质状态变化时，缓存会失效并重新渲染。静态场景收益很高，动态场景则可能因为大量 page invalidation 或 cache miss 产生尖峰。",
          "VSM 与 Nanite 的关系很紧密：Nanite 能高效提交可见几何，VSM 则在阴影 pass 中按需请求局部高分辨率。这也是 UE5 大场景中 Lumen、Nanite、VSM 经常一起讨论的原因。"
        ]
      ],
      [
        "运行时流程图",
        [
          "下面的流程图展示 VSM 一帧内从接收像素到 page 渲染的概念路径。实际系统会继续处理 directional light clipmap、局部光源 atlas、SMRT 软阴影和缓存失效细节。"
        ],
        "```mermaid\nflowchart TD\n  A[Camera View] --> B[Find Shadow Receivers]\n  B --> C[Project Receiver Pixels into Light Space]\n  C --> D[Mark Needed Virtual Pages]\n  D --> E{Page Cache Resident?}\n  E -- Yes --> F[Reuse Cached Shadow Page]\n  E -- No --> G[Render Missing Page from Light View]\n  G --> H[Update Physical Page Cache]\n  F --> I[Sample Virtual Shadow Map]\n  H --> I\n  I --> J[Shadowed Lighting Result]\n```"
      ],
      [
        "Directional Light、Local Light 与 Clipmap",
        [
          "Directional Light 通常使用 clipmap 思路覆盖从近景到远景的不同范围；局部光源则更像按光源组织的虚拟 shadow atlas。两者都使用按需 page，但失效模式不同：太阳方向变化会影响大范围页面，局部动态光源则更容易把成本集中在局部热点。",
          "VSM 的质量不是单个开关决定的。接触阴影锐度、软阴影半径、光源数量、动态物体比例、page cache 命中率共同决定最终 GPU 时间。"
        ]
      ],
      [
        "配置与排查代码",
        [],
        "```ini\n[/Script/Engine.RendererSettings]\nr.Shadow.Virtual.Enable=1\nr.Shadow.Virtual.SMRT.SamplesPerRayLocal=8\nr.Shadow.Virtual.SMRT.SamplesPerRayDirectional=8\n\n; 排查 page 分配、缓存和 clipmap\nr.Shadow.Virtual.ShowStats 1\nr.Shadow.Virtual.Visualize cache\nr.Shadow.Virtual.Cache 1\n```"
      ],
      [
        "版本演进时间线",
        [
          "VSM 在 UE5 中承担高质量动态阴影路径，随着 Nanite 与 Lumen 的生产使用逐步成熟。项目上线时应根据目标平台、帧预算和光源策略设定分级。"
        ],
        "- UE5.0：VSM 作为高质量阴影路径进入 UE5，与 Nanite 场景一起解决高密度几何阴影。\n- UE5.1：缓存、clipmap 与局部光源稳定性继续改善。\n- UE5.2-UE5.3：针对动态物体、植被、SMRT 软阴影和统计可视化持续优化。\n- UE5.4+：更多项目把 VSM 作为高端平台默认阴影方案，并为中低端平台保留传统 shadow map 分级。"
      ],
      [
        "上线检查清单",
        [
          "- 用真实关卡镜头查看 page cache 命中率和 invalidation 尖峰。\n- 控制可移动光源数量，避免多个大范围动态阴影叠加。\n- 检查 foliage、WPO、skeletal mesh 对缓存失效的影响。\n- 为低端平台准备阴影质量分级，不要假设 VSM 总是默认可承受。\n- 对电影级镜头和游戏镜头分别测量，二者 page 访问模式不同。"
        ]
      ]
    ]
  },
  {
    slug: "lumen",
    title: "UE5 Lumen 全局光照与反射技术拆解",
    imageTitle: "Lumen GI & Reflections",
    accent: "#0891b2",
    official: [
      "https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine",
      "https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine"
    ],
    summary:
      "Lumen 是 UE5 的动态全局光照与反射系统。它结合 Screen Traces、Surface Cache、软件/硬件 Ray Tracing 与 Final Gather，让场景在光源、材质和几何变化后获得可交互的间接光与反射响应，并用多级近似在实时预算内逼近离线光照效果。",
    kpis: [
      ["覆盖能力", "动态 GI + Reflections"],
      ["近场优先", "Screen Traces"],
      ["场景表示", "Surface Cache / Mesh Cards"],
      ["质量边界", "镜面、薄物体、小几何、平台预算"]
    ],
    imageCaption:
      "示意图：Lumen 会先使用屏幕空间信息，再回退到场景表示与 ray tracing 路径，最后合成间接光和反射。",
    sections: [
      [
        "Lumen 解决了什么问题",
        [
          "传统静态光照依赖 Lightmass 烘焙，质量高但迭代慢，并且难以处理时间变化、破坏、开关灯和动态时间段。Lumen 的目标是让大多数间接光和反射在运行时响应变化，使开放世界、室内外切换和程序化场景更容易维护。",
          "Lumen 不是离线路径追踪器。它为了实时性使用多层场景表示和近似：屏幕可见信息优先，屏幕外信息通过 Surface Cache、Mesh Distance Fields 或硬件 Ray Tracing 补足。理解这些回退路径，是调试漏光、黑斑、反射缺失和性能尖峰的基础。"
        ]
      ],
      [
        "Surface Cache 与 Mesh Cards",
        [
          "Lumen 会为场景表面建立可快速采样的表示。官方技术文档把 Surface Cache 描述为一种离线捕获附近材质属性的机制，运行时可以在光线命中时查表，而不必对完整材质进行昂贵求值；Card Placement 可用 `r.Lumen.Visualize.CardPlacement 1` 检查。",
          "Mesh Cards 数量和表面覆盖质量会影响 Lumen 对复杂网格的理解。过于细碎、薄片化或封闭复杂的几何可能造成 Surface Cache 覆盖不足，表现为间接光或反射不稳定。"
        ]
      ],
      [
        "运行时流程图",
        [
          "Lumen 会尽量复用屏幕空间信息；当命中离开屏幕或需要屏幕外场景时，再查询 Lumen Scene / Surface Cache 或硬件 RT。"
        ],
        "```mermaid\nflowchart TD\n  A[Shaded Pixel] --> B[Screen Traces]\n  B --> C{Hit Visible Scene?}\n  C -- Yes --> D[Use Screen Result]\n  C -- No --> E[Trace Lumen Scene]\n  E --> F{Hardware RT Enabled?}\n  F -- Yes --> G[Triangle Ray Tracing]\n  F -- No --> H[Software RT via Mesh Distance Fields]\n  G --> I[Surface Cache Lookup]\n  H --> I\n  D --> J[Final Gather / Reflection Composite]\n  I --> J\n  J --> K[Indirect Lighting + Reflections]\n```"
      ],
      [
        "软件 RT 与硬件 RT 的取舍",
        [
          "软件 Ray Tracing 主要依赖 Mesh Distance Fields，适合较宽泛的 GI 查询，但对薄物体、非均匀缩放、复杂小结构的表达有限。硬件 Ray Tracing 可以追踪三角形，反射质量和几何一致性更好，但需要更高端平台和更高 GPU 成本。",
          "项目不应该只用一个开关判断 Lumen 质量。室内、镜面、半粗糙材质、室外大世界和角色近景对 Lumen 的压力不同，需要分别做 profile。"
        ]
      ],
      [
        "配置与排查代码",
        [],
        "```ini\n[/Script/Engine.RendererSettings]\nr.DynamicGlobalIlluminationMethod=1 ; Lumen\nr.ReflectionMethod=1                 ; Lumen Reflections\nr.GenerateMeshDistanceFields=True\nr.Lumen.HardwareRayTracing=1\n\n; 常用排查命令\nr.Lumen.Visualize.CardPlacement 1\nr.Lumen.ScreenProbeGather.VisualizeTraces 1\nr.Lumen.Reflections.VisualizeTraces 1\n```"
      ],
      [
        "版本演进时间线",
        [
          "Lumen 从 UE5.0 开始替代大量实时 GI hack，后续版本持续提升高端平台质量和项目可控性。具体特性仍应以项目 UE 版本和平台支持为准。"
        ],
        "- UE5.0：Lumen 成为 UE5 默认动态 GI/反射方向，支撑更快的光照迭代。\n- UE5.1：硬件 Ray Tracing、反射和高端平台质量继续增强。\n- UE5.2-UE5.3：Surface Cache、Screen Probe Gather、性能可视化和场景覆盖持续改进。\n- UE5.4+：更多项目采用 Lumen 作为高端实时 GI 方案，同时为移动端、VR 或低端平台保留替代路径。"
      ],
      [
        "上线检查清单",
        [
          "- 打开 Lumen Scene、Surface Cache 和 Card Placement 可视化，检查覆盖是否完整。\n- 对镜面/半粗糙反射单独评估，必要时启用硬件 RT 或提高反射质量。\n- 检查小物体、薄墙、封闭复杂网格是否造成漏光或黑斑。\n- 分平台设置 GI 和 Reflection quality，不要把编辑器高端效果当作全平台默认。\n- 与 Nanite、VSM、TSR 一起 profile，因为它们共同决定 UE5 典型帧预算。"
        ]
      ]
    ]
  }
];

for (const article of articles) {
  await writeFile(resolve(assetDir, `ue5-${article.slug}-diagram.svg`), renderSvg(article), "utf8");
  await writeFile(resolve(outDir, `ue5-${article.slug}-raw.md`), renderRaw(article), "utf8");
}

console.log(JSON.stringify({
  outDir,
  assetDir,
  files: articles.map((article) => ({
    raw: `tmp/readme-demo/ue5-${article.slug}-raw.md`,
    image: `doc/assets/readme/ue5-${article.slug}-diagram.svg`
  }))
}, null, 2));

function renderRaw(article) {
  const kpi = article.kpis.map(([label, value]) => `**${label}**：${value}`).join("\n");
  const tableRows = article.kpis.map(([label, value]) => `| ${label} | ${value} |`).join("\n");
  const body = article.sections
    .map(([heading, paragraphs, extra]) => {
      return [`## ${heading}`, ...(paragraphs ?? []), extra].filter(Boolean).join("\n\n");
    })
    .join("\n\n");

  return `# ${article.title}

摘要：${article.summary}

${kpi}

![${article.imageTitle}](../../doc/assets/readme/ue5-${article.slug}-diagram.svg)

${article.imageCaption}

## 核心参数表

| 维度 | 说明 |
| --- | --- |
${tableRows}

${body}

## 官方参考

${article.official.map((url) => `- ${url}`).join("\n")}
`;
}

function renderSvg(article) {
  const nodes = article.slug === "nanite"
    ? ["Import", "Cluster Build", "Page Store", "Cull + Select", "Rasterize", "GBuffer"]
    : article.slug === "vsm"
      ? ["Receivers", "Virtual Pages", "Cache Check", "Render Missing", "Sample", "Lighting"]
      : ["Pixel", "Screen Trace", "Lumen Scene", "Surface Cache", "Final Gather", "GI + Reflections"];
  const nodeWidth = 150;
  const gap = 38;
  const startX = 58;
  const y = 230;
  const boxes = nodes.map((label, index) => {
    const x = startX + index * (nodeWidth + gap);
    const lines = [
      `<rect x="${x}" y="${y}" width="${nodeWidth}" height="78" rx="14" fill="#ffffff" stroke="${article.accent}" stroke-width="3"/>`,
      `<text x="${x + nodeWidth / 2}" y="${y + 46}" text-anchor="middle" font-size="20" font-weight="700" fill="#172033">${escapeXml(label)}</text>`
    ];
    if (index < nodes.length - 1) {
      lines.push(`<path d="M ${x + nodeWidth + 8} ${y + 39} L ${x + nodeWidth + gap - 10} ${y + 39}" stroke="${article.accent}" stroke-width="4" marker-end="url(#arrow)"/>`);
    }
    return lines.map((line) => `  ${line}`).join("\n");
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="520" viewBox="0 0 1180 520">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#f8fbff"/>
      <stop offset="100%" stop-color="#eef4ff"/>
    </linearGradient>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="${article.accent}"/>
    </marker>
  </defs>
  <rect width="1180" height="520" fill="url(#bg)"/>
  <rect x="34" y="34" width="1112" height="452" rx="28" fill="#ffffff" stroke="#d9e2ef" stroke-width="2"/>
  <text x="70" y="100" font-size="34" font-weight="800" fill="#172033">${escapeXml(article.imageTitle)}</text>
  <text x="70" y="140" font-size="18" fill="#657187">${escapeXml(article.summary.slice(0, 88))}...</text>
  ${boxes}
  <text x="70" y="410" font-size="18" fill="#657187">${escapeXml(article.imageCaption)}</text>
</svg>`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
