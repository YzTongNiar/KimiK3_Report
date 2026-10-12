from pypdf import PdfReader
p='D:/kimi_k3_workspace/Kimi-K3/k3_tech_report.pdf'
r=PdfReader(p)
print('pages',len(r.pages))
for i,page in enumerate(r.pages):
 t=page.extract_text() or ''
 open(f'D:/kimi_k3_workspace/k3_page_{i+1}.txt','w',encoding='utf-8').write(t)
 print(i+1,len(t))
