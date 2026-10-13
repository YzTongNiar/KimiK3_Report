# -*- coding: utf-8 -*-
"""K3 报告 Figure 2 风格公共绘图模块（配色采样自原图）"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyBboxPatch, Polygon, Circle

plt.rcParams["font.family"] = "serif"
plt.rcParams["font.serif"] = ["Times New Roman", "SimHei"]

PINK      = "#F6D2CE"   # Linear
PINK_DK   = "#E5B3B2"   # Gated MLA
PINK_SH   = "#F6DAD6"   # Linear 阴影
GRAY      = "#F2F2F3"   # Norm / Block / Embedding
GRAY2     = "#F0F0F4"   # Conv / L2 / 次要模块
GRAY_SH   = "#E6E6E8"   # 灰系阴影
BLUE      = "#C8DCF4"   # KDA / 核心计算
BLUE_TXT  = "#1F2A36"
GREEN     = "#CBE6CF"   # LatentMoE / 沙漏 / Vector
DARK      = "#1B1B1E"   # 边框与主数据流
MAROON    = "#814B50"   # AttnRes / 残差线
RED       = "#C00000"   # K3 改动标记
ALPHA_RED = "#B92621"
NOTE_GRAY = "#404040"

SER = "Times New Roman"
HEI = "SimHei"

REC = []   # 图元记录（供 PPTD 可编辑元素导出）

FIG_W, FIG_H = 11.66, 6.0   # 194.4 x 100 units @ aspect equal

def new_canvas():
    fig = plt.figure(figsize=(FIG_W, FIG_H), dpi=300)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 194.4); ax.set_ylim(0, 100)
    ax.set_aspect("equal"); ax.axis("off")
    fig.patch.set_facecolor("white")
    return fig, ax

def rbox(ax, x, y, w, h, fc, text=None, fs=9, ec=DARK, lw=1.1, shadow=None,
         octagon=False, tc="black", bold=False, rounding=1.2, fam=SER, italic=False):
    REC.append(dict(t="rbox", x=x, y=y, w=w, h=h, fc=fc, text=text, fs=fs, ec=ec,
                    lw=lw, shadow=shadow, octagon=octagon, tc=tc, bold=bold,
                    fam=fam, italic=italic))
    def shape(dx=0, dy=0, fill=fc, edge=ec, lw_=lw):
        if octagon:
            c = min(1.6, w / 4, h / 2)
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
                family=fam, color=tc, fontweight="bold" if bold else "normal",
                style="italic" if italic else "normal")

def arrow(ax, x0, y0, x1, y1, color=DARK, lw=1.1, head=True):
    REC.append(dict(t="arrow", x0=x0, y0=y0, x1=x1, y1=y1, color=color, lw=lw, head=head))
    ax.annotate("", xy=(x1, y1), xytext=(x0, y0),
                arrowprops=dict(arrowstyle="-|>" if head else "-",
                                color=color, lw=lw, mutation_scale=9,
                                shrinkA=0, shrinkB=0))

def line(ax, pts, color=DARK, lw=1.1):
    REC.append(dict(t="line", pts=[list(p) for p in pts], color=color, lw=lw))
    xs, ys = zip(*pts)
    ax.plot(xs, ys, color=color, lw=lw, solid_capstyle="round")

def circle(ax, cx, cy, r, label=None, fs=9, ec=DARK, lw=1.1, fc="white",
           tc="black", italic=False, fam=SER):
    REC.append(dict(t="circle", cx=cx, cy=cy, r=r, label=label, fs=fs, ec=ec,
                    lw=lw, fc=fc, tc=tc, italic=italic, fam=fam))
    ax.add_patch(Circle((cx, cy), r, fc=fc, ec=ec, lw=lw))
    if label:
        ax.text(cx, cy, label, ha="center", va="center", fontsize=fs,
                family=fam, color=tc, style="italic" if italic else "normal")

def swish(ax, cx, cy, r=2.1):
    REC.append(dict(t="swish", cx=cx, cy=cy, r=r))
    circle(ax, cx, cy, r)
    t = np.linspace(0, 1, 40)
    xs = cx - 1.1 + 2.2 * t
    ys = cy + 1.0 * (t - 0.5) * 2 + 0.5 * np.sin(2 * np.pi * t) * 0.6
    ax.plot(xs, ys, color=DARK, lw=0.9)

def hourglass(ax, cx, y, w=11, h=5.5):
    REC.append(dict(t="hourglass", cx=cx, y=y, w=w, h=h))
    x = cx - w / 2
    top = [(x, y+h), (x+w, y+h), (x+w*0.72, y+h*0.45), (x+w*0.28, y+h*0.45)]
    bot = [(x+w*0.28, y+h*0.55), (x+w*0.72, y+h*0.55), (x+w, y), (x, y)]
    ax.add_patch(Polygon(top, closed=True, fc=GREEN, ec=DARK, lw=1.0, joinstyle="round"))
    ax.add_patch(Polygon(bot, closed=True, fc=GREEN, ec=DARK, lw=1.0, joinstyle="round"))

def mul_circle(ax, cx, cy, r=2.8):
    REC.append(dict(t="mul", cx=cx, cy=cy, r=r))
    ax.add_patch(Circle((cx, cy), r, fc="white", ec=DARK, lw=1.1))
    d = r * 0.55
    ax.plot([cx-d, cx+d], [cy-d, cy+d], color=DARK, lw=1.0)
    ax.plot([cx-d, cx+d], [cy+d, cy-d], color=DARK, lw=1.0)

def dashed_frame(ax, x, y, w, h, ec=DARK, lw=1.2, ls="--"):
    REC.append(dict(t="frame", x=x, y=y, w=w, h=h, ec=ec, lw=lw))
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle="round,pad=0,rounding_size=2.2", fc="none", ec=ec, lw=lw, ls=ls))

def label(ax, x, y, text, fs=8.5, color="black", fam=SER, ha="left",
          bold=False, italic=False):
    REC.append(dict(t="label", x=x, y=y, text=text, fs=fs, color=color,
                    fam=fam, ha=ha, bold=bold, italic=italic))
    ax.text(x, y, text, fontsize=fs, family=fam, color=color, ha=ha,
            va="center", fontweight="bold" if bold else "normal",
            style="italic" if italic else "normal")
