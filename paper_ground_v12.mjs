import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {PresentationFile,FileBlob}=art;
const src='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-calibrated-v2.pptx';
const out='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-paper-grounded.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const dev={
'sh/ipovexwn':'论文明确（§5.1.1/§5.1.2）：KDA 用固定状态 S 替代增长 KV cache；FlashKDA 重叠 chunk 内计算与跨 chunk 状态传播，KCP 用固定大小 all-gather + prefix scan 同步状态。\n论文明确（§2.1.1）：g_min=−5 使 16-token tile 的累计 log-decay 落在 (−80,0)，因而 causal tiles 可统一走 dense Tensor Core。\n工程推论：昇腾需融合 KDA kernel、CP 与 state-aware prefix cache，验收看 state bytes/token、通信时延与 CUBE/Vector overlap。',
'sh/ahwrqhgj':'论文明确（§2.1.2/§5.1.1）：NoPE 避免扩展上下文时重调 RoPE/YaRN；训练 attention output 保持 FP32，并将输出 tile 与 KV staging overlap。\n论文明确（§2.1.2）：MLA 缓存低维 cₜ，再通过上投影恢复 K/V；全秩 gate 对全局注意力通道做 token 级调制。\n工程推论：Ascend 需统一 latent page、NoPE 分支和 FP32 tile 的 cache/调度，分别测量 CUBE、KV 带宽和片上 footprint。',
'sh/v6l4jq94':'论文明确（§5.1.1）：FlashKDA 是 CUTLASS-based chunkwise kernel，独立调度 token-parallel 与 head-parallel recurrence，并作为 flash-linear-attention backend 自动分派。\n论文明确（§5.1.1/§5.1.2）：长上下文 Prefill 采用 intra-device CP；跨设备 KCP 交换固定大小状态片段并做 prefix scan。\n工程推论：昇腾实现应把 chunk、state handoff、CP planner 作为一体化路径验收，重点看 idle SM、all-gather 和 L0 staging。',
'sh/w72947yt':'论文明确（§5.4.2）：Decode 只缓存 draft token 的 projected inputs，在片上重建已接受状态；replay、bonus token 与下一窗口共用 fused recurrent loop。\n论文明确（§5.4.2）：融合 short convolution、input normalization、gating、KDA recurrence、output normalization，验证延迟随 token 数次线性增长。\n工程推论：昇腾需固定 decode shape、片上 snapshot/replay 和 persistent kernel，并将 prefix cache 与 projected-input cache 生命周期对齐。',
'sh/k7mxovud':'论文明确（§2.2/§5.4.2）：Block AttnRes 将开销从 O(Ld) 降到 O(Nd)，Kimi K3 采用约 8 个 block；Prefill 用 sequence-parallel 的 RS+AG。\n论文明确（§5.4.2）：Decode 将 inter-block pass 放到 side stream，并把 intra-block merge、partial-sum update、RMSNorm 融入 TP all-reduce。\n工程推论：昇腾需实现 resident/reload 两种 bank 路径，验收 HCCL overlap、bank bytes/token 和内存碎片。',
'sh/5svutgni':'论文明确（§5.4.2）：LatentMoE 融合 latent down-projection 与 router，将 all-gather 融入 GEMM epilogue，并与 shared-expert 计算重叠。\n论文明确（§5.4.2/§5.2.1）：小 batch routed expert 采用 token-centric WarpDecode；MoonEP 用完美负载平衡和静态 shape 消除 host sync。\n工程推论：昇腾需落地 fused router/down、W4A8 权重预取、EP 通信 overlap 与静态 group-GEMM，联合看 payload/token、HBM 和尾延迟。'
};
const srcNotes={
'sh/547294r6':'资料来源：Kimi K3 Technical Report §2.1.1 / §5.1.1 / §5.1.2；vllm / vllm-ascend 代码仓',
'sh/9072xkry':'资料来源：Kimi K3 Technical Report §2.1.2 / §5.1.1；vllm / vllm-ascend 代码仓',
'sh/cza94vmx':'资料来源：Kimi K3 Technical Report §5.1.1 / §5.1.2；FlashKDA / vllm-ascend ops/triton/kda',
'sh/1cj2d8b6':'资料来源：Kimi K3 Technical Report §5.4.2（KDA）；ReplaySSM；vllm-ascend ops/triton/kda',
'sh/dgbulwnm':'资料来源：Kimi K3 Technical Report §2.2 / §5.4.2（Block AttnRes）',
'sh/yhg7epsj':'资料来源：Kimi K3 Technical Report §2.3 / §5.2.1 / §5.4.2（Stable LatentMoE）'
};
for(const [id,text] of Object.entries(dev)){const o=p.resolve(id);o.text=text;try{o.text.fontSize=11.7}catch{}}
for(const [id,text] of Object.entries(srcNotes)){const o=p.resolve(id);o.text=text;try{o.text.fontSize=9.5}catch{}}
await (await PresentationFile.exportPptx(p)).save(out);console.log(out);
