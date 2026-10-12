import {pathToFileURL} from "node:url";
const art=await import(pathToFileURL("C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs").href);
const {PresentationFile,FileBlob}=art;
const src="C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v14.pptx";
const out="C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v15.pptx";
const p=await PresentationFile.importPptx(await FileBlob.load(src));

const conclusions=[
`KDA 用固定大小的递归状态 S_t 汇总历史 token；Decode 每步只读取并更新 S_t，不再逐 token 扫描整段 K/V cache。\nPrefill 仍在 chunk 内并行，Decode 状态更新为 O(1)，长上下文缓存压力转化为固定状态的读写压力。\n代价是 gate/递归的 Vector 计算与投影 CUBE 计算必须片上协同，状态驻留决定 Decode 吞吐。`,
`Gated MLA 以 NoPE 保留全局内容检索，把位置信息交给 KDA，形成“局部递归 + 全局注意力”的互补结构。\n低秩 latent cache 显著降低 KV 存储与通信，长上下文收益主要来自 cache 压缩与吸收式计算。\n代价是 latent page、RoPE/NoPE 分支和 TP/PCP/DCP 调度需要统一，Decode 更偏 GEMV 与带宽受限。`,
`FlashKDA 将 chunk 内 matmul、门控扫描和跨 chunk 状态传播融合为流水，目标是把训练/Prefill 从多次往返变成一次状态 handoff。\nCUBE 承担主要矩阵乘，Vector 承担衰减、cumsum 和小矩阵更新；chunk 64/128 是吞吐与片上存储的折中。\n核心效果是减少 kernel launch 和 L0 staging，最终收益取决于 CUBE/Vector overlap 与状态连续性。`,
`KDA Decode 将 ShortConv、gate、递归更新和输出投影合并，目标是降低单 token 的启动次数与状态往返。\nRecoverSSM 让投机解码只回滚未验证状态，减少拒绝 token 的重复计算。\n瓶颈从 FLOPs 转为状态快照、片上 SRAM 和 persistent graph 的时延，算子必须围绕固定 decode shape 设计。`,
`AttnRes 把深层残差从逐层累积改成 8 个 block bank 的可学习检索，降低深度维注意力的复杂度。\nPrefill 可以把 bank 聚合与 intra-block 计算拆开并行，Decode 通过 side stream 隐藏通信。\n核心收益是跨层信息复用，核心风险是 bank 的 resident/reload 生命周期和 HCCL/内存碎片。`
];

const formulaSets=[
[
 ['x\\in\\mathbb{R}^{7168}\\rightarrow q,k\\in\\mathbb{R}^{H\\times d_k},\\ v\\in\\mathbb{R}^{H\\times d_v}','2dH(2d_k+d_v)'],
 ['z=W_zx,\\ \\beta=W_\\beta x,\\ z\\in\\mathbb{R}^{H\\times d_k}','\\approx 2dr'],
 ['g=-5\\cdot\\sigma(e^A\\odot z)','O(Hd_k)'],
 ['A=\\operatorname{Tril}((Q\\odot Q_F)(K/K)^\\top\\rightarrow p),\\ C=64','2C(d_k+d_v)'],
 ['S_t\\in\\mathbb{R}^{d_k\\times d_v},\\ S_{t+1}=F(S_t,Q_t,K_t,V_t)','2d_kd_v'],
 ['69\\ \\mathrm{text\\ layers},\\ |S|\\approx3.0\\,\\mathrm{MB/layer}','\\approx2.1\\,\\mathrm{M\\ FLOPs/(head\\cdot chunk)}']
],
[
 ['x\\in\\mathbb{R}^{7168}\\rightarrow c_t\\in\\mathbb{R}^{512}','2dd_c'],
 ['q:d\\rightarrow Hd_h;\\ k,v:d_c\\rightarrow Hd_h','2dHd_h+4d_cHd_h'],
 ['P=\\operatorname{softmax}(QK^\\top/\\sqrt{d_h});\\ O=PV','2LHd_h'],
 ['g=\\sigma(W_gx),\\ W_g\\in\\mathbb{R}^{d\\times d}','2d^2'],
 ['c_{KV}\\in\\mathbb{R}^{512}','24.6\\,\\mathrm{KB/token\\ (BF16)}'],
 ['24\\ \\mathrm{textMLA\\ layers},\\ r_q=1536,\\ r_{KV}=512','\\text{per-layer }QK^\\top/\\sqrt{d_h}+AV']
],
[
 ['X\\in\\mathbb{R}^{B\\times H\\times C\\times d_k},\\ C\\in\\{64,128\\}','O(BHCd_k)'],
 ['Q,K\\in\\mathbb{R}^{C\\times d_k},\\ V\\in\\mathbb{R}^{C\\times d_v}','2C(d_k+d_v)'],
 ['S_{t+1}=F(S_t,Q_t,K_t,V_t),\\ S\\in\\mathbb{R}^{d_k\\times d_v}','2d_kd_v'],
 ['Y\\in\\mathbb{R}^{B\\times C\\times d}\\leftarrow XW_o','2dHd_v'],
 ['N_{\\mathrm{seq}}\\le1024,\\ C\\in\\{64,128\\}','\\approx2.1\\,\\mathrm{M/(head\\cdot chunk)}'],
 ['\\mathrm{layout}=BSND;\\ \\mathrm{state}\\in\\mathbb{R}^{d_k\\times d_v}','O(1)\\ \\mathrm{handoff}']
],
[
 ['X_t\\in\\mathbb{R}^{B\\times H\\times d_k},\\ k=4','\\approx4Hd_k/\\mathrm{token}'],
 ['g=-5\\cdot\\sigma(e^A\\odot z)','O(Hd_k)'],
 ['S_t\\in\\mathbb{R}^{H\\times d_k\\times d_v}','\\approx3Hd_kd_v/\\mathrm{token}'],
 ['D\\ \\mathrm{draft\\ tokens,\\ projection\\ input}','D\\times3Hd_kd_v'],
 ['D=4;\\ \\mathrm{snapshot}\\approx24\\,\\mathrm{MB/layer/step}','\\mathrm{replay}\\approx D\\times3Hd_kd_v']
],
[
 ['R\\in\\mathbb{R}^{N\\times d},\\ N\\approx8','O(Nd)/\\mathrm{layer}'],
 ['w\\in\\mathbb{R}^{d},\\ B\\in\\mathbb{R}^{N\\times d}','O(Nd)'],
 ['\\mathrm{RS}+\\mathrm{AG},\\ B\\in\\mathbb{R}^{N\\times d}','\\text{per-block aggregation}'],
 ['\\mathrm{bank}\\in\\mathbb{R}^{N\\times d}','126\\text{--}129\\,\\mathrm{KB/token}'],
 ['N=8,\\ L=1\\,\\mathrm{M\\ context}','O(Nd),\\ \\text{not }O(L^2d)']
]
];

function xmlEscape(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
const supMap={0:'⁰',1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶',7:'⁷',8:'⁸',9:'⁹','+':'⁺','-':'⁻','(':'⁽',')':'⁾','n':'ⁿ','i':'ⁱ'};
const subMap={0:'₀',1:'₁',2:'₂',3:'₃',4:'₄',5:'₅',6:'₆',7:'₇',8:'₈',9:'₉','+':'₊','-':'₋','(':'₍',')':'₎','a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ'};
function mapChars(s,map){return [...s].map(ch=>map[ch]||ch).join('');}
function visible(latex){let s=latex;
 s=s.replace(/\\operatorname\\{([^}]*)\\}/g,'$1').replace(/\\mathrm\\{([^}]*)\\}/g,'$1').replace(/\\text\\{([^}]*)\\}/g,'$1').replace(/\\mathbb\\{R\\}/g,'ℝ');
 s=s.replace(/\\sqrt\\{([^}]*)\\}/g,'√($1)').replace(/\\frac\\{([^}]*)\\}\\{([^}]*)\\}/g,'($1)/($2)');
 const reps=[['\\\\times','×'],['\\\\cdot','·'],['\\\\odot','⊙'],['\\\\in','∈'],['\\\\rightarrow','→'],['\\\\to','→'],['\\\\approx','≈'],['\\\\le','≤'],['\\\\top','ᵀ'],['\\\\sigma','σ'],['\\\\beta','β'],['\\\\alpha','α'],['\\\\gamma','γ'],['\\\\theta','θ'],['\\\\mathrm',''],['\\\\left',''],['\\\\right',''],['\\\\,',' '],['\\\\!','']];
 for(const [a,b] of reps)s=s.replace(new RegExp(a,'g'),b);
 s=s.replace(/\\([A-Za-z]+)/g,'$1');
 s=s.replace(/\\^\\{([^}]*)\\}/g,(_,x)=>mapChars(x,supMap)).replace(/\\_\\{([^}]*)\\}/g,(_,x)=>mapChars(x,subMap));
 s=s.replace(/\\^([A-Za-z0-9]+)/g,(_,x)=>mapChars(x,supMap)).replace(/\\_([A-Za-z0-9]+)/g,(_,x)=>mapChars(x,subMap));
 s=s.replace(/\^\{([^}]*)\}/g,(_,x)=>mapChars(x,supMap)).replace(/_\{([^}]*)\}/g,(_,x)=>mapChars(x,subMap));
 s=s.replace(/\^([A-Za-z0-9]+)/g,(_,x)=>mapChars(x,supMap)).replace(/_([A-Za-z0-9]+)/g,(_,x)=>mapChars(x,subMap));
 s=s.replace(/[{}]/g,'');
 return s;
}
function formulaSvg(latex){const text=xmlEscape(visible(latex)); const meta=xmlEscape('LaTeX: '+latex); return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="160" viewBox="0 0 1000 160"><metadata>${meta}</metadata><rect width="1000" height="160" fill="white" fill-opacity="0"/><text x="10" y="100" font-family="Cambria Math, STIX Two Math, serif" font-size="30" fill="#262626" textLength="980" lengthAdjust="spacingAndGlyphs">${text}</text></svg>`;}

const tableIds=['tb/lwfe1cbi','tb/xgfq5cbi','tb/j6ps72lo','tb/wnqxwf25','tb/gjutwb61'];
for(let i=0;i<5;i++){
 const slide=p.slides.items[i];
 const concl=slide.shapes.items.find(x=>x.name==='concl-bullets'); if(concl) concl.text=conclusions[i];
 const t=p.resolve(tableIds[i]);
 const frame=t.frame; const colEmu=[1328928,1439672,941324,1827276]; const total=colEmu.reduce((a,b)=>a+b,0); const colW=colEmu.map(x=>frame.width*x/total); const colX=[frame.left,frame.left+colW[0],frame.left+colW[0]+colW[1],frame.left+colW[0]+colW[1]+colW[2]];
 const rowH=i<3?373380/9525:448056/9525; const headH=248920/9525;
 const rows=formulaSets[i];
 // Keep structural headers clean and remove formula cells before overlaying rendered formulas.
 const header=t.getCell(0,1); header.value='张量形状'; const header2=t.getCell(0,2); header2.value=i===0||i===1||i===2?'FLOPs/token':'FLOPs';
 for(let r=1;r<=rows.length;r++){
   t.getCell(r,1).value=''; t.getCell(r,2).value='';
   const y=frame.top+headH+(r-1)*rowH;
   for(const c of [1,2]){
     const svg=formulaSvg(rows[r-1][c-1]);
     slide.images.add({svg,alt:'Rendered LaTeX formula: '+rows[r-1][c-1],fit:'contain',position:{left:colX[c]+4,top:y+4,width:colW[c]-8,height:rowH-8}});
   }
 }
}

const notes=[
`本页讲解：左图从输入 x 开始，先经过 q/k/v 投影与 ShortConv，对应右表第 1 行。红框①对应遗忘门 z 与写入 β，以及有界衰减/cumsum，对应第 2、3 行；chunk 内注意力对应第 4 行；跨 chunk 的状态 S_t 更新对应第 5 行；右侧层堆叠与状态账本对应第 6 行。\n\n概念：KDA 用固定大小的递归状态汇总历史。Prefill 仍按 chunk 并行，Decode 只读写固定状态，因此长上下文不再逐 token 扫描整段 K/V。\n\n开发思考：算子侧融合 gate、cumsum、delta rule、RMSNorm，避免中间态落 HBM；运行时把 state slot 纳入 cache manager，优先优化 state bytes/token、状态驻留与 persistent kernel。表格中的形状与 FLOPs 公式由 LaTeX 源码渲染，源表达式保留在公式图形替代文字中。`,
`本页讲解：左图红框①是 Gated MLA 主注意力路径，对应右表第 3 行；底部隐向量下投影 Wc 与上投影对应第 1、2 行；右侧输出门对应第 4 行；latent KV cache 与通信对应第 5 行；综合账本对应第 6 行。\n\n概念：NoPE Gated MLA 负责全局内容检索，KDA 负责位置与递归记忆。低秩 latent cache 压缩 KV 存储和通信，形成局部递归与全局注意力互补。\n\n开发思考：缓存管理需要把 latent page、传统 KV page 和 KDA checkpoint 分开管理；算子侧优先融合 QK/AV absorption、RoPE/NoPE 与 output gate；推理侧围绕 TP/PCP/DCP 通信、HCCL overlap 与 tail latency 建立基线。公式列采用 LaTeX 源码渲染。`,
`本页讲解：左图上半部分的 gate/prepare 对应右表第 1 行；chunk 内 QK/AV 矩阵计算对应第 2 行；跨 chunk handoff 对应第 3 行；Finalize/output 对应第 4 行；训练/Prefill 账本和部署约束对应第 5、6 行。\n\n概念：FlashKDA 把 chunk 内矩阵计算、门控扫描和状态 handoff 组织成流水，CUBE 处理主矩阵乘，Vector 处理衰减、cumsum 和小矩阵更新。\n\n开发思考：将 gate、prepare、post-Wu、FwdH、Finalize 组织成物理 L0 kernel，显式暴露 initial_state/final_state/gk；Prefill 使用 64/128 chunk，Decode 固定 shape，并用 CUBE/Vector overlap、L0 占用和状态 handoff 衡量收益。公式列采用 LaTeX 源码渲染。`,
`本页讲解：左图的短卷积对应右表第 1 行，safe-gate 对应第 2 行，KDA 递归状态对应第 3 行；投机解码中的状态重建 replay 对应第 4 行；综合账本对应第 5 行。\n\n概念：KDA Decode 将 ShortConv、gate、递归更新和输出投影放入固定路径；RecoverSSM 只回滚未验证状态，减少拒绝 token 的重复计算。\n\n开发思考：框架侧对齐 use_kda_recoverssm、snapshot 粒度和 speculative block；算子侧固化 FULL_DECODE_ONLY shape，让 snapshot 留在 L0/UB；验收同时观察接受率、replay 流量、SRAM 占用和启动延迟。公式列采用 LaTeX 源码渲染。`,
`本页讲解：左图上方的 inter-block pass 对应右表第 1 行，intra-block mix 对应第 2 行；Prefill 通信链路 RS+AG 对应第 3 行；bank 的 resident/reload 对应第 4 行；右表综合账本对应第 5 行。\n\n概念：AttnRes 把深层残差组织成 8 个 block bank。Prefill 将 bank 聚合和块内计算拆开并行，Decode 用 side stream 隐藏通信，收益来自跨层信息复用。\n\n开发思考：算子侧融合 BF16 add、bank mix、RMSNorm 和 writeback，并提供 RESIDENT/RELOAD tiling；通信侧把 RS+AG、side stream 和 bank 回收接入统一 cache manager；验收同时看 HCCL overlap、带宽、resident 命中率和内存碎片。公式列采用 LaTeX 源码渲染。`
];
for(let i=0;i<5;i++)p.slides.items[i].speakerNotes.text=notes[i];
p.slides.keep([0,1,2,3,4]);
await (await PresentationFile.exportPptx(p)).save(out);
console.log(out);
