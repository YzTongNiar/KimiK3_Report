# Kimi K3 模型结构分析 PPT 工程

基于 Kimi K3 技术报告与 vllm / vllm-ascend 代码仓制作的技术报告演示文稿（5 页，逐页批注制推进）。
主交付物：`kimi_k3_arch_analysis/kimi_k3_arch_analysis.pptx`（含 speaker notes，图例为可编辑原生形状）。

## 在新机器上准备环境

1. 安装 Kimi Work。
2. 克隆本仓库：
   ```bash
   git clone https://github.com/YzTongNiar/KimiK3_Report.git
   ```
3. 放回技术报告 PDF：`Kimi-K3` 在仓库中只是子仓库引用，克隆后为空目录，
   手动把报告放到 `Kimi-K3/k3_tech_report.pdf`。
4. 如需 vllm / vllm-ascend 代码素材，自行克隆到仓库根目录（已在 `.gitignore` 中）。
5. 字体：图中中文用 **SimHei（黑体）**、西文用 **Times New Roman**；页面文字用 **微软雅黑**。
   Windows 自带；macOS 缺这三个字体，需安装或修改 `figstyle.py` 的 `SER` / `HEI` 配置。
6. 绘图依赖：Python + matplotlib + numpy（Kimi Work 内置 Python 即可）。

## 关键路径

| 内容 | 路径 |
|---|---|
| 交付 pptx | `kimi_k3_arch_analysis/kimi_k3_arch_analysis.pptx` |
| **PPTD 工作副本（编辑入口）** | `working files/decks/kimi_k3_arch_analysis-5545df49/` |
| 页面文件（每页一个） | `working files/decks/kimi_k3_arch_analysis-5545df49/pages/*.page` |
| 绘图公共模块 | `figstyle.py` |
| 第 1 页绘图脚本 | `draw_kda_arch.py` |
| 第 2–5 页绘图脚本 | `draw_5pages.py` |
| 图元 → PPTD 元素转换器 | `emit_pptd.py` |
| 图元记录（中间产物） | `emit/*.json` |
| 参考渲染件 | `k3_fig2_*.png`、`k3_pages_*.txt` |

> ⚠️ `.pptd` 和 `pages/` 已不在 `kimi_k3_arch_analysis/` 下——桌面端为 pptx 建工作副本时
> 把它们移到了 `working files/decks/kimi_k3_arch_analysis-5545df49/`。**一切页面编辑都在工作副本里做**。
> 在 Kimi Work 中打开该目录下的 `.pptd` 即可进入编辑器（编辑 / 批注 / 导出）。

## 编辑工作流

**改页面文字/表格/结论**：直接编辑工作副本 `pages/*.page`，然后校验：

```bash
kimi-slides check "working files/decks/kimi_k3_arch_analysis-5545df49"
```

**改图（不要手改 PPTD 里的图例元素）**：图例是由脚本生成的 PPTD 原生元素
（shape / line / text，可在 PPT 里逐个编辑）。源头是绘图脚本：

```bash
python draw_kda_arch.py    # 第 1 页：生成 PNG + emit/kda_arch.json
python draw_5pages.py      # 第 2–5 页：生成 PNG + emit/{gated_mla,flashkda,kda_decode,attnres}.json
python emit_pptd.py        # 把图元 JSON 转成 PPTD 元素，替换 pages 中标记区间
```

绘图约定（批注中确立，必须遵守）：不用斜线、一律折线（先垂直后水平）；所有框必须连线；
框内必须有文字标注；⊗ 等符号对齐所属模块中心；输出箭头延伸到虚线框边缘；
红虚线框 = K3 相对前作的改动标记；图内注释文字加粗；段标题与图例之间留足间距。

**同步到 pptx（折回）**：改完页面或图例后必须折回，pptx 才更新：

```bash
python3 "$KIMI_SKILLS_ROOT/pptx-surgical/scripts/request_fold.py" "D:\kimi_k3_workspace"
```

返回 `done` 且 `folded` 或 `synced` 包含该 pptx 才算完成；`conflicts` 说明两边都改过，需人工处理。

**渲染验证**：

```bash
kimi-slides screenshot "working files/decks/kimi_k3_arch_analysis-5545df49" -o kimi_k3_arch_analysis/shots_wc
kimi-slides screenshot kimi_k3_arch_analysis/kimi_k3_arch_analysis.pptx -o kimi_k3_arch_analysis/shots_pptx
```

（mstmc.ttf 字体警告无害。）

## 页面清单与关键事实

| 页 | 文件 | 主题 |
|---|---|---|
| 1 | pages/1_kda.page | Kimi Delta Attention（KDA） |
| 2 | pages/2_gated_mla.page | Gated MLA |
| 3 | pages/3_kernel_flashkda.page | 高性能 kernel：FlashKDA |
| 4 | pages/4_kernel_kda_decode.page | 高性能 kernel：KDA decode |
| 5 | pages/5_kernel_attnres.page | 高性能 kernel：Block AttnRes |

报告关键参数（页内均标注来源）：93 层 = 69 KDA + 24+1 MLA；d = 7168；H = 96；
C = 64；gmin = −5。dk / dv / dc / dr / dh 报告未给出，一律写「以 checkpoint config 为准」。

## 已知问题

- 表格单元格里的长 LaTeX 公式导出 pptx 后不会自动缩放，可能超出单元格（如 \(A=\mathrm{Tril}(\cdots)\)）；
  长公式请放在正文/结论区（正文内公式渲染稳定）。
- 导出 PPTX 若报「导出失败，请重试」：先关闭 PowerPoint 中打开的同名文件（~$ 锁文件）或换导出路径。
- `emit_pptd.py` 生成的图例元素区间有注释标记，不要手改标记区间内的内容；要改就改绘图脚本重新生成。

## 协作节奏

- 每台机器：开工先 `git pull`；改完 `git add -A && git commit && git push`。
- `.page` / `.pptd` 均为文本，diff 与合并友好；避免两台机器同时改同一页。
