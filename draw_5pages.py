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
    line(ax, [(84, 27.1), (84, 62), (48.3, 62)])
    dashed_frame(ax, 75.5, 11.5, 18, 9.5, ec=RED, lw=1.3, ls=(0, (4, 2)))
    label(ax, 94.5, 16, "②", fs=10, color=RED, fam=HEI, bold=True)
    # 注意力核心（改动① NoPE）
    rbox(ax, 12, 46, 66, 10, BLUE, "Gated MLA Attention", fs=10.5)
    dashed_frame(ax, 10, 44, 72, 14, ec=RED, lw=1.3, ls=(0, (4, 2)))
    label(ax, 13, 59.5, "① NoPE（全部头）", fs=7.5, color=RED, fam=HEI, bold=True)
    # 输出（⊗ 与 MLA 框中心 x=45 对齐，输出箭头延至虚线框顶）
    arrow(ax, 45, 56, 45, 59.2)
    mul_circle(ax, 45, 62)
    arrow(ax, 45, 64.8, 45, 70)
    rbox(ax, 32, 70, 26, 6, PINK, "Linear $W^O$", fs=8.5, shadow=PINK_SH)
    arrow(ax, 45, 76, 45, 92)
    label(ax, 47.5, 88, "$y_t$", fs=10)
    label(ax, 60, 85, "③ 训练输出 FP32", fs=7.5, color=RED, fam=HEI, bold=True)
    save(fig, "gated_mla.png")

# ============================================================
# 第 3 页：FlashKDA chunkwise
# ============================================================
def page3():
    fig, ax = new_canvas()
    # 上：朴素交替（显式空闲气泡）
    dashed_frame(ax, 4, 54, 186, 42)
    label(ax, 8, 88, "朴素交替：CUBE / Vector 串行等待", fs=14, fam=HEI, bold=True)
    xs = [(14, 32, "C1", BLUE, 1), (35, 46, "空闲", None, 0), (49, 61, "S1", GREEN, 1),
          (64, 75, "空闲", None, 0), (78, 96, "C2", BLUE, 1), (99, 110, "空闲", None, 0),
          (113, 125, "S2", GREEN, 1), (128, 139, "空闲", None, 0), (142, 160, "C3", BLUE, 1)]
    for x0, x1, t, c, solid in xs:
        if solid:
            rbox(ax, x0, 64, x1 - x0, 13, c, t, fs=13, tc=BLUE_TXT if c == BLUE else "black")
        else:
            dashed_frame(ax, x0, 64, x1 - x0, 13, ec="#9A9A9C", lw=1.2)
            label(ax, (x0 + x1) / 2, 70.5, t, fs=10.5, color="#9A9A9C", fam=HEI, ha="center")
    label(ax, 164, 70.5, "… 气泡 = 算力空置", fs=12, color=NOTE_GRAY, fam=HEI)
    label(ax, 14, 58, "C = chunk 内稠密 matmul（CUBE）　S = 跨 chunk 状态传播（Vector）",
          fs=12, color=NOTE_GRAY, fam=HEI, bold=True)
    # 下：FlashKDA 交叠流水（细化子阶段，折线连接）
    dashed_frame(ax, 4, 4, 186, 46)
    label(ax, 8, 42.5, "FlashKDA：intra-chunk 与跨 chunk 流水交叠（S 驻留 L1 / UB，双缓冲）",
          fs=14, fam=HEI, bold=True)
    label(ax, 8, 31, "CUBE", fs=12.5, fam=SER)
    for i, x0 in enumerate([22, 48.5, 75, 101.5]):
        rbox(ax, x0, 26, 15, 12, BLUE, f"A·V{i+1}", fs=12, tc=BLUE_TXT)
        rbox(ax, x0 + 15.5, 26, 10, 12, "#A6C8EA", f"UT{i+1}", fs=11, tc=BLUE_TXT)
    label(ax, 8, 15, "Vector", fs=12.5, fam=SER)
    rbox(ax, 22, 11, 13, 12, GREEN, "Γ", fs=13)
    label(ax, 28.5, 7.5, "cumsum", fs=11, color=NOTE_GRAY, ha="center", bold=True)
    for i, x0 in enumerate([42.5, 69, 95.5]):
        rbox(ax, x0, 11, 14, 12, GREEN, f"S{i+1}", fs=13)
    # 折线依赖：C_i 底部 → 水平通道 → S_i 顶部
    for i in range(3):
        cx_c = 29.5 + 26.5 * i  # A·V 中心
        cx_s = 49.5 + 26.5 * i  # S 中心
        line(ax, [(cx_c, 26), (cx_c, 24.5), (cx_s, 24.5)], lw=1.2)
        arrow(ax, cx_s, 24.5, cx_s, 23.3, lw=1.2)
    # 公式框
    dashed_frame(ax, 131, 8, 55, 32, ec="#7A7A7A", lw=1.2)
    label(ax, 134, 34.5, "chunkwise 递推（C = 64）", fs=11, fam=HEI, bold=True)
    label(ax, 134, 28, r"$S_i=(I-\beta_i k_i k_i^{\top})\,\mathrm{Diag}(\alpha_i)\,S_{i-1}$", fs=11)
    label(ax, 134, 22.5, r"$+\,\beta_i k_i v_i^{\top}$", fs=11)
    label(ax, 134, 16, "对角块：有界衰减 → 稠密 matmul", fs=10.5, fam=HEI)
    label(ax, 134, 10.5, "跨 chunk：小矩阵 rank-1 更新，串行", fs=10.5, fam=HEI)
    save(fig, "flashkda.png")

# ============================================================
# 第 4 页：KDA decode 融合递归算子
# ============================================================
def page4():
    fig, ax = new_canvas()
    # 上：融合链
    dashed_frame(ax, 4, 54, 186, 42)
    label(ax, 8, 88, "单融合 kernel：重放 + bonus + 下一草稿共享一个递归循环", fs=14, fam=HEI, bold=True)
    chain = [(14, "短卷积 k=4", GRAY2), (48, "输入归一化", GRAY2), (82, "门控 σ", GRAY2),
             (116, "KDA 递归 S", BLUE), (150, "输出归一化", GRAY2)]
    for x0, t, c in chain:
        rbox(ax, x0, 62, 30, 14, c, t, fs=12, fam=HEI, tc=BLUE_TXT if c == BLUE else "black")
    for x0 in [44, 78, 112, 146]:
        arrow(ax, x0 + 0.5, 69, x0 + 3.5, 69, lw=1.4)
    line(ax, [(136, 62), (136, 59), (122, 59)], lw=1.2)
    arrow(ax, 122, 59, 122, 61.5, lw=1.2)
    label(ax, 129, 55.2, "递归循环", fs=11, color=NOTE_GRAY, fam=HEI, ha="center", bold=True)
    # 下：MTP 回滚
    dashed_frame(ax, 4, 4, 186, 46)
    label(ax, 8, 42.5, "MTP 验证拒绝时的状态回滚", fs=14, fam=HEI, bold=True)
    drafts = [(14, "d1 √", GREEN), (36, "d2 √", GREEN), (58, "d3 ×", PINK_DK), (80, "d4 ×", PINK_DK)]
    for x0, t, c in drafts:
        rbox(ax, x0, 22, 18, 12, c, t, fs=12, fam=HEI)
    for x0 in (32, 54, 76):
        arrow(ax, x0 + 0.5, 28, x0 + 3.5, 28, lw=1.4)
    arrow(ax, 98.5, 28, 106.5, 28, lw=1.4)
    rbox(ax, 107, 22, 38, 12, GRAY2, "片上重建 S（仅 d1, d2）", fs=11.5, fam=HEI)
    arrow(ax, 145.5, 28, 151.5, 28, lw=1.4)
    rbox(ax, 152, 22, 34, 12, BLUE, "写回 S (verified + bonus)", fs=11, tc=BLUE_TXT, fam=HEI)
    label(ax, 14, 13, "缓存投影输入 D×(4dk+1)·H×2B，仅为状态快照的 ≈1/32（dv = 128）；状态不离开 decode 阶段",
          fs=11, color=NOTE_GRAY, fam=HEI, bold=True)
    save(fig, "kda_decode.png")

# ============================================================
# 第 5 页：Block AttnRes
# ============================================================
def page5():
    fig, ax = new_canvas()
    # 上：机制
    dashed_frame(ax, 4, 52, 186, 44)
    label(ax, 8, 89, "机制：对 block 表示做深度维注意力", fs=14, fam=HEI, bold=True)
    bs = [(14, "b0", "white"), (38, "b1", BLUE), (62, "b2", BLUE), (100, "b8", BLUE)]
    for x0, t, c in bs:
        rbox(ax, x0, 66, 18, 12, c, t, fs=12, tc=BLUE_TXT if c == BLUE else "black")
    label(ax, 88, 72, "…", fs=14, color=NOTE_GRAY, ha="center")
    circle(ax, 126, 72, 3.4, "w", fs=11, ec=DARK, fc=PINK, italic=True)
    label(ax, 132, 72, "伪查询（逐层可学习）", fs=11, color=NOTE_GRAY, fam=HEI, bold=True)
    circle(ax, 71, 56, 3, "Σ", fs=11)
    # 总线折线：各 b / w 垂直汇入 y=62 总线，再垂直入 Σ
    line(ax, [(23, 62), (126, 62)], lw=1.2)
    for x0 in (23, 47, 109):
        line(ax, [(x0, 66), (x0, 62)], lw=1.2)
    line(ax, [(126, 68.6), (126, 62)], lw=1.2)
    line(ax, [(71, 66), (71, 62)], lw=1.2)
    arrow(ax, 71, 62, 71, 59.2, lw=1.2)   # b2 正对 Σ，直通
    label(ax, 80, 56, r"$h_l=\sum_i \alpha_i \cdot b_i$", fs=13)
    label(ax, 132, 58, "α = softmax(w·RMSNorm(b))", fs=10.5, color=NOTE_GRAY, fam=HEI, bold=True)
    label(ax, 132, 53.5, "online softmax 合并", fs=10.5, color=NOTE_GRAY, fam=HEI, bold=True)
    # 中：Prefill
    label(ax, 8, 46, "Prefill：all-reduce 拆为 RS + AG，kernel 插入其间", fs=13, fam=HEI, bold=True)
    rbox(ax, 14, 31, 32, 10, GRAY2, "Reduce-Scatter", fs=11.5)
    arrow(ax, 47, 36, 53, 36, lw=1.4)
    rbox(ax, 54, 31, 62, 10, BLUE, "intra-block kernel（序列分片上物化）", fs=11.5, tc=BLUE_TXT, fam=HEI)
    arrow(ax, 117, 36, 123, 36, lw=1.4)
    rbox(ax, 124, 31, 28, 10, GRAY2, "All-Gather", fs=11.5)
    # 下：Decode
    label(ax, 8, 24, "Decode：inter-block 放 side stream 交叠", fs=13, fam=HEI, bold=True)
    for x0 in (14, 52):
        rbox(ax, x0, 11, 32, 9, BLUE, "主流计算", fs=11.5, tc=BLUE_TXT, fam=HEI)
    arrow(ax, 46.5, 15.5, 51.5, 15.5, lw=1.2)
    label(ax, 92, 15.5, "…", fs=14, color=NOTE_GRAY, ha="center")
    rbox(ax, 30, 3.5, 64, 6.5, PINK, "inter-block kernel（side stream）", fs=11, fam=HEI)
    # side stream 与主流的交叠关系（虚线垂直连接）
    for x0 in (45, 75):
        line(ax, [(x0, 10), (x0, 11)], color="#9A9A9C", lw=1.0)
    label(ax, 100, 6.5, "与主流独立计算交叠，隐藏延迟", fs=10.5, color=NOTE_GRAY, fam=HEI, bold=True)
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
    # 共享专家交叠（折线）
    rbox(ax, 70, 54, 44, 7, GREEN, "共享专家 ×2（全宽 d）", fs=7.5, fam=HEI)
    line(ax, [(80, 66), (80, 61)], color=MAROON, lw=1.0)
    line(ax, [(114, 57.5), (160, 57.5)], color=MAROON, lw=1.0)
    arrow(ax, 160, 57.5, 160, 63.5, color=MAROON, lw=1.0)
    label(ax, 133, 59.5, "③ 交叠", fs=7.5, color=MAROON, fam=HEI, bold=True)
    # 下：decode 权重流读
    dashed_frame(ax, 4, 6, 186, 40)
    label(ax, 8, 40, "Decode 小 batch：token 中心（WarpDecode）权重流读", fs=8.5, fam=HEI, bold=True)
    for i, y0 in enumerate([26, 17, 8]):
        label(ax, 10, y0 + 3, f"lane team {i+1}", fs=7.5, fam=SER)
        rbox(ax, 34, y0, 96, 6, BLUE, f"专家权重分片 {i+1}/3 · warp 流式读权重 · 归约合并",
             fs=7.5, tc=BLUE_TXT, fam=HEI)
    label(ax, 134, 29, "每 warp 负责一个输出神经元，", fs=7, color=NOTE_GRAY, fam=HEI)
    label(ax, 134, 23, "直接从内存流式读权重；", fs=7, color=NOTE_GRAY, fam=HEI)
    label(ax, 134, 17, "lane team 细分 → warp 内归约合并；", fs=7, color=NOTE_GRAY, fam=HEI)
    label(ax, 134, 11, "小 batch 并行度与带宽利用率同时提升", fs=7, color=NOTE_GRAY, fam=HEI)
    save(fig, "latentmoe.png")

page2(); page3(); page4(); page5(); page6()
