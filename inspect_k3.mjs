import {FileBlob,PresentationFile} from '@oai/artifact-tool';
const src='D:/kimi_k3_workspace/kimi_k3_arch_analysis/kimi_k3_with_comments.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
console.log((await p.inspect({kind:'slide,textbox,shape,image,table',maxChars:100000})).ndjson);
for(let i=0;i<p.slides.items.length;i++){const b=await p.slides.getItem(i).export({format:'png',scale:1}); await (await import('node:fs/promises')).writeFile(`D:/kimi_k3_workspace/kimi_k3_arch_analysis/inspect-slide-${i+1}.png`,new Uint8Array(await b.arrayBuffer()));}
