import {pathToFileURL} from 'node:url';const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);const {PresentationFile,FileBlob}=art;const f='D:/kimi_k3_workspace/kimi_k3_arch_analysis/kimi_k3_with_comments_boss_style.pptx';const p=await PresentationFile.importPptx(await FileBlob.load(f));
const ids=['sh/v6tsv2xo','sh/j6dwfqds','sh/47mt0b6x','sh/25ojml43','sh/1k7edwv2','sh/do3id4fy'];for(const id of ids){const o=p.resolve(id);try{o.fill='none'}catch{}try{o.line={fill:'none',width:0}}catch{}}
const bodyText={
'sh/sna103ap':'69 KDA + 24 MLA / 93 层；KDA 采用 ShortConv + 逐通道门控 Delta 递归，解码状态更新为 O(1)。\n每 token 主负载是 q/k/v 投影与状态更新：投影映射 CUBE，gate/cumsum/递归映射 Vector。\n昇腾重点是 gate–cumsum–delta 融合、L0 常驻状态与 64/128 chunk；Prefill 偏算力，Decode 偏带宽与启动延迟。',
'sh/032tgr6d':'24 层采用 NoPE Gated MLA；KDA 提供位置与 recency，MLA 保留全局内容检索。\nkv_lora_rank=512、q_lora_rank=1536，KV cache 显著收缩；Decode 从 GEMM 转向 GEMV 与访存主导。\n昇腾重点是 latent cache 排布、RoPE / NoPE 分支、TP/PCP/DCP 叠加；投影与上采样仍是 CUBE 热点。',
'sh/7m98ru9g':'Chunkwise 训练 / Prefill 将 A·V matmul 与衰减、cumsum、跨 chunk 状态传播流水化。\nCUBE 负责 tile matmul，Vector 负责衰减、scan 与状态更新；64/128 chunk 在占用率和状态流量之间折中。\n昇腾需要单物理 L0 融合路径，避免多次 staging；Prefill 偏 CUBE，Decode 仍受带宽与 launch 延迟约束。',
'sh/l0vuh0rm':'Fuses ShortConv、gate、递归状态和输出投影，减少每 token kernel launch 与状态往返。\nRecoverSSM 只回滚未验证 draft token；snapshot 粒度必须与 speculative block 对齐。\n昇腾重点是 persistent decode graph、L0/UB 状态快照及 Vector+CUBE overlap；Decode 主要受访存和时延限制。',
'sh/sjix0zy1':'8 个 block-level residual bank 替代全深度残差注意力，softmax 只在 block state 上检索。\nInter-block pass 是 O(N·d) 访存，intra-block mix 是小 GEMM；通信可与 Decode 侧路重叠。\n昇腾需要 RESIDENT/RELOAD、Prefill 的 RS+AG、Decode side-stream，以及确定性 bank 排布。',
'sh/ofq5svm5':'先将 d=7168 压到 latent ℓ=3584，再路由 896 专家中的 top-16，并叠加 2 个 shared expert。\nlatent 宽度使 EP dispatch/combine 字节量约降 2×；group GEMM 是 CUBE 热点，router/top-k 更偏 Vector 与时延。\n昇腾需要 latent-aware EP、token-centric WarpDecode，以及 router→SiTU→combine 融合和量化 latent cache.'};
for(const [id,txt] of Object.entries(bodyText)){const o=p.resolve(id);if(o)o.text=txt}
await (await PresentationFile.exportPptx(p)).save(f);console.log('patched');
