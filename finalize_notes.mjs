import {pathToFileURL} from 'node:url';const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);const {PresentationFile,FileBlob}=art;
const src='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-calibrated-v2.pptx';
const out='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const tableIds=['tb/lwfe1cbi','tb/xgfq5cbi','tb/j6ps72lo','tb/wnqxwf25','tb/gjutwb61','tb/hgv6dwfm'];
for(const id of tableIds){const t=p.resolve(id);for(let r=1;r<t.rows.length;r++){const cell=t.getCell(r,3);let v=String(cell.value??'');v=v.replace(/• 负载：/g,'• ').replace(/• 昇腾诉求：/g,'').replace(/• 工程推论：/g,'').replace(/\n• /g,'；');cell.value=v;}}
const notes=[
'论文结论（§2.1.1、§5.1.1、§5.1.2）：KDA 使用固定大小递归状态；FlashKDA 重叠 chunk 内计算与跨 chunk 状态传播；KCP 使用固定大小状态片段、all-gather 和 prefix scan。g_min=-5 使 causal tile 可统一使用 Tensor Core。\n工程推论：表格中关于 CUBE/Vector overlap、L0/UB 驻留、state bytes/token 和 prefix cache 的昇腾实现建议，是基于上述论文机制与 vLLM/vLLM-Ascend 代码做的适配判断。',
'论文结论（§2.1.2、§5.1.1）：K3 MLA 缓存低维 latent，采用 NoPE；训练 attention output 保持 FP32，并与 KV staging overlap。\n工程推论：关于 latent page、RoPE/NoPE 分支、CUBE/带宽分工和 cache 生命周期的昇腾建议，是结合实现路径做的工程判断。',
'论文结论（§5.1.1、§5.1.2）：FlashKDA 为 CUTLASS chunkwise kernel，重叠 intra-chunk 与 cross-chunk 状态传播；KDA CP 通过 segment transition 和 prefix scan 扩展长上下文。\n工程推论：关于 Ascend C/CATLASS、L0 staging、idle SM 和通信验收指标的内容，是面向昇腾的适配建议。',
'论文结论（§5.4.2）：Decode 缓存 projected inputs，片上重建已接受状态，并将 short convolution、normalization、gating、recurrence、output normalization 融合。\n工程推论：关于 FULL_DECODE_ONLY、persistent kernel、片上 snapshot/replay 和状态生命周期的内容，是结合 vLLM/vLLM-Ascend 的工程建议。',
'论文结论（§2.2、§5.4.2）：Block AttnRes 将开销由 O(Ld) 降为 O(Nd)；Prefill 采用 sequence-parallel RS+AG，Decode 使用 side stream 并融合 intra-block phase。\n工程推论：关于 resident/reload、cache manager、HCCL overlap 和内存碎片监控的内容，是昇腾部署适配判断。',
'论文结论（§5.2.1、§5.4.2）：LatentMoE 融合 latent down-projection 与 router，将 all-gather 融入 GEMM epilogue；小 batch 使用 token-centric WarpDecode；MoonEP 提供平衡负载与静态 shape。\n工程推论：关于 fused router/down、W4A8 预取、EP overlap、HBM 和尾延迟联合验收的内容，是面向昇腾推理的工程建议。'
];
for(let i=0;i<6;i++){const s=p.slides.items[i];s.speakerNotes.text=notes[i];try{s.speakerNotes.setVisible(true)}catch{}}
await (await PresentationFile.exportPptx(p)).save(out);console.log(out);
