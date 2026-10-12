import * as path from 'node:path';
import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {PresentationFile,FileBlob}=art;
const src='D:/kimi_k3_workspace/kimi_k3_arch_analysis/kimi_k3_with_comments.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const res=await p.inspect({kind:'textbox,shape,image,table',include:'id,name,slideIndex,x,y,width,height,text,fontSize,fontFamily,fontColor,bold,fill,stroke',scope:'presentation'});
const lines=(res.ndjson||'').split(/\r?\n/).filter(Boolean);
for (const ln of lines){
  let o; try{o=JSON.parse(ln)}catch{continue}
  if (o.slideIndex>=2) {
    const t=o.text?String(o.text).replace(/\s+/g,' ').slice(0,120):'';
    console.log(JSON.stringify({slide:o.slideIndex+1,type:o.type,id:o.id,name:o.name,x:o.x,y:o.y,w:o.width,h:o.height,text:t,fontSize:o.fontSize,fontFamily:o.fontFamily,fontColor:o.fontColor,bold:o.bold,fill:o.fill},null,0));
  }
}
