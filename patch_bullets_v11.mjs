import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {PresentationFile,FileBlob}=art;
const src='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v10.pptx';
const out='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v11.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const t=p.resolve('tb/lwfe1cbi');
const demand=[
'• Prefill：稠密 GEMM，计算密集，要求 CUBE 算力\n• Decode：退化为 GEMV，访存密集，要求通信带宽',
'• 低秩投影走 CUBE\n• sigmoid/exp 走 Vector，需融合后处理与稳定累加',
'• 衰减/累加为 Vector 负载\n• 要求 FP32 累加与安全 gate，避免 BF16 下溢',
'• Chunk tile matmul，计算密集\n• 要求 64/128 tile + L0/UB 双缓冲',
'• 小矩阵递归，FLOPs 低但同步敏感\n• 要求状态驻留并与 CUBE 重叠',
'• Decode 受状态读写/启动延迟主导\n• 要求 persistent kernel 与低 bytes/token'
];
for(let i=0;i<demand.length;i++) t.getCell(i+1,3).value=demand[i];
const s=p.slides.items[0];
s.speakerNotes.text='表格最后一栏改为单元格内两条 bullet：第一条说明负载特征，第二条说明对应的昇腾诉求，不再使用跨行编号。\n论文结论（§2.1.1、§5.1.1、§5.1.2）：KDA 使用固定大小递归状态；FlashKDA 重叠 chunk 内计算与跨 chunk 状态传播；KCP 使用固定大小状态片段、all-gather 和 prefix scan。g_min=-5 使 causal tile 可统一使用 Tensor Core。\n工程推论：表格中的 CUBE/Vector overlap、L0/UB 驻留、state bytes/token 和 persistent kernel 诉求，是基于论文机制与 vLLM/vLLM-Ascend 代码做的昇腾适配判断。';
await (await PresentationFile.exportPptx(p)).save(out);console.log(out);
