import {pathToFileURL} from "node:url";
const art=await import(pathToFileURL("C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs").href);
const {PresentationFile,FileBlob}=art;
const src="C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v14.pptx";
const out="C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v18.pptx";
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const conclusions=[
`KDA 用固定大小的递归状态 S_t 汇总历史 token；Decode 每步只读取并更新 S_t，不再逐 token 扫描整段 K/V cache。\nPrefill 仍在 chunk 内并行，Decode 状态更新为 O(1)，长上下文缓存压力转化为固定状态的读写压力。\n代价是 gate/递归的 Vector 计算与投影 CUBE 计算必须片上协同，状态驻留决定 Decode 吞吐。`,
`Gated MLA 以 NoPE 保留全局内容检索，把位置信息交给 KDA，形成“局部递归 + 全局注意力”的互补结构。\n低秩 latent cache 显著降低 KV 存储与通信，长上下文收益主要来自 cache 压缩与吸收式计算。\n代价是 latent page、RoPE/NoPE 分支和 TP/PCP/DCP 调度需要统一，Decode 更偏 GEMV 与带宽受限。`,
`FlashKDA 将 chunk 内 matmul、门控扫描和跨 chunk 状态传播融合为流水，目标是把训练/Prefill 从多次往返变成一次状态 handoff。\nCUBE 承担主要矩阵乘，Vector 承担衰减、cumsum 和小矩阵更新；chunk 64/128 是吞吐与片上存储的折中。\n核心效果是减少 kernel launch 和 L0 staging，最终收益取决于 CUBE/Vector overlap 与状态连续性。`,
`KDA Decode 将 ShortConv、gate、递归更新和输出投影合并，目标是降低单 token 的启动次数与状态往返。\nRecoverSSM 让投机解码只回滚未验证状态，减少拒绝 token 的重复计算。\n瓶颈从 FLOPs 转为状态快照、片上 SRAM 和 persistent graph 的时延，算子必须围绕固定 decode shape 设计。`,
`AttnRes 把深层残差从逐层累积改成 8 个 block bank 的可学习检索，降低深度维注意力的复杂度。\nPrefill 可以把 bank 聚合与 intra-block 计算拆开并行，Decode 通过 side stream 隐藏通信。\n核心收益是跨层信息复用，核心风险是 bank 的 resident/reload 生命周期和 HCCL/内存碎片。`
];
const notes=[
`本页讲解：左图从输入 x 开始，先经过 q/k/v 投影与 ShortConv，对应右表第 1 行。红框①对应遗忘门 z 与写入 β，以及有界衰减/cumsum，对应第 2、3 行；chunk 内注意力对应第 4 行；跨 chunk 的状态 S_t 更新对应第 5 行；右侧层堆叠与状态账本对应第 6 行。\n\n概念：KDA 用固定大小的递归状态汇总历史。Prefill 仍按 chunk 并行，Decode 只读写固定状态，因此长上下文不再逐 token 扫描整段 K/V。\n\n开发思考：算子侧融合 gate、cumsum、delta rule、RMSNorm，避免中间态落 HBM；运行时把 state slot 纳入 cache manager，优先优化 state bytes/token、状态驻留与 persistent kernel。表格公式已恢复为可编辑的数学文本。`,
`本页讲解：左图红框①是 Gated MLA 主注意力路径，对应右表第 3 行；底部隐向量下投影 Wc 与上投影对应第 1、2 行；右侧输出门对应第 4 行；latent KV cache 与通信对应第 5 行；综合账本对应第 6 行。\n\n概念：NoPE Gated MLA 负责全局内容检索，KDA 负责位置与递归记忆。低秩 latent cache 压缩 KV 存储和通信，形成局部递归与全局注意力互补。\n\n开发思考：缓存管理需要把 latent page、传统 KV page 和 KDA checkpoint 分开管理；算子侧优先融合 QK/AV absorption、RoPE/NoPE 与 output gate；推理侧围绕 TP/PCP/DCP 通信、HCCL overlap 与 tail latency 建立基线。表格公式保持可编辑文本。`,
`本页讲解：左图上半部分的 gate/prepare 对应右表第 1 行；chunk 内 QK/AV 矩阵计算对应第 2 行；跨 chunk handoff 对应第 3 行；Finalize/output 对应第 4 行；训练/Prefill 账本和部署约束对应第 5、6 行。\n\n概念：FlashKDA 把 chunk 内矩阵计算、门控扫描和状态 handoff 组织成流水，CUBE 处理主矩阵乘，Vector 处理衰减、cumsum 和小矩阵更新。\n\n开发思考：将 gate、prepare、post-Wu、FwdH、Finalize 组织成物理 L0 kernel，显式暴露 initial_state/final_state/gk；Prefill 使用 64/128 chunk，Decode 固定 shape，并用 CUBE/Vector overlap、L0 占用和状态 handoff 衡量收益。表格公式保持可编辑文本。`,
`本页讲解：左图的短卷积对应右表第 1 行，safe-gate 对应第 2 行，KDA 递归状态对应第 3 行；投机解码中的状态重建 replay 对应第 4 行；综合账本对应第 5 行。\n\n概念：KDA Decode 将 ShortConv、gate、递归更新和输出投影放入固定路径；RecoverSSM 只回滚未验证状态，减少拒绝 token 的重复计算。\n\n开发思考：框架侧对齐 use_kda_recoverssm、snapshot 粒度和 speculative block；算子侧固化 FULL_DECODE_ONLY shape，让 snapshot 留在 L0/UB；验收同时观察接受率、replay 流量、SRAM 占用和启动延迟。表格公式保持可编辑文本。`,
`本页讲解：左图上方的 inter-block pass 对应右表第 1 行，intra-block mix 对应第 2 行；Prefill 通信链路 RS+AG 对应第 3 行；bank 的 resident/reload 对应第 4 行；右表综合账本对应第 5 行。\n\n概念：AttnRes 把深层残差组织成 8 个 block bank。Prefill 将 bank 聚合和块内计算拆开并行，Decode 用 side stream 隐藏通信，收益来自跨层信息复用。\n\n开发思考：算子侧融合 BF16 add、bank mix、RMSNorm 和 writeback，并提供 RESIDENT/RELOAD tiling；通信侧把 RS+AG、side stream 和 bank 回收接入统一 cache manager；验收同时看 HCCL overlap、带宽、resident 命中率和内存碎片。表格公式保持可编辑文本。`
];
const ids=['sh/sryl4zqx','sh/w3i1sfa9','sh/pcjqtg36','sh/sna103ap','sh/032tgr6d'];
for(let i=0;i<5;i++){const sh=p.resolve(ids[i]); if(sh)sh.text=conclusions[i]; p.slides.items[i].speakerNotes.text=notes[i];}
p.slides.keep([0,1,2,3,4]);
await (await PresentationFile.exportPptx(p)).save(out); console.log(out);

