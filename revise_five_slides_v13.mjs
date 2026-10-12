import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {PresentationFile,FileBlob}=art;
const src='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v12.pptx';
const out='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v13.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const data=[
  {
    concl:'• 方法：用固定大小递归状态汇总历史，Decode 直接读写状态。\n• 效果：长上下文由 K/V 扫描转为 O(1) 状态更新与固定状态带宽。\n• 代价：瓶颈转向状态驻留、Vector/CUBE 协同与同步。',
    dev:'算子需求：KDA forward 需组织 gate、cumsum、delta rule、RMSNorm 的融合路径，暴露 initial_state/final_state，避免中间态回写。\n运行时需求：KV cache manager 增加 state slot；Prefill 使用 64/128 chunk，Decode 支持 persistent state；性能看 bytes/token、launch/token、CUBE/Vector overlap。\n趋势判断：长上下文优化指标从 FLOPs 转向 state bandwidth 与同步，KDA/MLA/AttnRes 需要统一 state-aware cache ABI。',
    table:[
      ['组件','张量形状','FLOPs/token','负载特征 → 昇腾诉求'],
      ['q/k/v 投影 + ShortConv ②','x∈ℝ⁷¹⁶⁸ → q,k∈ℝᴴ×ᵈₖ, v∈ℝᴴ×ᵈᵥ','2dH(2dₖ+dᵥ)','• Prefill 稠密 GEMM，计算密集，要求 CUBE 算力\n• Decode 退化为 GEMV，访存密集，要求通信带宽'],
      ['遗忘门 z + 写入 β ①','z=W_zx, β=W_βx; z∈ℝᴴ×ᵈₖ','≈ 2dr','• 低秩投影计算，要求 CUBE\n• sigmoid/exp 门控，要求 Vector 融合与稳定累加'],
      ['有界衰减 ①','g=−5·σ(eᴬ⊙z)','O(Hdₖ)','• 衰减计算为 Vector 逐元素负载，要求 FP32 累加\n• 累加存在数值风险，要求安全 gate，避免 BF16 下溢'],
      ['Chunk 内注意力','A=Tril((Q⊙Q_F)(K/K)ᵀ→p), C=64','2C(dₖ+dᵥ)','• Chunk tile matmul，计算密集，要求 CUBE\n• 64/128 tile，要求 L0/UB 双缓冲'],
      ['跨 chunk 状态传播 ①','Sₜ∈ℝᵈₖ×ᵈᵥ; Sₜ₊₁=F(Sₜ,Qₜ,Kₜ,Vₜ)','2dₖdᵥ','• 小矩阵递归，FLOPs 低但同步敏感，要求状态驻留\n• 状态更新与主计算并行，要求与 CUBE overlap'],
      ['综合账本','69 text 层; |S|≈3.0 MB/layer','≈2.1M FLOPs/head/chunk','• Decode 状态读写主导，要求低 bytes/token\n• 启动延迟敏感，要求 persistent kernel']
    ]
  },
  {
    concl:'• 方法：NoPE Gated MLA 负责全局内容检索，KDA 负责位置与递归记忆。\n• 效果：latent cache 压缩 KV 与通信，形成局部递归 + 全局注意力互补。\n• 代价：缓存、RoPE/NoPE 分支与并行通信需要统一调度。',
    dev:'缓存需求：latent page 与传统 KV page 分离，支持 NoPE 分支、KDA state checkpoint 的独立生命周期。\n算子需求：QK/AV absorption、RoPE/NoPE、output gate 提供融合 kernel；Decode 保留小 batch GEMV 路径。\n趋势判断：以 TP/PCP/DCP 通信、HCCL overlap、cache bytes/token 和 tail latency 建立分阶段基线。',
    table:[
      ['组件','张量形状','FLOPs/token','负载特征 → 昇腾诉求'],
      ['隐向量下投影 Wc','x∈ℝ⁷¹⁶⁸ → cₜ∈ℝ⁵¹²','2dd_c','• Prefill 矩阵宽，计算密集，要求 CUBE\n• Decode 矩阵变窄，要求权重驻留与批量 GEMV'],
      ['Q/K/V 投影与上投影','q:d→Hd_h; k,v:d_c→Hd_h','2dHd_h+4d_cHd_h','• 投影与 latent 重建，要求 CUBE\n• 吸收式计算减少 page 读取，要求融合中间回写'],
      ['NoPE 全局注意力','P=softmax(QKᵀ/√d_h); O=PV','2LHd_h','• Prefill QK/AV 随序列增长，要求 CUBE tile + 分块 softmax\n• Decode 受 cache 带宽约束，要求带宽与访存合并'],
      ['全秩输出门','g=σ(W_gx), W_g∈ℝᵈ×ᵈ','2d²','• 大 GEMM，Prefill 计算密集，要求 CUBE\n• Decode 小 batch GEMV 化，要求 epilogue 融合降 launch'],
      ['KV cache / 通信','c_KV∈ℝ⁵¹²','24.6 KB/token（BF16）','• latent page 读写，要求按 page 管理 cache\n• PCP/DCP 通信与 QK/AV 重叠，要求 HCCL overlap'],
      ['综合账本','24 text-MLA 层; r_q=1536, r_KV=512','按 layer 统计 QKᵀ/√d_h + AV','• KDA/MLA 产生两类状态，要求统一 state-aware cache\n• 跨 TP/PP 回收生命周期，要求可观测与可回收']
    ]
  },
  {
    concl:'• 方法：将 chunk 内矩阵计算、门控扫描与状态 handoff 融合成流水。\n• 效果：训练/Prefill 减少 staging、kernel launch 与跨核同步。\n• 关键约束：chunk 尺寸决定 CUBE 利用率与片上状态容量。',
    dev:'算子需求：将 gate、prepare、post-Wu、FwdH、Finalize 组织为物理 L0 kernel，并显式暴露 initial_state/final_state/gk。\n运行时需求：训练/Prefill 使用 chunk 64/128，Decode 固定 shape；记录 CUBE/Vector overlap、L1 命中率和 state handoff。\n趋势判断：FlashKDA 的收益来自 staging 与同步削减，需在 A3/A5 分别建立 kernel launch、L0 占用和端到端吞吐基线。',
    table:[
      ['阶段','张量形状','FLOPs/token','负载特征 → 昇腾诉求'],
      ['Gate + prepare','X∈ℝᴮ×ᴴ×ᶜ×ᵈₖ, C∈{64,128}','O(BHCdₖ)','• cumsum/衰减为 Vector 扫描，要求与 gate/prepare 融合\n• 中间态多次读写，要求 L0/UB staging 合并'],
      ['Chunk 内 A·V','Q,K∈ℝᶜ×ᵈₖ, V∈ℝᶜ×ᵈᵥ','2C(dₖ+dᵥ)','• tile matmul，计算密集，要求 CUBE\n• 64/128 tile 双缓冲，要求提升 CUBE 占用率'],
      ['跨 chunk handoff','Sₜ₊₁=F(Sₜ,Qₜ,Kₜ,Vₜ), S∈ℝᵈₖ×ᵈᵥ','2dₖdᵥ','• 小矩阵串行依赖，计算少、同步敏感，要求状态驻留\n• handoff 与主计算重叠，要求双缓冲隐藏等待'],
      ['Finalize / output','Y∈ℝᴮ×ᶜ×ᵈ ← XW_o','2dHdᵥ','• 输出投影为 Dense GEMM，要求 CUBE\n• 中间张量回写代价高，要求 epilogue 融合'],
      ['训练 / Prefill 账本','N_seq≤1024, C∈{64,128}','≈2.1M/head/chunk','• chunk 并行与状态 handoff 并存，要求 CUBE/Vector overlap\n• 长序列吞吐敏感，要求按 1024 逻辑序列验收'],
      ['部署约束','layout=BSND; state∈ℝᵈₖ×ᵈᵥ','O(1) handoff','• Prefill/Decode 形态差异大，要求分别 tiling\n• 状态跨 kernel 传递，要求 initial_state/final_state ABI']
    ]
  },
  {
    concl:'• 方法：把 ShortConv、safe-gate、递归更新与投机状态恢复放进固定 Decode 路径。\n• 效果：拒绝 token 只回滚未验证状态，减少重复计算与状态往返。\n• 关键约束：瓶颈从 FLOPs 转为 snapshot、SRAM 与启动延迟。',
    dev:'框架需求：对齐 use_kda_recoverssm、snapshot 粒度和 speculative block，统一处理部分拒绝、连续拒绝与跨 batch。\n算子需求：FULL_DECODE_ONLY 固化 shape，snapshot 优先留在 L0/UB；分别统计 7-token/5-token draft 的接受率、replay 流量和 SRAM 占用。\n趋势判断：推理路径从“每 token 重算”转向“状态恢复 + 小窗口 replay”，需要统一 KDA/MLA/AttnRes 的 speculative state 生命周期。',
    table:[
      ['阶段','张量形状','FLOPs','负载特征 → 昇腾诉求'],
      ['短卷积','Xₜ∈ℝᴮ×ᴴ×ᵈₖ, k=4','≈4Hdₖ/token','• 小卷积算术强度低，要求 Vector 与 gate/归一化融合\n• 独立 kernel 启动占比高，要求减少 launch'],
      ['门控 safe-gate','g=−5·σ(eᴬ⊙z)','O(Hdₖ)','• 逐元素 Vector，指数/累加影响稳定性，要求 FP32\n• 与递归更新同路径，要求安全 gate 融合'],
      ['KDA 递归','Sₜ∈ℝᴴ×ᵈₖ×ᵈᵥ','≈3Hdₖdᵥ/token','• 小矩阵 + token 间串行依赖，要求状态驻留 L0/UB\n• HBM 往返决定时延，要求减少读写与同步'],
      ['状态重建 replay','D 个草稿 token 的投影输入','D×3Hdₖdᵥ','• 拒绝 token 触发状态恢复，要求 snapshot 与 speculative block 对齐\n• replay 延迟敏感，要求片上重建避免 HBM 读取'],
      ['综合账本','D=4; snapshot≈24 MB/layer/step','replay≈D×3Hdₖdᵥ','• Decode memory/latency bound，要求 FULL_DECODE_ONLY\n• 启动次数敏感，要求 persistent graph 控制 SRAM 与 launch']
    ]
  },
  {
    concl:'• 方法：把深层残差组织成 8 个 block bank，并将 bank 聚合与块内计算拆成两阶段。\n• 效果：复杂度由随深度累积转为随 bank 数量增长，Decode 通信可由 side stream 隐藏。\n• 关键约束：bank 的 resident/reload 生命周期成为新的系统状态。',
    dev:'算子需求：attn_res_fwd 融合 BF16 add、bank mix、RMSNorm 与 writeback，并提供 RESIDENT/RELOAD 两种 tiling。\n通信需求：Prefill 采用 RS+AG，Decode 使用 side stream；bank 的 PP/TP 切分与回收接入统一 cache manager。\n趋势判断：AttnRes 引入跨层状态访存，验收需同时看 HCCL overlap、带宽、resident 命中率和内存碎片。',
    table:[
      ['阶段','张量形状','FLOPs','负载特征 → 昇腾诉求'],
      ['Inter-block pass','R∈ℝᴺ×ᵈ, N≈8','O(Nd)/layer','• 批量读取 block bank，访存主导，要求 Decode side stream\n• bank resident 可减少 reload，要求常驻布局'],
      ['Intra-block mix','w∈ℝᵈ, B∈ℝᴺ×ᵈ','O(Nd)','• 小 GEMM + softmax，要求 Vector softmax 与 CUBE mix 重叠\n• 小算子 launch 敏感，要求融合执行'],
      ['Prefill 通信','RS + AG, B∈ℝᴺ×ᵈ','按 block 聚合','• 跨卡聚合与块内计算并行，要求 HCCL RS+AG overlap\n• 通信尾延迟敏感，要求流水化 handoff'],
      ['Resident / reload','bank∈ℝᴺ×ᵈ','126–129 KB/token','• resident 节省带宽，要求 A5 常驻\n• reload 受 HBM 限制，要求 A3 走带宽优化'],
      ['综合账本','N=8, L=1M context','O(Nd)，非 O(L²d)','• 跨层状态访存和碎片主导，要求统一 cache manager\n• 长上下文收益取决于 bytes/token 与 HCCL time']
    ]
  }
];
const tableIds=['tb/lwfe1cbi','tb/xgfq5cbi','tb/j6ps72lo','tb/wnqxwf25','tb/gjutwb61'];
const conclIds=['sh/sryl4zqx','sh/w3i1sfa9','sh/pcjqtg36','sh/sna103ap','sh/032tgr6d'];
const devIds=['sh/ipovexwn','sh/ahwrqhgj','sh/v6l4jq94','sh/w72947yt','sh/k7mxovud'];
for(let i=0;i<5;i++){
  p.resolve(conclIds[i]).text=data[i].concl;
  p.resolve(devIds[i]).text=data[i].dev;
  const t=p.resolve(tableIds[i]);
  for(let r=0;r<data[i].table.length;r++) for(let c=0;c<4;c++) t.getCell(r,c).value=data[i].table[r][c];
}
p.slides.keep([0,1,2,3,4]);
await (await PresentationFile.exportPptx(p)).save(out);console.log(out);
