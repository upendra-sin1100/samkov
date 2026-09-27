from pathlib import Path
import concurrent.futures,json,urllib.request
packages=[]
for line in Path('backend/requirements.lock.txt').read_text().splitlines():
    if '==' in line and not line.startswith('#'):
        name,version=line.split('==',1)
        packages.append((name,version))
def check(pair):
    name,version=pair
    try:
        req=urllib.request.Request(f'https://pypi.org/pypi/{name}/{version}/json',headers={'User-Agent':'SamkovAI-dependency-review'})
        with urllib.request.urlopen(req,timeout=20) as response:
            data=json.load(response)
        return {'name':name,'version':version,'vulnerabilities':[{'id':v['id'],'aliases':v.get('aliases',[]),'fixed_in':v.get('fixed_in',[]),'link':v.get('link')} for v in data.get('vulnerabilities',[]) if not v.get('withdrawn')]}
    except Exception as exc:
        return {'name':name,'error':type(exc).__name__}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results=list(pool.map(check,packages))
report={'checked':len(results),'findings':[r for r in results if r.get('vulnerabilities')],'errors':[r for r in results if 'error' in r]}
Path('docs/python-dependency-audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
