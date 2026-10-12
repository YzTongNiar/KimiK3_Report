import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const p=await art.PresentationFile.importPptx(await art.FileBlob.load('C:/Users/ASUS/Documents/Codex/2026-10-07/slides-ai-plugin-app-69eba611751c819182a7476b3acfe9fa-openai-2/outputs/kimi-k3-model-structure-analysis-revised-v12-final-v3.pptx'));
console.log((await p.inspect({kind:'table',scope:'slide',slideId:p.slides.items[0].id,maxChars:30000})).ndjson);
