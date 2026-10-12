import {pathToFileURL} from 'node:url';
const art=await import(pathToFileURL('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {PresentationFile,FileBlob}=art;
const src='D:/kimi_k3_workspace/kimi_k3_arch_analysis/kimi_k3_with_comments.pptx';
const out='D:/kimi_k3_workspace/kimi_k3_arch_analysis/kimi_k3_with_comments_boss_style.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(src));
const S=(id)=>p.resolve(id);
const setPos=(id,pos)=>{const o=S(id); if(o) o.position=pos;};
const setText=(id,txt)=>{const o=S(id); if(o) o.text=txt;};
const setStyle=(id,st)=>{const o=S(id); if(!o||!o.text)return; for(const [k,v] of Object.entries(st)){try{o.text[k]=v}catch{}}};
const slides={
4:{title:'sh/0ba143al',labelbg:'sh/rm1k7yt4',label:'sh/ql8jytsj',bodybg:'sh/doj29oba',body:'sh/sna103ap',arch:'sh/3ihk3et8',param:'sh/i94r6xgz',note:'sh/w72947yt',dev:'sh/x8vaxsfe',devbody:'sh/a5kr2xg3',author:'sh/v6tsv2xo',table:'tb/dk3yxony',image:'im/q9876pkv',remove:['sh/5cva1cfq'],concl:'➢ 69 KDA + 24 MLA / 93 层；KDA 采用 ShortConv + 逐通道门控 Delta 递归，解码状态更新为 O(1)。\n➢ 每 token 主负载是 q/k/v 投影与状态更新：投影映射 CUBE，gate/cumsum/递归映射 Vector。\n➢ 昇腾重点是 gate–cumsum–delta 融合、L0 常驻状态与 64/128 chunk；Prefill 偏算力，Decode 偏带宽与启动延迟。'},
5:{title:'sh/cf2tcr61',labelbg:'sh/z2tcnm5s',label:'sh/yhkbe1o7',bodybg:'sh/l4bupwny',body:'sh/032tgr6d',arch:'sh/n6dcr65o',param:'sh/ahkvi1cb',note:'sh/k7mxovud',dev:'sh/58vehgvy',devbody:'sh/i54fmlc7',author:'sh/j6dwfqds',table:'tb/dcrmd4vq',image:'im/ulkfaloz',concl:'➢ 24 层采用 NoPE Gated MLA；KDA 提供位置与 recency，MLA 保留全局内容检索。\n➢ kv_lora_rank=512、q_lora_rank=1536，KV cache 显著收缩；Decode 从 GEMM 转向 GEMV 与访存主导。\n➢ 昇腾重点是 latent cache 排布、RoPE / NoPE 分支、TP/PCP/DCP 叠加；投影与上采样仍是 CUBE 热点。'},
6:{title:'sh/zi98nu94',labelbg:'sh/87ipkzal',label:'sh/98rqt4r6',bodybg:'sh/ml07i9sv',body:'sh/7m98ru9g',arch:'sh/oryp8fah',param:'sh/h4bupgn6',note:'sh/v2tcn650',dev:'sh/u1kbu1ov',devbody:'sh/5svutgni',author:'sh/47mt0b6x',table:'tb/hgv6dwfm',image:'im/neh8na9g',remove:['sh/pc76hkr2'],concl:'➢ Chunkwise 训练 / Prefill 将 A·V matmul 与衰减、cumsum、跨 chunk 状态传播流水化。\n➢ CUBE 负责 tile matmul，Vector 负责衰减、scan 与状态更新；64/128 chunk 在占用率和状态流量之间折中。\n➢ 昇腾需要单物理 L0 融合路径，避免多次 staging；Prefill 偏 CUBE，Decode 仍受带宽与 launch 延迟约束。'},
7:{title:'sh/dcbud0ra',labelbg:'sh/ydkbm5sv',label:'sh/zedcfa9g',bodybg:'sh/kzmdova1',body:'sh/l0vuh0rm',arch:'sh/eh0ba1sr',param:'sh/baxkjqlk',note:'sh/xcz2l03q',dev:'sh/cbq1sv25',devbody:'sh/cbq1sv25',author:'sh/25ojml43',table:'tb/vm9czels',image:'im/50v6tonq',remove:['sh/p8fih03e'],concl:'➢ Fuses ShortConv、gate、递归状态和输出投影，减少每 token kernel launch 与状态往返。\n➢ RecoverSSM 只回滚未验证 draft token；snapshot 粒度必须与 speculative block 对齐。\n➢ 昇腾重点是 persistent decode graph、L0/UB 状态快照及 Vector+CUBE overlap；Decode 主要受访存和时延限制。'},
8:{title:'sh/g72x4zyd',labelbg:'sh/ri9g7uhw',label:'sh/6h0fypgb',bodybg:'sh/tkby9kzm',body:'sh/sjix0zy1',arch:'sh/je9g3ahk',param:'sh/o7ydoret',note:'sh/m5gvmhwn',dev:'sh/n6pwfmd8',devbody:'sh/0jydkreh',author:'sh/1k7edwv2',table:'tb/0z6pgzup',image:'im/alored4v',concl:'➢ 8 个 block-level residual bank 替代全深度残差注意力，softmax 只在 block state 上检索。\n➢ Inter-block pass 是 O(N·d) 访存，intra-block mix 是小 GEMM；通信可与 Decode 侧路重叠。\n➢ 昇腾需要 RESIDENT/RELOAD、Prefill 的 RS+AG、Decode side-stream，以及确定性 bank 排布。'},
9:{title:'sh/0b65obm9',labelbg:'sh/nex4jq5k',label:'sh/mdonql4z',bodybg:'sh/9gzml0nq',body:'sh/ofq5svm5',arch:'sh/bih4na5w',param:'sh/oza1gfyh',note:'sh/2xsjepgb',dev:'sh/3y107axw',devbody:'sh/cnu1kzyd',author:'sh/do3id4fy',table:'tb/4j2p4rud',image:'im/aho72lwb',concl:'➢ 先将 d=7168 压到 latent ℓ=3584，再路由 896 专家中的 top-16，并叠加 2 个 shared expert。\n➢ latent 宽度使 EP dispatch/combine 字节量约降 2×；group GEMM 是 CUBE 热点，router/top-k 更偏 Vector 与时延。\n➢ 昇腾需要 latent-aware EP、token-centric WarpDecode，以及 router→SiTU→combine 融合和量化 latent cache。'}
};
for (const [slideNo,c] of Object.entries(slides)) {
  const n=Number(slideNo);
  for(const id of (c.remove||[])){try{S(id)?.delete()}catch{}}
  // normalize title and compact conclusion bar to the boss template
  setPos(c.title,{left:18,top:7.4,width:960,height:57.8}); setStyle(c.title,{fontSize:24,typeface:'微软雅黑',color:'#C00000',bold:true});
  setPos(c.labelbg,{left:17.27,top:53.13,width:74.27,height:83.13}); setPos(c.label,{left:17.27,top:53.13,width:74.27,height:83.13}); setStyle(c.label,{fontSize:18.67,typeface:'微软雅黑',color:'#FFFFFF',bold:true});
  setPos(c.bodybg,{left:94.8,top:53.13,width:1163.4,height:83.13}); setPos(c.body,{left:107,top:58.5,width:1138,height:72}); setText(c.body,c.concl); setStyle(c.body,{fontSize:11.5,typeface:'微软雅黑',color:'#404040',bold:true});
  setPos(c.arch,{left:29,top:143.5,width:550,height:20}); setStyle(c.arch,{fontSize:16,typeface:'微软雅黑',color:'#C00000',bold:true});
  setPos(c.param,{left:642,top:143.5,width:555,height:20}); setStyle(c.param,{fontSize:16,typeface:'微软雅黑',color:'#C00000',bold:true});
  setPos(c.image,{left:29,top:165,width:585,height:300});
  setPos(c.table,{left:642,top:164.5,width:555,height:283});
  setPos(c.note,{left:642,top:448,width:555,height:16});
  setStyle(c.note,{fontSize:9.5,typeface:'微软雅黑',color:'#7F7F7F',bold:false});
  setPos(c.dev,{left:59,top:470,width:1168,height:20}); setStyle(c.dev,{fontSize:16,typeface:'微软雅黑',color:'#C00000',bold:true});
  setPos(c.devbody,{left:59,top:496,width:1168,height:180}); setStyle(c.devbody,{fontSize:12.5,typeface:'微软雅黑',color:'#404040',bold:true});
  setText(c.author,'Huawei Proprietary - Restricted Distribution'); setPos(c.author,{left:128,top:704,width:500,height:12}); setStyle(c.author,{fontSize:9.33,typeface:'微软雅黑',color:'#7F7F7F',bold:false});
}
await (await PresentationFile.exportPptx(p)).save(out);
console.log(out);
