import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {PresentationFile,FileBlob}=art;
const src='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v11.pptx';
const out='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v12.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const t=p.resolve('tb/lwfe1cbi');
const demand=[
'• Prefill 稠密 GEMM，计算密集，要求 CUBE 算力\n• Decode 退化为 GEMV，访存密集，要求通信带宽',
'• 低秩投影计算，要求 CUBE\n• sigmoid/exp 门控，要求 Vector 融合与稳定累加',
'• 衰减计算为 Vector 逐元素负载，要求 FP32 累加\n• 累加存在数值风险，要求安全 gate，避免 BF16 下溢',
'• Chunk tile matmul，计算密集，要求 CUBE\n• 64/128 tile，要求 L0/UB 双缓冲',
'• 小矩阵递归，FLOPs 低但同步敏感，要求状态驻留\n• 状态更新与主计算并行，要求与 CUBE overlap',
'• Decode 状态读写主导，要求低 bytes/token\n• 启动延迟敏感，要求 persistent kernel'
];
for(let i=0;i<demand.length;i++) t.getCell(i+1,3).value=demand[i];
const s=p.slides.items[0];
s.speakerNotes.text='表格最后一栏采用“每条 bullet 同时表达负载特征与昇腾诉求”的写法；例如 Prefill 与 Decode 分别成点，不再把特征与诉求拆成上下两条，也不使用跨行编号。\n论文结论（§2.1.1、§5.1.1、§5.1.2）：KDA 使用固定大小递归状态；FlashKDA 重叠 chunk 内计算与跨 chunk 状态传播；KCP 使用固定大小状态片段、all-gather 和 prefix scan。g_min=-5 使 causal tile 可统一使用 Tensor Core。\n工程推论：表格中的 CUBE/Vector overlap、L0/UB 驻留、state bytes/token 和 persistent kernel 诉求，是基于论文机制与 vLLM/vLLM-Ascend 代码做的昇腾适配判断。';
await (await PresentationFile.exportPptx(p)).save(out);console.log(out);
