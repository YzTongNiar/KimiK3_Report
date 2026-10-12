import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {PresentationFile,FileBlob}=art;
const src='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v13.pptx';
const out='C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v14.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const conclIds=['sh/sryl4zqx','sh/w3i1sfa9','sh/pcjqtg36','sh/sna103ap','sh/032tgr6d'];
for(const id of conclIds){const sh=p.resolve(id);sh.text=String(sh.text).split(/\n/).map(x=>x.replace(/^•\s*/,'')).join('\n');}
p.slides.keep([0,1,2,3,4]);
await (await PresentationFile.exportPptx(p)).save(out);console.log(out);
