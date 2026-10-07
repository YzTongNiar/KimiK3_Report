# -*- coding: utf-8 -*-
"""复刻 Kimi K3 技术报告 Figure 2 风格：KDA 模块详图 + 层堆叠结构"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyBboxPatch, Polygon, Circle

plt.rcParams["font.family"] = "serif"
plt.rcParams["font.serif"] = ["Times New Roman", "SimHei"]

# ---- 调色板（采样自报告 Figure 2） ----
PINK      = "#F6D2CE"   # Linear
PINK_DK   = "#E5B3B2"   # Gated MLA
PINK_SH   = "#F6DAD6"   # Linear 阴影
GRAY      = "#F2F2F3"   # Norm / Block / Embedding
GRAY2     = "#F0F0F4"   # Conv / L2
GRAY_SH   = "#E6E6E8"   # 灰系阴影
BLUE      = "#C8DCF4"   # KDA / MoonViT
GREEN     = "#CBE6CF"   # LatentMoE / 沙漏
DARK      = "#1B1B1E"   # 边框与主数据流
MAROON    = "#814B50"   # AttnRes / 残差线
RED       = "#C00000"   # K3 改动标记
ALPHA_RED = "#B92621"   # α 文字

FIG_W, FIG_H = 11.66, 6.0
fig = plt.figure(figsize=(FIG_W, FIG_H), dpi=300)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, 194.4); ax.set_ylim(0, 100)
ax.set_aspect("equal"); ax.axis("off")
fig.patch.set_facecolor("white")

SER = "Times New Roman"

def rbox(x, y, w, h, fc, text=None, fs=9, ec=DARK, lw=1.1, shadow=None,
         octagon=False, tc="black", bold=False, rounding=1.2):
    """带可选偏移阴影的圆角/切角盒"""
    def shape(dx=0, dy=0, fill=fc, edge=ec, lw_=lw):
        if octagon:
            c = 1.6
            pts = [(x+dx+c, y+dy), (x+dx+w-c, y+dy), (x+dx+w, y+dy+c),
                   (x+dx+w, y+dy+h-c), (x+dx+w-c, y+dy+h), (x+dx+c, y+dy+h),
                   (x+dx, y+dy+h-c), (x+dx, y+dy+c)]
            ax.add_patch(Polygon(pts, closed=True, fc=fill, ec=edge, lw=lw_, joinstyle="round"))
        else:
            ax.add_patch(FancyBboxPatch((x+dx, y+dy), w, h,
                boxstyle=f"round,pad=0,rounding_size={rounding}",
                fc=fill, ec=edge, lw=lw_))
    if shadow:
        shape(dx=0.9, dy=-0.9, fill=shadow, edge="none", lw_=0)
    shape()
    if text:
        ax.text(x+w/2, y+h/2, text, ha="center", va="center", fontsize=fs,
                family=SER, color=tc, fontweight="bold" if bold else "normal")

def arrow(x0, y0, x1, y1, color=DARK, lw=1.1, head=True):
    ax.annotate("", xy=(x1, y1), xytext=(x0, y0),
                arrowprops=dict(arrowstyle="-|>" if head else "-",
                                color=color, lw=lw, mutation_scale=9,
                                shrinkA=0, shrinkB=0))

def line(pts, color=DARK, lw=1.1):
    xs, ys = zip(*pts)
    ax.plot(xs, ys, color=color, lw=lw, solid_capstyle="round")

def circle(cx, cy, r, label=None, fs=9, ec=DARK, lw=1.1, fc="white", tc="black", italic=False):
    ax.add_patch(Circle((cx, cy), r, fc=fc, ec=ec, lw=lw))
    if label:
        ax.text(cx, cy, label, ha="center", va="center", fontsize=fs,
                family=SER, color=tc, style="italic" if italic else "normal")

def swish(cx, cy, r=2.1):
    circle(cx, cy, r)
    t = np.linspace(0, 1, 40)
    xs = cx - 1.1 + 2.2 * t
    ys = cy + 1.0 * (t - 0.5) * 2 + 0.5 * np.sin(2 * np.pi * t) * 0.6
    ax.plot(xs, ys, color=DARK, lw=0.9)

def hourglass(cx, y, w=11, h=5.5):
    x = cx - w / 2
    top = [(x, y+h), (x+w, y+h), (x+w*0.72, y+h*0.45), (x+w*0.28, y+h*0.45)]
    bot = [(x+w*0.28, y+h*0.55), (x+w*0.72, y+h*0.55), (x+w, y), (x, y)]
    ax.add_patch(Polygon(top, closed=True, fc=GREEN, ec=DARK, lw=1.0, joinstyle="round"))
    ax.add_patch(Polygon(bot, closed=True, fc=GREEN, ec=DARK, lw=1.0, joinstyle="round"))

def mul_circle(cx, cy, r=2.8):
    ax.add_patch(Circle((cx, cy), r, fc="white", ec=DARK, lw=1.1))
    d = r * 0.55
    ax.plot([cx-d, cx+d], [cy-d, cy+d], color=DARK, lw=1.0)
    ax.plot([cx-d, cx+d], [cy+d, cy-d], color=DARK, lw=1.0)

def dashed_frame(x, y, w, h, ec=DARK, lw=1.2, ls="--"):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle="round,pad=0,rounding_size=2.2", fc="none", ec=ec, lw=lw, ls=ls))

# ============================================================
# 左：KDA 模块（复刻 Figure 2 左下）
# ============================================================
dashed_frame(4, 5, 100, 90)

# 输入与总线
arrow(54, 5, 54, 11)
line([(16, 11), (90, 11)])
for bx in (16, 34, 52, 68, 90):
    line([(bx, 11), (bx, 13)])

# --- 塔 A：q/k ---
rbox(9, 13, 14, 6, PINK, "Linear", fs=8, shadow=PINK_SH)
rbox(9.5, 23, 13, 6, GRAY2, "Conv", fs=8, shadow=GRAY_SH, octagon=True)
swish(16, 33.5)
rbox(11, 37.5, 10, 5.5, GRAY2, "L2", fs=7, octagon=True)
line([(16, 19), (16, 23)])
line([(16, 29), (16, 31.4)])
line([(16, 35.6), (16, 37.5)])
arrow(13.5, 43, 13.5, 52); arrow(18.5, 43, 18.5, 52)
ax.text(11.6, 47.5, "q", fontsize=11, family=SER, style="italic")
ax.text(20.2, 47.5, "k", fontsize=11, family=SER, style="italic")

# --- 塔 B：v ---
rbox(27, 13, 14, 6, PINK, "Linear", fs=8, shadow=PINK_SH)
rbox(27.5, 23, 13, 6, GRAY2, "Conv", fs=8, shadow=GRAY_SH, octagon=True)
swish(34, 33.5)
line([(34, 19), (34, 23)]); line([(34, 29), (34, 31.4)])
arrow(34, 35.6, 34, 52)
ax.text(35.4, 47.5, "v", fontsize=11, family=SER, style="italic")

# --- 塔 C：α（改动① 红框） ---
hourglass(52, 13); hourglass(52, 19.5)
circle(52, 29.5, 2.1, "σ", fs=9)
line([(52, 25), (52, 27.4)])
arrow(52, 31.6, 52, 52)
ax.text(53.4, 47.5, "α", fontsize=11, family=SER, style="italic")
dashed_frame(44, 11.5, 16, 23.5, ec=RED, lw=1.3, ls=(0, (4, 2)))
ax.text(60.5, 32, "①", fontsize=10, family="SimHei", color=RED, fontweight="bold")

# --- 塔 D：β ---
hourglass(68, 13)
circle(68, 23, 2.1, "σ", fs=9)
line([(68, 18.5), (68, 20.9)])
arrow(68, 25.1, 68, 52)
ax.text(69.4, 47.5, "β", fontsize=11, family=SER, style="italic")

# --- 塔 E：输出门（改动② 红框） ---
rbox(83, 13, 14, 6, PINK, "Linear", fs=8, shadow=PINK_SH)
circle(90, 33.5, 2.1, "σ", fs=9)
line([(90, 19), (90, 31.4)])
line([(90, 35.6), (90, 78), (58.2, 78)])  # 右侧上行 → ⊗
dashed_frame(81, 11.5, 18, 9.5, ec=RED, lw=1.3, ls=(0, (4, 2)))
ax.text(99.6, 16, "②", fontsize=10, family="SimHei", color=RED, fontweight="bold")

# --- KDA 核心 ---
rbox(12, 52, 70, 10, BLUE, "Kimi Delta Attention", fs=10.5)

# --- Norm → ⊗ → Linear → 输出 ---
rbox(41, 66, 26, 6, GRAY, "Norm", fs=8.5, shadow=GRAY_SH)
arrow(54, 62, 54, 66)
mul_circle(54, 78)
arrow(54, 72, 54, 75.2)
rbox(41, 84, 26, 6, PINK, "Linear", fs=8.5, shadow=PINK_SH)
arrow(54, 80.8, 54, 84)
arrow(54, 90, 54, 95)
ax.text(56.5, 92, "$y_t$", fontsize=10, family=SER)

# ============================================================
# 右：层堆叠（复刻 Figure 2 右侧：3×KDA + 1×Gated MLA + AttnRes）
# ============================================================
# 底部：Embedding / Block n−2 / Block n−1（与主栈同轴 x=140）
rbox(127, 4.5, 26, 6.5, GRAY, "Embedding", fs=8.5)
for dy in (12.2, 13.4, 14.6):
    ax.add_patch(Circle((140, dy), 0.35, fc="#9A9A9C", ec="none"))
rbox(127, 16, 26, 6.5, GRAY, "Block $n-2$", fs=8.5)
rbox(127, 26, 26, 6.5, GRAY, "Block $n-1$", fs=8.5)

dashed_frame(114, 34, 56, 61)
ax.text(146, 1.2, "1 Block = 3×KDA + 1×Gated MLA（×23，末尾再 +1×Gated MLA）",
        fontsize=7, family="SimHei", color="#404040", ha="center")

XC = 140  # 主栈中心
# 主干
arrow(XC, 32.5, XC, 37)
rbox(XC-12, 37, 24, 6.5, BLUE, "KDA", fs=9)
arrow(XC, 43.5, XC, 45.9)
rbox(XC-2.1, 45.9, 4.2, 4.2, "white", "+", fs=8)
arrow(XC, 50.1, XC, 52)
rbox(XC-14, 52, 28, 6.5, GREEN, "Stable LatentMoE", fs=8.5)
arrow(XC, 58.5, XC, 59.9)
rbox(XC-2.1, 59.9, 4.2, 4.2, "white", "+", fs=8)
arrow(XC, 64.1, XC, 65.5)
rbox(XC-13, 65.5, 26, 6.5, PINK_DK, "Gated MLA", fs=9)
arrow(XC, 72, XC, 73.9)
rbox(XC-2.1, 73.9, 4.2, 4.2, "white", "+", fs=8)
arrow(XC, 78.1, XC, 79.5)
rbox(XC-14, 79.5, 28, 6.5, GREEN, "Stable LatentMoE", fs=8.5)
arrow(XC, 86, XC, 87.9)
rbox(XC-2.1, 87.9, 4.2, 4.2, "white", "+", fs=8)
arrow(XC, 92.1, XC, 95)

# 残差（maroon，左侧绕行；抽头避开 + 框，末端箭头进入 + 左缘）
for x0ch, y_a, y_b in [(124, 36, 48), (122.3, 51, 62), (120.6, 64.5, 76), (118.9, 78.5, 90)]:
    line([(XC, y_a), (x0ch, y_a), (x0ch, y_b)], color=MAROON, lw=1.0)
    arrow(x0ch, y_b, XC - 2.1, y_b, color=MAROON, lw=1.0)

ax.text(116.3, 47, "3×", fontsize=12, family=SER, style="italic", ha="center")
ax.text(116.3, 68.5, "1×", fontsize=12, family=SER, style="italic", ha="center")

# AttnRes：α 圆 + w 盒 + maroon 线（α → 模块右缘 回注箭头）
alphas = [(40.25, 152), (55.25, 154), (68.75, 153), (82.75, 154)]
for cy, rx in alphas:
    arrow(158.6, cy, rx, cy, color=MAROON, lw=1.0)
    circle(161, cy, 2.4, "α", fs=9, ec=MAROON, lw=1.2, tc=ALPHA_RED, italic=True)
    arrow(161, cy + 2.4, 161, cy + 3.6, color=MAROON, lw=1.0)
    rbox(158.4, cy + 3.8, 5.2, 4.2, "white", None, lw=1.0)
    ax.text(161, cy + 5.9, "w", fontsize=8, family=SER, style="italic",
            ha="center", va="center")
# 三条纵向通道：Block n−1 / n−2 / Embedding
for x_ch, y_src in [(177, 29.25), (180, 19.25), (183, 7.75)]:
    line([(153, y_src), (x_ch, y_src), (x_ch, 82.75)], color=MAROON, lw=1.0)
for cy, _ in alphas:
    line([(163.4, cy), (183, cy)], color=MAROON, lw=1.0)

import os
os.makedirs("kimi_k3_arch_analysis/media", exist_ok=True)
fig.savefig("kimi_k3_arch_analysis/media/kda_arch.png", dpi=300,
            facecolor="white", bbox_inches=None)
print("saved")
