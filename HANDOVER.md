# 交接文档：Kimi K3 模型结构分析 PPT

> 写给在另一台机器上继续这项工作的人。截至 2026-10-13，5 页内容已定稿并通过多轮批注。

## 1. 项目是什么

一份技术报告 PPT：分析 Kimi K3 的模型结构与高性能 kernel，重点评估新模块对昇腾硬件的冲击
（CUBE 依赖、显存、通信）和软件开发需求（算子层 / 框架层，结合 vllm-ascend 代码仓）。
素材：Kimi K3 技术报告（`Kimi-K3/k3_tech_report.pdf`）、vllm 与 vllm-ascend 代码仓（gitignore，需自行克隆）。

负责范围（已完成）：Hybrid Attention 章节（KDA、Gated MLA 各 1 页）+ Infrastructure 章节
高性能 kernel（FlashKDA、KDA decode、Block AttnRes 各 1 页，原第 6 页 LatentMoE 已按要求删除）。

## 2. 当前状态

- 交付文件：`kimi_k3_arch_analysis/kimi_k3_arch_analysis.pptx`（5 页，含 speaker notes）
- 每页版式：红色 18 号微软雅黑标题 → 红底白字「分析／结论」竖标签 + 灰底结论区（高层方法论，
  技术点→效果，KDA/Gated MLA 结论第一条含核心公式）→ 左侧可编辑图例 + 右侧参数表
  （张量形状 / FLOPs LaTeX 公式，「负载特征→昇腾诉求」列为 `•` 双 bullet 短语）→ 表注 →
  底部「开发需求与趋势思考」四条子弹
- 每页 speaker notes 完整覆盖页面全部内容：开场定位 → 左图讲解 → 右表逐行对照 → 开发需求与趋势；
  第 1、2 页另含计算流程与线性复杂度/压缩手段的深入讲解段
- 图例已从 PNG 图片转为 **PPTD 原生元素**（shape / line / text），在 PPT 里可逐个选中编辑

## 3. 环境准备（新机器）

1. 装 Kimi Work；`git clone https://github.com/YzTongNiar/KimiK3_Report.git`
2. 把技术报告 PDF 放到 `Kimi-K3/k3_tech_report.pdf`（子仓库引用，克隆后为空）
3. 字体：SimHei（黑体）、Times New Roman、微软雅黑。Windows 自带；macOS 需自装，
   或改 `figstyle.py` 的 `SER`/`HEI` 与 `.pptd` 主题字体
4. Python 依赖：matplotlib + numpy（Kimi Work 内置 Python 即可）

## 4. 编辑入口与工作流（重要）

- **编辑入口**：`working files/decks/kimi_k3_arch_analysis-5545df49/kimi_k3_arch_analysis.pptd`，
  在 Kimi Work 中打开它进入编辑器（编辑/批注/导出）。原路径 `kimi_k3_arch_analysis/*.pptd`
  已被桌面端移走，不要再从那里打开
- **改文字** → 编辑工作副本 `pages/*.page` → `kimi-slides check "working files/decks/kimi_k3_arch_analysis-5545df49"`
- **改图** → 改 `draw_kda_arch.py`（第 1 页）或 `draw_5pages.py`（第 2–5 页）→
  依次运行 `python draw_kda_arch.py`、`python draw_5pages.py`、`python emit_pptd.py`
  （图元记录 → PPTD 元素，幂等，可反复跑）
- **同步 pptx** → `python3 "$KIMI_SKILLS_ROOT/pptx-surgical/scripts/request_fold.py" "D:\kimi_k3_workspace"`，
  看到 `folded`/`synced` 含该 pptx 才算完成
- 渲染自查：`kimi-slides screenshot <工作副本或pptx路径> -o <输出目录>`

## 5. 设计规范（多轮批注确立，勿轻易推翻）

- 全册字体：页面文字微软雅黑；图内中文 SimHei、西文 Times New Roman
- 标题红色 #C00000、18 号、无下划线；页眉无章节标注（kicker 已删）
- 结论区：灰底 #F2F2F2，高层方法论（技术点→效果），不写实现细节参数
- 表格：`•` 开头双 bullet 短语（结论式），公式一律 LaTeX `\(...\)`；长公式放正文不放表格单元格
- 绘图约定：只用折线不用斜线；框必有连线、必有文字；⊗ 对齐模块中心；箭头到虚线框边缘；
  红虚线框 = K3 相对前作的改动；段标题与图例间距 ≥2.5 单位；注释文字加粗
- 图内字号基准（matplotlib 画布 194.4×100 单位）：段标题 13.5–15、框内 11–13、注释 10.5–11.5

## 6. 关键事实口径（写作时保持一致）

- 93 层 = 69 KDA + 24+1 Gated MLA；d = 7168；H = 96；C = 64；gmin = −5
- dk / dv / dc / dr / dh 报告未给出 → 写「以 checkpoint config 为准」（K2 参考值 512/64/128）
- KDA 核心递推：S_t = (I − β_t·k_t·k_tᵀ)·Diag(α_t)·S_{t−1} + β_t·k_t·v_tᵀ，o_t = S_tᵀ·q_t
- vllm-ascend 现状：kimi_k3 已注册适配；KDA 为 Triton 版（ops/triton/kda/）；safe-gate 在 host 侧预处理；
  MLA 有 mla_v1 后端

## 7. 已知坑

- **表格长公式**：pptx 导出后原生公式不自动缩放，超宽会溢出单元格——长公式一律放正文/结论
- **导出失败**：先关 PowerPoint 里的同名文件（~$ 锁），或换导出路径
- **emit_pptd.py 标记区间**：页面里 `可编辑图例（由 emit_pptd.py 生成）` 注释区间不要手改
- **工作副本与工程目录的 media**：绘图脚本输出到 `kimi_k3_arch_analysis/media/`，
  工作副本有自己的 `media/`（PNG 备份）；PPTD 图例已不依赖 PNG，但两边都建议同步保留
- `kimi-slides check` 的 mstmc.ttf 警告无害

## 8. 可能的下一步

- 按批注继续微调 5 页内容/图例
- 若恢复 LatentMoE 页：git 历史中有 `pages/6_kernel_latentmoe.page`（节点版本 4ecef0f 之前）
- 总体模型结构框架页（报告 Figure 2 全览）曾讨论过，尚未制作
