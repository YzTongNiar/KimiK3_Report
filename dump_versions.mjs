import {pathToFileURL} from "node:url";
const art=await import(pathToFileURL("C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs").href);
const {PresentationFile,FileBlob}=art;
for (const f of ["v10","v14"]){
 const path=`C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-${f}.pptx`;
 const p=await PresentationFile.importPptx(await FileBlob.load(path));
 console.log("\n=====",f,"slides",p.slides.items.length);
 for(let i=0;i<p.slides.items.length;i++){
  const s=p.slides.items[i];
  const r=await p.inspect({kind:"textbox,table",scope:"slide",slideId:s.id});
  const lines=r.ndjson.split(/\r?\n/).filter(Boolean);
  console.log("--slide",i+1);
  for(const l of lines){if(l.includes("concl-bullets")||l.includes("dev-bullets")||l.includes("param-table")) console.log(l.slice(0,2400));}
 }
}
