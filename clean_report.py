from pathlib import Path
s=Path('D:/kimi_k3_workspace/report_text.txt').read_text(encoding='utf-8',errors='ignore').replace('\x00','')
Path('D:/kimi_k3_workspace/report_text_clean.txt').write_text(s,encoding='utf-8')
