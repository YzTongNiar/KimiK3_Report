# -*- coding: utf-8 -*-
"""重绘 PPT 第 2-6 页模块图（报告 Figure 2 风格）"""
import os
from figstyle import *

OUT = "kimi_k3_arch_analysis/media"
os.makedirs(OUT, exist_ok=True)

def save(fig, name):
    fig.savefig(f"{OUT}/{name}", dpi=300, facecolor="white")
    import matplotlib.pyplot as plt
    plt.close(fig)
    print("saved", name)

# ============================================================
# 第 2 页：Gated MLA
# ============================================================
def page2():
    fig, ax = new_canvas()
    dashed_frame(ax, 4, 5, 100, 90)
    # 输入总线
    arrow(ax, 54, 5, 54, 11)
    line(ax, [(24, 11), (84, 11)])
    for bx in (24, 52, 84):
        line(ax, [(bx, 11), (bx, 13)])
    # 塔1：q
    rbox(ax, 17, 13, 14, 6, PINK, "Linear", fs=8, shadow=PINK_SH)
    arrow(ax, 24, 19, 24, 46)
    label(ax, 25.2, 32, "q", fs=11, italic=True)
    # 塔2：kv 压缩
    rbox(ax, 45, 13, 14, 6, PINK, "Linear", fs=8, shadow=PINK_SH)
    arrow(ax, 52, 19, 52, 23)
    rbox(ax, 44, 23, 16, 6, GRAY, None, shadow=GRAY_SH)
    label(ax, 52, 26, "$c_t$ (KV Cache)", fs=7, ha="center")
    arrow(ax, 48, 29, 46, 33); arrow(ax, 56, 29, 58, 33)
    rbox(ax, 38, 33, 12, 6, PINK, "$W^{UK}$", fs=8, shadow=PINK_SH)
    rbox(ax, 54, 33, 12, 6, PINK, "$W^{UV}$", fs=8, shadow=PINK_SH)
    arrow(ax, 44, 39, 44, 46); arrow(ax, 60, 39, 60, 46)
    label(ax, 42.6, 42.5, "k", fs=11, italic=True)
    label(ax, 58.6, 42.5, "v", fs=11, italic=True)
    # 塔3：输出门（改动②）
    rbox(ax, 77, 13, 14, 6, PINK, "Linear", fs=8, shadow=PINK_SH)
    circle(ax, 84, 25, 2.1, "σ", fs=9)
    line(ax, [(84, 19), (84, 22.9)])
    line(ax, [(84, 27.1), (84, 62), (57.2, 62)])
    dashed_frame(ax, 75.5, 11.5, 18, 9.5, ec=RED, lw=1.3, ls=(0, (4, 2)))
    label(ax, 94.5, 16, "②", fs=10, color=RED, fam=HEI, bold=True)
    # 注意力核心（改动① NoPE）
    rbox(ax, 12, 46, 66, 10, BLUE, "Gated MLA Attention", fs=10.5)
    dashed_frame(ax, 10, 44, 72, 14, ec=RED, lw=1.3, ls=(0, (4, 2)))
    label(ax, 13, 59.5, "① NoPE（全部头）", fs=7.5, color=RED, fam=HEI, bold=True)
    # 输出
    arrow(ax, 54, 56, 54, 59.2)
    mul_circle(ax, 54, 62)
    arrow(ax, 54, 64.8, 54, 70)
    rbox(ax, 41, 70, 26, 6, PINK, "Linear $W^O$", fs=8.5, shadow=PINK_SH)
    arrow(ax, 54, 76, 54, 82)
    label(ax, 56.5, 79.5, "$y_t$", fs=10)
    label(ax, 70, 79.5, "③ 训练输出 FP32", fs=7.5, color=RED, fam=HEI, bold=True)
    save(fig, "gated_mla.png")

# ============================================================
# 第 3 页：FlashKDA chunkwise
# ============================================================
def page3():
    fig, ax = new_canvas()
    # 上：朴素交替
    dashed_frame(ax, 4, 56, 186, 40)
    label(ax, 8, 90, "朴素交替：CUBE / Vector 串行等待", fs=8.5, fam=HEI, bold=True)
    xs = [(14, 34, "C1", BLUE), (38, 50, "S1", GREEN), (54, 74, "C2", BLUE),
          (78, 90, "S2", GREEN), (94, 114, "C3", BLUE)]
    for x0, x1, t, c in xs:
        rbox(ax, x0, 66, x1 - x0, 8, c, t, fs=9, tc=BLUE_TXT if c == BLUE else "black")
    for x0, x1 in [(34, 38), (50, 54), (74, 78), (90, 94)]:
        arrow(ax, x0 + 0.5, 70, x1 - 0.5, 70, lw=1.0)
    label(ax, 120, 70, "… 气泡 = 等待", fs=8, color=NOTE_GRAY, fam=HEI)
    label(ax, 14, 61, "C = chunk 内稠密 matmul（CUBE）　S = 跨 chunk 状态传播（Vector）",
          fs=7.5, color=NOTE_GRAY, fam=HEI)
    # 下：FlashKDA 交叠流水
    dashed_frame(ax, 4, 6, 186, 44)
    label(ax, 8, 44, "FlashKDA：intra-chunk 与跨 chunk 流水交叠", fs=8.5, fam=HEI, bold=True)
    label(ax, 8, 30, "CUBE", fs=8, fam=SER)
    for i, x0 in enumerate([16, 34, 52, 70]):
        rbox(ax, x0, 26, 17, 8, BLUE, f"C{i+1}", fs=9, tc=BLUE_TXT)
    label(ax, 8, 16, "Vector", fs=8, fam=SER)
    for i, x0 in enumerate([34, 52, 70]):
        rbox(ax, x0, 12, 13, 8, GREEN, f"S{i+1}", fs=9)
    for i in range(3):
        arrow(ax, 25.5 + 18 * i, 26, 40.5 + 18 * i, 20, lw=1.0)
    # 公式框
    dashed_frame(ax, 120, 10, 66, 28, ec="#7A7A7A", lw=1.0)
    label(ax, 123, 33, "chunkwise 递推（C = 64）", fs=7.5, fam=HEI, bold=True)
    label(ax, 123, 26.5, r"$S_i=(I-\beta_i k_i k_i^{\top})\,\mathrm{Diag}(\alpha_i)\,S_{i-1}+\beta_i k_i v_i^{\top}$", fs=7.5)
    label(ax, 123, 19.5, "对角块：有界衰减 → 稠密 matmul", fs=7.5, fam=HEI)
    label(ax, 123, 13.5, "跨 chunk：小矩阵 rank-1 更新，串行", fs=7.5, fam=HEI)
    save(fig, "flashkda.png")

# ============================================================
# 第 4 页：KDA decode 融合递归算子
# ============================================================
def page4():
    fig, ax = new_canvas()
    # 上：融合链
    dashed_frame(ax, 4, 52, 186, 44)
    label(ax, 8, 90, "单融合 kernel：重放 + bonus + 下一草稿共享一个递归循环", fs=8.5, fam=HEI, bold=True)
    chain = [(14, "短卷积 k=4", GRAY2), (46, "输入归一化", GRAY2), (78, "门控 σ", GRAY2),
             (110, "KDA 递归 S", BLUE), (142, "输出归一化", GRAY2)]
    for x0, t, c in chain:
        rbox(ax, x0, 64, 28, 10, c, t, fs=8, fam=HEI, tc=BLUE_TXT if c == BLUE else "black")
    for x0 in [42, 74, 106, 138]:
        arrow(ax, x0 + 0.5, 69, x0 + 3.5, 69, lw=1.0)
    line(ax, [(131, 64), (131, 58.5), (117, 58.5)])
    arrow(ax, 117, 58.5, 117, 63.5, lw=1.0)
    label(ax, 124, 55.5, "递归循环", fs=7, color=NOTE_GRAY, fam=HEI, ha="center")
    # 下：MTP 回滚
    dashed_frame(ax, 4, 6, 186, 40)
    label(ax, 8, 40, "MTP 验证拒绝时的状态回滚", fs=8.5, fam=HEI, bold=True)
    drafts = [(14, "d1 √", GREEN), (34, "d2 √", GREEN), (54, "d3 ×", PINK_DK), (74, "d4 ×", PINK_DK)]
    for x0, t, c in drafts:
        rbox(ax, x0, 22, 16, 8, c, t, fs=8.5, fam=HEI)
    arrow(ax, 91, 26, 99, 26)
    rbox(ax, 100, 22, 36, 8, GRAY2, "片上重建 S（仅 d1, d2）", fs=8, fam=HEI)
    arrow(ax, 137, 26, 145, 26)
    rbox(ax, 146, 22, 36, 8, BLUE, "写回 S (verified + bonus)", fs=8, tc=BLUE_TXT, fam=HEI)
    label(ax, 14, 13, "缓存投影输入 D×(4dk+1)·H×2B，仅为状态快照的 ≈1/32（dv = 128）；状态不离开 decode 阶段",
          fs=7, color=NOTE_GRAY, fam=HEI)
    save(fig, "kda_decode.png")

# ============================================================
# 第 5 页：Block AttnRes
# ============================================================
def page5():
    fig, ax = new_canvas()
    # 上：机制
    dashed_frame(ax, 4, 52, 186, 44)
    label(ax, 8, 90, "机制：对 block 表示做深度维注意力", fs=8.5, fam=HEI, bold=True)
    bs = [(14, "b0", "white"), (34, "b1", BLUE), (54, "b2", BLUE), (90, "b8", BLUE)]
    for x0, t, c in bs:
        rbox(ax, x0, 66, 16, 8, c, t, fs=8.5, tc=BLUE_TXT if c == BLUE else "black")
    label(ax, 76, 70, "…", fs=11, color=NOTE_GRAY, ha="center")
    circle(ax, 116, 70, 3, "w", fs=9, ec=DARK, fc=PINK, italic=True)
    label(ax, 121.5, 70, "伪查询（逐层可学习）", fs=7, color=NOTE_GRAY, fam=HEI)
    circle(ax, 62, 57, 2.6, "Σ", fs=9)
    for x0 in (22, 42, 62):
        arrow(ax, x0, 66, 62, 59.8, lw=1.0)
    arrow(ax, 98, 66, 64.5, 58.5, lw=1.0)
    arrow(ax, 113.2, 68.5, 64.8, 57.8, lw=1.0)
    label(ax, 70, 57, r"$h_l=\sum_i \alpha_i \cdot b_i$", fs=9)
    label(ax, 122, 57, "α = softmax(w·RMSNorm(b))", fs=7, color=NOTE_GRAY, fam=HEI)
    label(ax, 122, 52.5, "online softmax 合并", fs=7, color=NOTE_GRAY, fam=HEI)
    # 中：Prefill
    label(ax, 8, 46, "Prefill：all-reduce 拆为 RS + AG，kernel 插入其间", fs=8.5, fam=HEI, bold=True)
    rbox(ax, 14, 32, 30, 8, GRAY2, "Reduce-Scatter", fs=8)
    arrow(ax, 45, 36, 53, 36)
    rbox(ax, 54, 32, 56, 8, BLUE, "intra-block kernel（序列分片上物化）", fs=8, tc=BLUE_TXT, fam=HEI)
    arrow(ax, 111, 36, 119, 36)
    rbox(ax, 120, 32, 26, 8, GRAY2, "All-Gather", fs=8)
    # 下：Decode
    label(ax, 8, 24, "Decode：inter-block 放 side stream 交叠", fs=8.5, fam=HEI, bold=True)
    for x0, w in [(14, 30), (48, 30)]:
        rbox(ax, x0, 12, w, 7, BLUE, "主流计算", fs=7.5, tc=BLUE_TXT, fam=HEI)
    label(ax, 84, 15.5, "…", fs=11, color=NOTE_GRAY, ha="center")
    rbox(ax, 30, 3.5, 60, 6, PINK, "inter-block kernel（side stream）", fs=7.5, fam=HEI)
    label(ax, 94, 6.5, "与主流独立计算交叠，隐藏延迟", fs=7, color=NOTE_GRAY, fam=HEI)
    save(fig, "attnres.png")

# ============================================================
# 第 6 页：Stable LatentMoE
# ============================================================
def page6():
    fig, ax = new_canvas()
    # 上：数据流
    dashed_frame(ax, 4, 52, 186, 44)
    label(ax, 8, 90, "LatentMoE 数据流与三项 GEMM 优化（①②③）", fs=8.5, fam=HEI, bold=True)
    rbox(ax, 10, 66, 10, 8, "white", "x", fs=10, italic=True)
    arrow(ax, 21, 70, 27, 70)
    rbox(ax, 28, 64, 34, 12, PINK, "融合 GEMM ①\nRouter + 下投影 W↓", fs=7.5, fam=HEI, shadow=PINK_SH)
    arrow(ax, 63, 70, 69, 70)
    rbox(ax, 70, 66, 24, 8, BLUE, r"latent $\ell$=3584", fs=8, tc=BLUE_TXT)
    arrow(ax, 95, 70, 101, 70)
    rbox(ax, 102, 64, 34, 12, GREEN, "16 / 896 路由专家\n(ℓ 宽 FFN)".replace("ℓ", "l"), fs=7.5, fam=HEI)
    arrow(ax, 137, 70, 143, 70)
    rbox(ax, 144, 64, 36, 12, PINK, "W↑ + AG ②\nepilogue 融合", fs=7.5, fam=HEI, shadow=PINK_SH)
    # 共享专家交叠
    rbox(ax, 70, 54, 44, 7, GREEN, "共享专家 ×2（全宽 d）", fs=7.5, fam=HEI)
    line(ax, [(80, 66), (80, 61)], color=MAROON, lw=1.0)
    arrow(ax, 114, 57.5, 150, 63.5, color=MAROON, lw=1.0)
    label(ax, 124, 58.5, "③ 交叠", fs=7.5, color=MAROON, fam=HEI, bold=True)
    # 下：decode 权重流读
    dashed_frame(ax, 4, 6, 186, 40)
    label(ax, 8, 40, "Decode 小 batch：token 中心（WarpDecode）权重流读", fs=8.5, fam=HEI, bold=True)
    for i, y0 in enumerate([26, 17, 8]):
        label(ax, 10, y0 + 3, f"lane team {i+1}", fs=7.5, fam=SER)
        rbox(ax, 34, y0, 96, 6, BLUE, None)
    label(ax, 134, 29, "每 warp 负责一个输出神经元，", fs=7, color=NOTE_GRAY, fam=HEI)
    label(ax, 134, 23, "直接从内存流式读权重；", fs=7, color=NOTE_GRAY, fam=HEI)
    label(ax, 134, 17, "lane team 细分 → warp 内归约合并；", fs=7, color=NOTE_GRAY, fam=HEI)
    label(ax, 134, 11, "小 batch 并行度与带宽利用率同时提升", fs=7, color=NOTE_GRAY, fam=HEI)
    save(fig, "latentmoe.png")

page2(); page3(); page4(); page5(); page6()
