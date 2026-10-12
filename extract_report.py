from pypdf import PdfReader
p='D:/kimi_k3_workspace/Kimi-K3/k3_tech_report.pdf'
r=PdfReader(p)
print('pages',len(r.pages))
for i,page in enumerate(r.pages):
 t=page.extract_text() or ''
 if any(k.lower() in t.lower() for k in ['Kimi Delta','Gated MLA','FlashKDA','AttnRes','LatentMoE','infrastructure','kernel','Ascend','decode']):
  print(f'\n---PAGE {i+1}---\n{t[:7000]}')
