#!/usr/bin/env python3
from pathlib import Path
import argparse, json, re, shutil
ROOT=Path(__file__).resolve().parent
PATTERN=re.compile(r'<script[^>]*id=["\']mm-project-data["\'][^>]*>(.*?)</script>',re.S|re.I)

def root_path(value):
    s=str(value or '').strip()
    while s.startswith('../'): s=s[3:]
    if s.startswith('./'): s=s[2:]
    return s

def catalog(root):
    projects=[]
    for page in sorted((root/'progetti').glob('*.html')):
        text=page.read_text(encoding='utf-8')
        match=PATTERN.search(text)
        if not match: raise SystemExit(f'Dati progetto mancanti in {page.name}')
        try: data=json.loads(match.group(1))
        except json.JSONDecodeError as exc: raise SystemExit(f'JSON non valido in {page.name}: {exc}')
        if data.get('published',True) is False: continue
        data['slug']=page.stem
        data['url']=f'progetti/{page.name}'
        data['image_url']=root_path(data.get('image_url',''))
        data['sort_order']=int(data.get('sort_order',data.get('order',9999)))
        data['created_at']=str(data.get('created_at',data.get('date','')))
        projects.append(data)
    projects.sort(key=lambda p:(p.get('sort_order',9999),str(p.get('title','')).lower()))
    return projects

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--output'); args=ap.parse_args()
    projects=catalog(ROOT)
    if args.output:
        dest=(ROOT/args.output).resolve() if not Path(args.output).is_absolute() else Path(args.output)
        if dest.exists(): shutil.rmtree(dest)
        dest.mkdir(parents=True)
        for name in ['index.html','styles.css','app.js','project.js','logo_mannino_maker.png']:
            shutil.copy2(ROOT/name,dest/name)
        for name in ['progetti','assets','downloads']:
            shutil.copytree(ROOT/name,dest/name)
        (dest/'.nojekyll').write_text('',encoding='utf-8')
        target=dest/'projects.json'
    else: target=ROOT/'projects.json'
    target.write_text(json.dumps(projects,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Catalogo generato: {len(projects)} progetti -> {target}')
if __name__=='__main__': main()
