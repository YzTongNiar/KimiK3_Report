import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {PresentationFile,FileBlob}=art;
const src='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-calibrated.pptx';
const out='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-calibrated-v2.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const fix=(s)=>{let x=String(s).replace(/\u0008eta/g,'β').replace(/\u0009ext/g,'text').replace(/\u000B/g,'').replace(/\f/g,'').replace(/\r/g,'');
  x=x.replace(/\\n/g,'\n').replace(/\\\(/g,'').replace(/\\\)/g,'')
   .replace(/\\mathbb\{R\}/g,'ℝ').replace(/\\in/g,'∈').replace(/\\to/g,'→').replace(/\\times/g,'×').replace(/\\cdot/g,'·')
   .replace(/\\approx/g,'≈').replace(/\\le/g,'≤').replace(/\\ge/g,'≥').replace(/\\operatorname\{Tril\}/g,'Tril')
   .replace(/\\operatorname\{softmax\}/g,'softmax').replace(/\\sqrt\{([^}]*)\}/g,'√$1').replace(/\\text\{([^}]*)\}/g,'$1')
   .replace(/\\left|\\right/g,'').replace(/\\up/g,'↑').replace(/\\down/g,'↓').replace(/\\odot/g,'⊙').replace(/\\top/g,'ᵀ')
   .replace(/[{}]/g,'').replace(/\\/g,'');
  return x;
};
const rows={
 'tb/lwfe1cbi':[
 ['组件','张量形状（LaTeX）','FLOPs/token（LaTeX）','负载特征 → 昇腾诉求'],
 ['q/k/v 投影 + ShortConv','\\(x\\in\\mathbb{R}^{7168}\\to q,k\\in\\mathbb{R}^{H d_k},\\ v\\in\\mathbb{R}^{H d_v}\\)','\\(2dH(2d_k+d_v)\\)','• 负载：稠密 GEMM；Prefill 计算密集，Decode 退化为 GEMV。\\n• 昇腾诉求：Prefill 映射 CUBE，Decode 通过权重驻留/融合降低访存。'],
 ['遗忘门 z + 写入 β','\\(z=W_zx,\\ \beta=W_\\beta x,\\ z\\in\\mathbb{R}^{Hd_k}\\)','\\(\\approx 2dr\\)','• 负载：低秩投影 + sigmoid/exp 逐元素。\\n• 昇腾诉求：投影走 CUBE，门控与投影后处理走 Vector 并融合。'],
 ['有界衰减','\\(g=-5\\cdot\\sigma(e^{A\\odot z})\\)','\\(O(Hd_k)\\)','• 负载：逐元素 Vector，存在指数/累加数值风险。\\n• 昇腾诉求：FP32 累加与安全 gate，避免 BF16 下溢并保持递归稳定。'],
 ['Chunk 内注意力','\\(A=\\operatorname{Tril}((Q\\odot Q_F)(K/K)^\\top),\\ C=64\\)','\\(2C(d_k+d_v)\\)','• 负载：chunk 内 tile matmul，CUBE 占主导。\\n• 昇腾诉求：64/128 tile 与 L0/UB 双缓冲，提高 CUBE 利用率。'],
 ['跨 chunk 状态传播','\\(S_t\\in\\mathbb{R}^{d_k\\times d_v},\\ S_{t+1}=F(S_t,Q_t,K_t,V_t)\\)','\\(2d_kd_v\\)','• 负载：小矩阵、串行依赖，算力占比低但同步敏感。\\n• 昇腾诉求：S 驻留 L0/UB，减少 HBM 往返并与 CUBE 计算重叠。'],
 ['综合账本','\\(69\\ \text{层},\\ |S|\\approx3.0\\text{MB/layer}\\)','\\(\\approx2.1\\text{M FLOPs/head/chunk}\\)','• 负载：Decode 由状态读写与启动延迟主导。\\n• 昇腾诉求：CUBE/Vector overlap + persistent kernel，优化 bytes/token。']],
 'tb/xgfq5cbi':[
 ['组件','张量形状（LaTeX）','FLOPs/token（LaTeX）','负载特征 → 昇腾诉求'],
 ['隐向量下投影 Wc','\\(x\\in\\mathbb{R}^{7168}\\to c_t\\in\\mathbb{R}^{512}\\)','\\(2d d_c\\)','• 负载：Dense GEMM；Decode 时矩阵变窄。\\n• 昇腾诉求：Prefill 用 CUBE，Decode 采用权重驻留和批量 GEMV。'],
 ['Q/K/V 投影与上投影','\\(q:d\\to Hd_h;\\ k,v:d_c\\to Hd_h\\)','\\(2dHd_h+4d_cHd_h\\)','• 负载：投影 + latent 重建，存在吸收式计算机会。\\n• 昇腾诉求：在 CUBE 上融合 absorb，减少 latent page 读取和中间回写。'],
 ['NoPE 全局注意力','\\(P=\\operatorname{softmax}(QK^\\top/\\sqrt{d_h});\\ O=PV\\)','\\(2L H d_h\\)','• 负载：Prefill 随序列长度增长，QK/AV 占主导。\\n• 昇腾诉求：CUBE tile + Flash/分块 softmax，Decode 侧重 cache 带宽。'],
 ['全秩输出门','\\(g=\\sigma(W_gx),\\ W_g\\in\\mathbb{R}^{d\\times d}\\)','\\(2d^2\\)','• 负载：大 GEMM；Decode 小 batch 下 GEMV 化。\\n• 昇腾诉求：Prefill 走 CUBE，Decode 用融合 epilogue 降低 launch 与带宽。'],
 ['KV cache / 通信','\\(c_{KV}\\in\\mathbb{R}^{512}\\)','\\(24.6\\text{KB/token, BF16})\\','• 负载：latent page 读写 + PCP/DCP 通信。\\n• 昇腾诉求：按 latent page 做 cache 管理，通信与 QK/AV 计算重叠。'],
 ['综合账本','\\(24\\ \text{MLA层},\\ r_q=1536,\\ r_{KV}=512\\)','\\(\\text{按 layer 统计 QK}^\\top\\text{/AV})\\','• 负载：混合 KDA/MLA 产生两类状态。\\n• 昇腾诉求：统一 state-aware cache，跨 TP/PP 回收生命周期。']],
 'tb/j6ps72lo':[
 ['阶段','张量形状（LaTeX）','FLOPs/token（LaTeX）','负载特征 → 昇腾诉求'],
 ['Gate + prepare','\\(X\\in\\mathbb{R}^{B\\times H\\times C\\times d_k},\\ C\\in\\{64,128\\}\\)','\\(O(BHCd_k)\\)','• 负载：cumsum/衰减为 Vector 扫描。\\n• 昇腾诉求：与 gate/prepare 融合进 L0，避免多次 staging。'],
 ['Chunk 内 A·V','\\(Q,K\\in\\mathbb{R}^{C\\times d_k},\\ V\\in\\mathbb{R}^{C\\times d_v}\\)','\\(2C(d_k+d_v)\\)','• 负载：tile matmul，CUBE 主导。\\n• 昇腾诉求：选择 64/128 tile，双缓冲提升 CUBE 占用率。'],
 ['跨 chunk handoff','\\(S_{t+1}=F(S_t,Q_t,K_t,V_t),\\ S\\in\\mathbb{R}^{d_k\\times d_v}\\)','\\(2d_kd_v\\)','• 负载：小矩阵串行依赖，计算少、同步敏感。\\n• 昇腾诉求：状态驻留 L0/UB，双缓冲隐藏 handoff 等待。'],
 ['Finalize / output','\\(Y\\in\\mathbb{R}^{B\\times C\\times d}\\leftarrow XW_o\\)','\\(2dH d_v\\)','• 负载：输出投影 Dense GEMM。\\n• 昇腾诉求：CUBE + epilogue 融合，避免中间张量回写 HBM。'],
 ['训练 / Prefill 账本','\\(N_{seq}\\le1024,\\ C\\in\\{64,128\\}\\)','\\(\\approx2.1\\text{M/head/chunk}\\)','• 负载：并行 chunk + 状态 handoff。\\n• 昇腾诉求：Ascend C/CATLASS 按 CUBE/Vector overlap 验收。'],
 ['部署约束','\\(layout=BSND;\\ state\\in\\mathbb{R}^{d_k\\times d_v}\\)','\\(O(1)\\text{ handoff}\\)','• 负载：Prefill/Decode 形态差异大。\\n• 昇腾诉求：运行时暴露 initial_state/final_state，分别 tiling。']],
 'tb/wnqxwf25':[
 ['阶段','张量形状（LaTeX）','FLOPs（LaTeX）','负载特征 → 昇腾诉求'],
 ['短卷积','\\(X_t\\in\\mathbb{R}^{B\\times H\\times d_k},\\ k=4\\)','\\(\\approx4Hd_k\\text{/token}\\)','• 负载：小卷积、算术强度低。\\n• 昇腾诉求：Vector 与 gate/归一化融合，避免独立 kernel。'],
 ['门控 safe-gate','\\(g=-5\\cdot\\sigma(e^{A\\odot z})\\)','\\(O(Hd_k)\\)','• 负载：逐元素 Vector，指数与累加影响稳定性。\\n• 昇腾诉求：FP32 累加、安全 gate 与递归同核。'],
 ['KDA 递归','\\(S_t\\in\\mathbb{R}^{H\\times d_k\\times d_v}\\)','\\(\\approx3Hd_kd_v\\text{/token}\\)','• 负载：小矩阵 + token 间串行依赖。\\n• 昇腾诉求：S 驻留 L0/UB，减少 HBM 读写与同步。'],
 ['状态重建 replay','\\(D\\text{ 个草稿 token 的投影输入}\\)','\\(D\\times3Hd_kd_v\\)','• 负载：拒绝 token 的状态恢复，延迟敏感。\\n• 昇腾诉求：snapshot 与 speculative block 对齐，片上重建避免 HBM 读取。'],
 ['综合账本','\\(D=4;\\\\text{snapshot}\\approx24\\text{MB/layer/step}\\)','\\(\\text{replay}\\approx D\\times3Hd_kd_v\\)','• 负载：Decode memory/latency bound。\\n• 昇腾诉求：FULL_DECODE_ONLY + persistent graph，控制 SRAM 与 launch。']],
 'tb/gjutwb61':[
 ['阶段','张量形状（LaTeX）','FLOPs（LaTeX）','负载特征 → 昇腾诉求'],
 ['Inter-block pass','\\(R\\in\\mathbb{R}^{N\\times d},\\ N\\approx8\\)','\\(O(Nd)\\text{/layer}\\)','• 负载：批量读 block bank，访存主导。\\n• 昇腾诉求：Decode side stream，bank resident 时减少 reload。'],
 ['Intra-block mix','\\(w\\in\\mathbb{R}^{d},\\ B\\in\\mathbb{R}^{N\\times d}\\)','\\(O(Nd)\\)','• 负载：小 GEMM + softmax。\\n• 昇腾诉求：Vector softmax 与 CUBE mix 重叠，降低 launch。'],
 ['Prefill 通信','\\(\\operatorname{RS}+\\operatorname{AG},\\ B\\in\\mathbb{R}^{N\\times d}\\)','\\(\\text{按 block 聚合})\\','• 负载：跨卡聚合与 intra-block 并行。\\n• 昇腾诉求：HCCL RS+AG 与计算流水重叠。'],
 ['Resident / reload','\\(bank\\in\\mathbb{R}^{N\\times d}\\)','\\(126\\text{--}129\\text{KB/token})\\','• 负载：resident 节省带宽，reload 受 HBM 限制。\\n• 昇腾诉求：A5 resident、A3 reload 接入统一 cache manager。'],
 ['综合账本','\\(N=8,\\ L=1\\text{M}\\text{ context})\\','\\(O(Nd),\\text{ not }O(L^2d)\\)','• 负载：跨层状态访存和碎片主导。\\n• 昇腾诉求：同时监控 bytes/token、HCCL time 与内存碎片。']],
 'tb/hgv6dwfm':[
 ['阶段','张量形状（LaTeX）','FLOPs（LaTeX）','负载特征 → 昇腾诉求'],
 ['Router + 下投影融合','\\(X\\in\\mathbb{R}^{T\\times d}W\\in\\mathbb{R}^{d\\times(\\ell+E)}\\)','\\(2Td(\\ell+E)\\)','• 负载：单大 GEMM，CUBE 主导。\\n• 昇腾诉求：router+down 融合，省一次中间结果写回。'],
 ['路由专家 GEMM','\\(T_e\\times\\ell\\times h_e\\text{ per expert}\\)','\\(2T_e\\ell h_e\\)','• 负载：group GEMM；小 batch 易碎片化。\\n• 昇腾诉求：CUBE group GEMM + token-centric WarpDecode。'],
 ['上投影 + AG','\\(Y\\in\\mathbb{R}^{T\\times\\ell}W^\\uparrow+\\operatorname{all\mbox{-}gather}\\)','\\(2T\\ell d\\)','• 负载：上投影与 all-gather 串联。\\n• 昇腾诉求：latent-width all-to-all，HCCL 与 CUBE 重叠。'],
 ['Decode 权重流读','\\(W_e\\in\\mathbb{R}^{\\ell\\times h_e}\\text{ streamed}\\)','\\(\\approx0\\text{ arithmetic; memory-bound}\\)','• 负载：算术量低、权重带宽主导。\\n• 昇腾诉求：W4A8、预取、HBM 分片和权重驻留。'],
 ['综合账本','\\(\\ell=3584=0.5d;\\ topk=16+2\\)','\\(\\text{router+down}\\approx2Td(\\ell+E)\\)','• 负载：EP64 dispatch/combine + 权重流读。\\n• 昇腾诉求：联合看 payload/token、HBM 利用率与尾延迟。']]
};
for(const [tid,rs] of Object.entries(rows)){const t=p.resolve(tid);for(let r=0;r<rs.length;r++){for(let c=0;c<4;c++){const cell=t.getCell(r,c);cell.value=fix(rs[r][c]);try{cell.text.typeface=(c===1||c===2)?'Cambria Math':'微软雅黑'}catch{}try{cell.text.fontSize=r===0?9.2:(c===3?8.6:8.4)}catch{}}}}
const body=p.resolve('sh/sryl4zqx');body.text='KDA 用固定大小的递归状态 S_t 汇总历史 token；Decode 每步只读取并更新 S_t，不再逐 token 扫描整段 K/V cache。\nPrefill 仍在 chunk 内并行，Decode 状态更新为 O(1)，长上下文缓存压力转化为固定状态的读写压力。\n代价是 gate/递归的 Vector 计算与投影 CUBE 计算必须片上协同，状态驻留决定 Decode 吞吐。';body.text.fontSize=12;
await (await PresentationFile.exportPptx(p)).save(out);console.log(out);

