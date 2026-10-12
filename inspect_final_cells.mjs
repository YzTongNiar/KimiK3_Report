import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const p=await art.PresentationFile.importPptx(await art.FileBlob.load('C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v3.pptx'));
const t=p.resolve('tb/lwfe1cbi');
for(let r=0;r<t.rows;r++){let a=[];for(let c=0;c<4;c++){let x=t.getCell(r,c);let v=''; try{v=x.value??''}catch{}; if(!v){try{v=x.text?.plainText??''}catch{}}; a.push(v)} console.log(r,JSON.stringify(a));}
