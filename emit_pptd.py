# -*- coding: utf-8 -*-
"""把 emit/*.json 图元记录转换为 PPTD 原生元素（可编辑），替换页面中的 arch-figure 图片"""
import json, math, re, sys

X0, Y0, W, H = 38, 198, 424, 218
SX, SY = W / 194.4, H / 100

def px(x): return X0 + x * SX
def py(y): return Y0 + (100 - y) * SY
def fpt(fs): return max(3.5, round(fs * 0.5046 * 2) / 2)
def lwp(lw): return max(0.5, round(lw * 0.5046 * 4) / 4)
def col(c):
    if c in (None, "none"): return None
    if c == "white": return "#FFFFFF"
    return c
def fam(f): return "黑体" if f == "SimHei" else "Times New Roman"
def mathfix(t): return re.sub(r"\$([^$]+)\$", r"\\(\1\\)", t)

def fmt(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s

class Emitter:
    def __init__(self, prefix):
        self.prefix = prefix
        self.n = 0
        self.out = []
    def eid(self, kind):
        self.n += 1
        return f"{self.prefix}-{kind}{self.n}"
    def shape(self, x, y, w, h, name, fill=None, border=None, extra=""):
        e = [f"  - elementId: {self.eid('s')}",
             "    elementType: shape",
             f"    bounds: [{fmt(x)}, {fmt(y)}, {fmt(w)}, {fmt(h)}]",
             f"    shapeName: {name}"]
        if extra: e.append(extra)
        if fill: e.append(f"    fill: {{type: solid, color: \"{fill}\"}}")
        if border:
            st, wd, c = border
            e.append(f"    border: {{style: {st}, width: {fmt(wd)}, color: \"{c}\"}}")
        self.out.append("\n".join(e))
    def text(self, x, y, w, h, txt, fs, color, fm, bold=False, italic=False,
             align="center"):
        e = [f"  - elementId: {self.eid('t')}",
             "    elementType: text",
             f"    bounds: [{fmt(x)}, {fmt(y)}, {fmt(w)}, {fmt(h)}]",
             "    content:",
             f"      fontSize: {fmt(fs)}",
             f"      color: \"{color}\"",
             f"      fontFamily: {fm}"]
        if bold: e.append("      bold: true")
        if italic: e.append("      italic: true")
        e += ["      wrap: false",
              f"      align: [{align}, middle]",
              "      text: |",
              f"        {mathfix(txt)}"]
        self.out.append("\n".join(e))
    def pline(self, pts, color, lw, arrow=False, curve="sharp"):
        cpts = [(px(x), py(y)) for x, y in pts]
        bx = min(p[0] for p in cpts) - 1; by = min(p[1] for p in cpts) - 1
        bw = max(p[0] for p in cpts) - bx + 1; bh = max(p[1] for p in cpts) - by + 1
        rel = " ".join(f"{fmt(x-bx)},{fmt(y-by)}" for x, y in cpts)
        e = [f"  - elementId: {self.eid('l')}",
             "    elementType: line",
             f"    bounds: [{fmt(bx)}, {fmt(by)}, {fmt(max(bw,1))}, {fmt(max(bh,1))}]",
             f"    viewBox: [{fmt(max(bw,1))}, {fmt(max(bh,1))}]",
             f"    points: \"{rel}\"",
             f"    curve: {curve}"]
        if arrow: e.append("    arrow: [null, arrow]")
        e.append(f"    border: {{style: solid, width: {fmt(lwp(lw))}, color: \"{col(color) or '#1B1B1E'}\"}}")
        self.out.append("\n".join(e))
    def custom_path(self, x, y, w, h, pts, fill, lw, ec):
        """pts 为 mpl 单位坐标（相对于 x,y），y 向上"""
        vw, vh = sw(w), sh(h)
        rel = [(px_(x_) , vh - py_(y_)) for x_, y_ in
               [(p[0]*SX, p[1]*SY) for p_ in pts for px_, py_ in [p_]]] if False else \
              [(p[0]*SX, vh - p[1]*SY) for p in pts]
        d = "M " + " L ".join(f"{fmt(a)},{fmt(b)}" for a, b in rel) + " Z"
        extra = f"    viewBox: [{fmt(vw)}, {fmt(vh)}]\n    path: \"{d}\""
        self.shape(x, y, vw, vh, "custom", fill=fill,
                   border=("solid", lwp(lw), ec) if ec else None, extra=extra)

def sw(w): return w * SX
def sh(h): return h * SY

def est_w(text, fs_pt):
    t = re.sub(r"\$([^$]+)\$", lambda m: "x" * max(4, int(len(m.group(0)) * 0.62)), text)
    w = sum(fs_pt if ord(ch) > 0x2E7F else fs_pt * 0.55 for ch in t)
    return w * 1.12 + 3

def emit(prims, prefix):
    em = Emitter(prefix)
    for p in prims:
        t = p["t"]
        if t == "rbox":
            bx, by, bw, bh = px(p["x"]), py(p["y"] + p["h"]), sw(p["w"]), sh(p["h"])
            if p.get("shadow"):
                if p.get("octagon"):
                    c = min(1.6, p["w"] / 4, p["h"] / 2)
                    pts = [(c,0),(p["w"]-c,0),(p["w"],c),(p["w"],p["h"]-c),
                           (p["w"]-c,p["h"]),(c,p["h"]),(0,p["h"]-c),(0,c)]
                    em.custom_path(bx + 0.9*SX, by + 0.9*SY, p["w"], p["h"], pts,
                                   col(p["shadow"]), 0, None)
                else:
                    em.shape(bx + 0.9*SX, by + 0.9*SY, bw, bh, "roundRect",
                             fill=col(p["shadow"]))
            if p.get("octagon"):
                c = min(1.6, p["w"] / 4, p["h"] / 2)
                pts = [(c,0),(p["w"]-c,0),(p["w"],c),(p["w"],p["h"]-c),
                       (p["w"]-c,p["h"]),(c,p["h"]),(0,p["h"]-c),(0,c)]
                em.custom_path(bx, by, p["w"], p["h"], pts, col(p["fc"]),
                               p["lw"], col(p["ec"]))
            else:
                em.shape(bx, by, bw, bh, "roundRect", fill=col(p["fc"]),
                         border=("solid", lwp(p["lw"]), col(p["ec"]) or "#1B1B1E"))
            if p.get("text"):
                em.text(bx, by, bw, bh, p["text"], fpt(p["fs"]),
                        col(p["tc"]) or "#000000", fam(p.get("fam", "Times New Roman")),
                        bold=p.get("bold", False), italic=p.get("italic", False))
        elif t == "arrow":
            em.pline([(p["x0"], p["y0"]), (p["x1"], p["y1"])], p["color"], p["lw"],
                     arrow=p.get("head", True))
        elif t == "line":
            em.pline(p["pts"], p["color"], p["lw"])
        elif t == "circle":
            r = p["r"]
            em.shape(px(p["cx"]) - r*SX, py(p["cy"]) - r*SY, 2*r*SX, 2*r*SY, "ellipse",
                     fill=col(p["fc"]),
                     border=("solid", lwp(p["lw"]), col(p["ec"])) if col(p["ec"]) else None)
            if p.get("label"):
                em.text(px(p["cx"]) - r*SX, py(p["cy"]) - r*SY, 2*r*SX, 2*r*SY,
                        p["label"], fpt(p["fs"]), col(p["tc"]) or "#000000",
                        fam(p.get("fam", "Times New Roman")), italic=p.get("italic", False))
        elif t == "swish":
            r = p["r"]
            em.shape(px(p["cx"]) - r*SX, py(p["cy"]) - r*SY, 2*r*SX, 2*r*SY, "ellipse",
                     fill="#FFFFFF", border=("solid", lwp(1.1), "#1B1B1E"))
            import numpy as np
            ts = np.linspace(0, 1, 40)
            pts = [(p["cx"] - 1.1 + 2.2*tt,
                    p["cy"] + 2*(tt-0.5) + 0.3*math.sin(2*math.pi*tt)) for tt in ts]
            em.pline(pts, "#1B1B1E", 0.9, curve="smooth")
        elif t == "hourglass":
            w, h = p["w"], p["h"]
            x = p["cx"] - w/2
            top = [(0,h),(w,h),(0.72*w,0.45*h),(0.28*w,0.45*h)]
            bot = [(0.28*w,0.55*h),(0.72*w,0.55*h),(w,0),(0,0)]
            em.custom_path(px(x), py(p["y"]+h), w, h, top, "#CBE6CF", 1.0, "#1B1B1E")
            em.custom_path(px(x), py(p["y"]+h), w, h, bot, "#CBE6CF", 1.0, "#1B1B1E")
        elif t == "mul":
            r = p["r"]
            em.shape(px(p["cx"]) - r*SX, py(p["cy"]) - r*SY, 2*r*SX, 2*r*SY, "ellipse",
                     fill="#FFFFFF", border=("solid", lwp(1.1), "#1B1B1E"))
            d = r * 0.55
            em.pline([(p["cx"]-d, p["cy"]-d), (p["cx"]+d, p["cy"]+d)], "#1B1B1E", 1.0)
            em.pline([(p["cx"]-d, p["cy"]+d), (p["cx"]+d, p["cy"]-d)], "#1B1B1E", 1.0)
        elif t == "frame":
            em.shape(px(p["x"]), py(p["y"] + p["h"]), sw(p["w"]), sh(p["h"]), "roundRect",
                     border=("dash", lwp(p["lw"]), col(p["ec"]) or "#1B1B1E"))
        elif t == "label":
            fs = fpt(p["fs"])
            w = est_w(p["text"], fs)
            h = fs * 1.7
            tx = px(p["x"]) if p.get("ha", "left") == "left" else px(p["x"]) - w/2
            em.text(tx, py(p["y"]) - h/2, w, h, p["text"], fs,
                    col(p["color"]) or "#000000", fam(p.get("fam", "Times New Roman")),
                    bold=p.get("bold", False), italic=p.get("italic", False),
                    align="left" if p.get("ha", "left") == "left" else "center")
    return em.out

PAGES = {
    "kda_arch":   "pages/1_kda.page",
    "gated_mla":  "pages/2_gated_mla.page",
    "flashkda":   "pages/3_kernel_flashkda.page",
    "kda_decode": "pages/4_kernel_kda_decode.page",
    "attnres":    "pages/5_kernel_attnres.page",
}

ROOT = sys.argv[1] if len(sys.argv) > 1 else "working files/decks/kimi_k3_arch_analysis-5545df49"

for name, page in PAGES.items():
    prims = json.load(open(f"emit/{name}.json", encoding="utf8"))
    elements = emit(prims, f"fig-{name}")
    path = f"{ROOT}/{page}"
    src = open(path, encoding="utf8").read()
    pat = re.compile(
        r"  # ===== 可编辑图例（由 emit_pptd\.py 生成，勿手改；改图请改绘图脚本后重新生成） =====\n.*?"
        r"  # ===== 可编辑图例结束 =====\n"
        r"|  - elementId: arch-figure\n    elementType: image\n    bounds: \[[^\]]+\]\n    src: [^\n]+\n",
        re.S)
    assert pat.search(path and src), page
    block = ("  # ===== 可编辑图例（由 emit_pptd.py 生成，勿手改；改图请改绘图脚本后重新生成） =====\n"
             + "\n".join(elements) + "\n"
             + "  # ===== 可编辑图例结束 =====\n")
    new_src = pat.sub(lambda m: block, src)
    open(path, "w", encoding="utf8", newline="").write(new_src)
    print(page, "->", len(elements), "elements")
