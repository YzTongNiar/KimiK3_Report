from pypdf import PdfReader
p='D:/kimi_k3_workspace/Kimi-K3/k3_tech_report.pdf'; r=PdfReader(p)
with open('D:/kimi_k3_workspace/report_text.txt','w',encoding='utf-8') as f:
 for i,page in enumerate(r.pages):
  t=page.extract_text() or ''
  f.write(f'\n---PAGE {i+1}---\n{t}\n')
