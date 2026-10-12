import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {PresentationFile,FileBlob}=art;
const src='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12.pptx';
const out='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-calibrated.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const concl={
0:'KDA 用线性递归替代长序列 KV 读取，把长上下文瓶颈转移到固定大小的状态带宽。\nPrefill 保持 chunk 内并行，Decode 的状态更新为 O(1)，同时减少随上下文增长的缓存压力。\n代价是 gate/递归的 Vector 计算与投影 CUBE 计算必须在片上协同，状态驻留决定 Decode 吞吐。',
1:'Gated MLA 以 NoPE 保留全局内容检索，把位置信息交给 KDA，形成“局部递归 + 全局注意力”的互补结构。\n低秩 latent cache 显著降低 KV 存储与通信，长上下文收益主要来自 cache 压缩与吸收式计算。\n代价是 latent page、RoPE/NoPE 分支和 TP/PCP/DCP 调度需要统一，Decode 更偏 GEMV 与带宽受限。',
2:'FlashKDA 将 chunk 内 matmul、门控扫描和跨 chunk 状态传播融合为流水，目标是把训练/Prefill 从多次往返变成一次状态 handoff。\nCUBE 承担主要矩阵乘，Vector 承担衰减、cumsum 和小矩阵更新；chunk 64/128 是吞吐与片上存储的折中。\n核心效果是减少 kernel launch 和 L0 staging，最终收益取决于 CUBE/Vector overlap 与状态连续性。',
3:'KDA Decode 将 ShortConv、gate、递归更新和输出投影合并，目标是降低单 token 的启动次数与状态往返。\nRecoverSSM 让投机解码只回滚未验证状态，减少拒绝 token 的重复计算。\n瓶颈从 FLOPs 转为状态快照、片上 SRAM 和 persistent graph 的时延，算子必须围绕固定 decode shape 设计。',
4:'AttnRes 把深层残差从逐层累积改成 8 个 block bank 的可学习检索，降低深度维注意力的复杂度。\nPrefill 可以把 bank 聚合与 intra-block 计算拆开并行，Decode 通过 side stream 隐藏通信。\n核心收益是跨层信息复用，核心风险是 bank 的 resident/reload 生命周期和 HCCL/内存碎片。',
5:'LatentMoE 先在隐空间完成路由与专家计算，再恢复到模型维度，以较低通信 payload 换取高稀疏容量。\nlatent 宽度约减半 EP dispatch/combine 流量，但 Decode 的主瓶颈转向专家权重流式读取与小 batch group GEMM。\n落地关键是 latent-aware EP、token-centric decode 和 CUBE/HBM/HCCL 的联合调优。'
};
const dev={
0:'算子结论：把 gate、cumsum、delta rule、RMSNorm 合并进同一 L0/UB pipeline，避免 Python 调度和中间张量落 HBM。\n运行时结论：Prefill 采用 64/128 chunk 双缓冲，Decode 将 S 纳入 KV cache 预算并支持状态驻留；监控 bytes/token、launch/token、CUBE 利用率和 Vector overlap。\n趋势判断：KDA 优化重点将从 FLOPs 转向状态带宽与同步，后续需要统一 KDA/MLA/AttnRes 的 state-aware cache 生命周期。',
1:'框架结论：AscendMLABackend 需要同时管理 latent page、NoPE 分支和 KDA state checkpoint，不能只复用标准 MLA KV cache。\n算子结论：投影、吸收式 QK/AV、RoPE/NoPE 分支分别测量，优先让大 GEMM 落 CUBE，小 batch Decode 走低启动开销路径。\n趋势判断：以 TP/PCP/DCP 通信、HCCL time、cache bytes/token 和 tail latency 建立分阶段基线，再评估 A5 resident cache。',
2:'算子结论：将 gate、prepare、post-Wu、FwdH、Finalize 合并为物理 L0 kernel，并显式暴露 initial_state/final_state/gk。\n运行时结论：训练/Prefill 使用 chunk 64/128，Decode 使用固定 shape；对 1024 逻辑序列分别统计 CUBE/Vector overlap、L1 命中率和状态 handoff。\n趋势判断：FlashKDA 的竞争力不在单算子 FLOPs，而在融合后减少 staging、launch 和跨核同步，A3/A5 应分别 benchmark。',
3:'框架结论：将 use_kda_recoverssm、snapshot 粒度和 speculative block 对齐，统一处理部分拒绝、连续拒绝和跨 batch。\n算子结论：FULL_DECODE_ONLY 固化 shape，状态快照优先留在 L0/UB；7-token/5-token draft 分别测接受率、replay 流量和 SRAM 占用。\n趋势判断：从“每 token 重算”转向“状态恢复 + 小窗口 replay”，需要统一 KDA/MLA/AttnRes 的 speculative 生命周期。',
4:'算子结论：attn_res_fwd 合并 BF16 add、bank mix、RMSNorm、writeback，并提供 RESIDENT/RELOAD 两种 tiling。\n通信结论：Prefill 采用 RS+AG，Decode 用 side stream；bank 的 PP/TP 切分和回收必须接入统一 cache manager。\n趋势判断：AttnRes 将新增跨层访存模式，验收不能只看 FLOPs，还要看 HCCL overlap、带宽和内存碎片。',
5:'算子结论：融合 latent router、top-k、SiTU-GLU、group GEMM、epilogue combine，优先优化小 batch token-centric WarpDecode。\n框架结论：EP64、latent-width all-to-all、W4A8 解量化和 HBM 分片要可观测，拆分 router/dispatch/expert/combine 四段测量。\n趋势判断：通信减半后 Decode 更可能受权重带宽主导，后续应以 payload/token、tokens/s、HBM 利用率和尾延迟联合验收。'
};
const tables=[
['tb/lwfe1cbi',[
['组件','张量形状','FLOPs/token','负载特征 → 昇腾诉求'],
['q/k/v 投影 + ShortConv','x ∈ ℝ^7168 → q,k ∈ ℝ^(H·dk), v ∈ ℝ^(H·dv)','2dH(2dk+dv)','• Prefill：Dense GEMM，CUBE 主导\n• Decode：GEMV/访存主导'],
['遗忘门 z + 写入 β','d→r→H·dk；d→H','≈2dr','• σ/exp 与归一化：Vector\n• 结论：与递归融合降低 launch'],
['有界衰减','g = −5·σ(e^(A·z))','O(H·dk)','• 逐元素 Vector\n• 结论：FP32 累加保证稳定'],
['Chunk 内注意力','A = Tril((Q⊙QF)(K/K)^T)，C=64','2C(dk+dv)','• tile matmul：CUBE\n• 结论：64/128 chunk 平衡占用'],
['跨 chunk 状态传播','S ∈ ℝ^(dk×dv)','2dkdv','• 小矩阵 + 串行依赖\n• 结论：L0/UB 常驻 S'],
['综合账本','69 层；S≈3.0MB/layer','≈2.1M FLOPs/head/chunk','• Decode 受状态带宽限制\n• 结论：CUBE/Vector overlap']]],
['tb/xgfq5cbi',[
['组件','张量形状','FLOPs/token','负载特征 → 昇腾诉求'],
['隐向量下投影 Wc','x ∈ ℝ^7168 → cₜ ∈ ℝ^512','2d·dc','• Dense GEMM：CUBE\n• 结论：Decode 退化 GEMV'],
['Q/K/V 投影与上投影','q:d→H·dh；k,v:dc→H·dh','2dHdh + 4dcHdh','• 吸收式计算减少 KV 读取\n• 结论：上投影仍是 CUBE 热点'],
['NoPE 全局注意力','QKᵀ/√dh；softmax；AV','2L·H·dh','• Prefill 受序列长度影响\n• 结论：NoPE 避免 RoPE 分支'],
['全秩输出门','g = σ(Wg x)','2d²','• 大 GEMM：CUBE\n• 结论：Decode 偏 GEMV/带宽'],
['KV cache / 通信','cₖᵥ ∈ ℝ^512','24.6KB/token（BF16）','• latent page + PCP/DCP\n• 结论：cache/通信约降至 d 域约 1/2'],
['综合账本','24 MLA 层；q_lora=1536','按 layer 统计 QKᵀ/AV','• 混合 state-aware cache\n• 结论：需统一回收与跨 TP 生命周期']]],
['tb/j6ps72lo',[
['阶段','张量形状','FLOPs/token','负载特征 → 昇腾诉求'],
['Gate + prepare','[B,H,C,dk]；C=64/128','O(BH C dk)','• cumsum/衰减：Vector\n• 结论：与 L0 staging 融合'],
['Chunk 内 A·V','[C,dk]×[dk,C]×[C,dv]','2C(dk+dv)','• tile matmul：CUBE\n• 结论：占用率决定吞吐'],
['跨 chunk handoff','Sₜ₊₁ = F(Sₜ, Q,K,V)','2dkdv','• 小矩阵串行依赖\n• 结论：双缓冲隐藏等待'],
['Finalize / output','[B,H,C,dv]→[B,C,d]','2d·H·dv','• Dense projection：CUBE\n• 结论：避免中间张量回写'],
['训练 / Prefill 账本','最多 1024 逻辑序列','≈2.1M/head/chunk','• 参考 Triton 路径\n• 结论：Ascend C/CATLASS 需按硬件验收'],
['部署约束','BSND；raw/activated log gate','状态 handoff 一次','• 运行时暴露 initial/final state\n• 结论：Prefill/Decode 分 tiling']]],
['tb/wnqxwf25',[
['阶段','张量形状','FLOPs','负载特征 → 昇腾诉求'],
['短卷积','[B,H,dk]×4','≈4dkH/token','• 小卷积：Vector\n• 结论：必须融合'],
['门控 safe-gate','g = −5·σ(e^(A·z))','O(Hdk)','• 逐元素 Vector\n• 结论：与递归同核'],
['KDA 递归','S:[H,dk,dv]，逐 token 串行','≈3Hdkdv/token','• 小矩阵 + 状态驻留\n• 结论：L0/UB 优先'],
['状态重建 replay','D 个草稿的投影输入','D×3Hdkdv','• 片上重建避免 HBM 读\n• 结论：snapshot 对齐 speculative block'],
['综合账本','D=4；24MB/layer/step','replay≈D×3Hdkdv','• Decode memory/latency bound\n• 结论：FULL_DECODE_ONLY + persistent graph']]],
['tb/gjutwb61',[
['阶段','张量形状','FLOPs','负载特征 → 昇腾诉求'],
['Inter-block pass','[N,d]，N≈8','O(Nd)/layer','• 访存为主\n• 结论：Decode side stream'],
['Intra-block mix','[B,d]×[N,d]','O(Nd)','• 小 GEMM + softmax\n• 结论：与通信重叠'],
['Prefill 通信','RS + AG；9 个 block 表示','按 block 聚合','• HCCL 通信\n• 结论：RS+AG 与计算流水'],
['Resident / reload','bank ∈ ℝ^(N×d)','126–129KB/token','• A5 resident；A3 reload\n• 结论：接入 cache manager'],
['综合账本','8 blocks；1M context','O(Nd)，不随 L² 增长','• 访存与碎片为主\n• 结论：监控 bytes/token、HCCL time']]],
['tb/hgv6dwfm',[
['阶段','张量形状','FLOPs','负载特征 → 昇腾诉求'],
['Router + 下投影融合','[T,d]×[d,ℓ+E]','2T·d·(ℓ+E)','• 单 GEMM：CUBE\n• 结论：省中间结果写回'],
['路由专家 GEMM','每专家 [Tₑ,ℓ]×[ℓ,hₑ]','2Tₑℓhₑ','• group GEMM：CUBE\n• 结论：小 batch 需 token-centric'],
['上投影 + AG','[T,ℓ]×[ℓ,d] + all-gather','2Tℓd','• multimerge + HCCL\n• 结论：latent all-to-all'],
['Decode 权重流读','每专家 3·ℓ·hₑ 权重','≈0（纯访存）','• memory-bound\n• 结论：W4A8 + 预取'],
['综合账本','ℓ=3584=0.5d；top-16+2','router+down≈2T·d(ℓ+E)','• EP64 / HBM 主导\n• 结论：payload/token 与尾延迟联合验收']]]
];
for(let i=0;i<6;i++){
 const s=p.slides.items[i];
 const bodyId=[ 'sh/sryl4zqx','sh/w3i1sfa9','sh/pcjqtg36','sh/sna103ap','sh/032tgr6d','sh/7m98ru9g'][i];
 const devId=[ 'sh/ipovexwn','sh/ahwrqhgj','sh/v6l4jq94','sh/w72947yt','sh/k7mxovud','sh/5svutgni'][i];
 p.resolve(bodyId).text=concl[i]; p.resolve(bodyId).text.fontSize=12; p.resolve(bodyId).text.bold=true;
 p.resolve(devId).text=dev[i]; p.resolve(devId).text.fontSize=13.2; p.resolve(devId).text.bold=true;
}
for(const [tid,rows] of tables){const t=p.resolve(tid);for(let r=0;r<rows.length;r++){for(let c=0;c<rows[r].length;c++){const cell=t.getCell(r,c);cell.value=rows[r][c];try{cell.text.fontSize=r===0?9.5:9.2}catch{}try{cell.text.typeface='微软雅黑'}catch{}}}}
await (await PresentationFile.exportPptx(p)).save(out);console.log(out);
