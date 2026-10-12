import * as path from 'node:path'; import {pathToFileURL} from 'node:url'; import fs from 'node:fs/promises';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const p=await art.PresentationFile.importPptx(await art.FileBlob.load('D:/kimi_k3_workspace/kimi_k3_arch_analysis/kimi_k3_with_comments.pptx'));
console.log((await p.inspect({kind:'slide,textbox,shape,image,table',maxChars:100000})).ndjson);
for(let i=0;i<p.slides.items.length;i++){const b=await p.slides.getItem(i).export({format:'png',scale:1}); await fs.writeFile(`D:/kimi_k3_workspace/kimi_k3_arch_analysis/inspect-slide-${i+1}.png`,new Uint8Array(await b.arrayBuffer()));}
