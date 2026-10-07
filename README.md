# Kimi K3 模型结构分析 PPT 工程

基于 Kimi K3 技术报告与 vllm / vllm-ascend 代码仓制作的技术报告演示文稿。
主交付物为 PPTD 工程：`kimi_k3_arch_analysis/kimi_k3_arch_analysis.pptd`（6 页，逐页批注制推进）。

## 在新机器上准备环境

1. 安装 Kimi Work。
2. 克隆本仓库：
   ```bash
   git clone https://github.com/YzTongNiar/KimiK3_Report.git
   ```
3. 放回技术报告 PDF。`Kimi-K3` 在仓库中只是子仓库引用，克隆后是空目录，
   需手动把报告放到 `Kimi-K3/k3_tech_report.pdf`（改路径则需同步改脚本引用）。
4. 如需 vllm / vllm-ascend 代码素材，自行克隆到仓库根目录
   （两个目录已在 `.gitignore` 中，不会进版本库）。
5. 字体要求：图中中文用 **SimHei（黑体）**、西文用 **Times New Roman**。
   Windows 自带；macOS 缺这两个字体，matplotlib 会回退导致图风格走样，
   需安装字体或修改 `figstyle.py` 顶部的 `SER` / `HEI` 配置。
6. 绘图依赖 Python + matplotlib（Kimi Work 内置 Python 即可）。

## 目录结构

```
├── README.md
├── figstyle.py                    # 绘图公共模块：调色板 + 图元助手函数（报告 Figure 2 风格）
├── draw_kda_arch.py               # 第 1 页（KDA）双联模块图
├── draw_5pages.py                 # 第 2–6 页模块图（page2~page6 各一个函数）
├── k3_fig2_*.png / k3_pages_*.txt # 报告 PDF 的 300dpi 渲染件与文本提取（绘图参考素材）
├── Kimi-K3/                       # 技术报告子仓库引用（克隆后为空，需手动放 PDF）
├── vllm/, vllm-ascend/            # 代码仓素材（已 gitignore，不入库）
└── kimi_k3_arch_analysis/
    ├── kimi_k3_arch_analysis.pptd # 主 PPTD 文件（Kimi Work 中打开它）
    ├── pages/                     # 每页一个 .page（PPTD DSL，文本可直接 diff/merge）
    ├── media/                     # 6 张模块图 PNG（3498×1800，由脚本生成）
    └── shots/                     # kimi-slides screenshot 渲染校验截图
```

## 编辑工作流

**改图（推荐做法）**：不要手改 PNG，改绘图脚本后重新生成——

```bash
python draw_kda_arch.py     # 重新生成 media/kda_arch.png（第 1 页）
python draw_5pages.py       # 重新生成第 2–6 页共 5 张图
```

脚本输出到 `kimi_k3_arch_analysis/media/`，页面通过相对路径引用同名文件，
重新生成后页面自动生效，**无需改 .page**。

绘图约定（逐页批注中确立，新图必须遵守）：

- 不用斜线，一律折线（先垂直后水平）；所有框必须连线，不允许孤立框；
- 框内必须有文字标注；⊗ 等符号对齐所属模块中心；输出箭头延伸到虚线框边缘；
- 红虚线框（MAROON `#814B50`）= K3 相对前作的改动标记；配色与图元一律用 `figstyle.py`。

**改页面**：直接编辑 `kimi_k3_arch_analysis/pages/*.page`（PPTD DSL）。
版式骨架（已定稿，勿动）：红色 21 号黑体标题；红底白字「分析结论」竖标签 + 灰底结论区；
左图右表（参数表 [488,240,436,196]，表注最多 2 行否则溢出）；底部「开发需求与趋势思考」四条子弹。

**校验与渲染**：

```bash
kimi-slides check kimi_k3_arch_analysis
kimi-slides screenshot kimi_k3_arch_analysis -o kimi_k3_arch_analysis/shots
```

（mstmc.ttf 字体警告无害。）

**导出**：`Kimi K3 模型结构分析 (N).pptx` 为历史导出版本，仅留档；
导出动作由 Kimi Work 界面完成。

## 协作节奏

- 每台机器：改完 → `git add -A && git commit` → `git push`；开工前先 `git pull`。
- `.pptd` / `.page` 均为文本，diff 与合并友好；避免两台机器同时改同一页。
- Kimi Work 中打开 `kimi_k3_arch_analysis.pptd` 即可继续预览、批注、导出。

## 页面清单与关键事实

| 页 | 文件 | 主题 |
|---|---|---|
| 1 | pages/1_kda.page | Kimi Delta Attention（KDA） |
| 2 | pages/2_gated_mla.page | Gated MLA |
| 3 | pages/3_kernel_flashkda.page | 高性能 kernel：FlashKDA |
| 4 | pages/4_kernel_kda_decode.page | 高性能 kernel：KDA decode |
| 5 | pages/5_kernel_attnres.page | 高性能 kernel：Attention 残差融合 |
| 6 | pages/6_kernel_latentmoe.page | 高性能 kernel：LatentMoE |

报告关键参数（页内均标注来源）：93 层 = 69 KDA + 24 MLA；d = 7168；H = 96；
ℓ = 3584；he = 3072；E = 896；k = 16；C = 64；gmin = −5。
dk / dv 报告未给出，一律写「以 checkpoint config 为准」。
