from pathlib import Path
import base64
import zipfile
import re

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'app-ui'
DIST = APP / 'dist'
html = (DIST / 'index.html').read_text(encoding='utf-8')
css = (DIST / 'styles.css').read_text(encoding='utf-8')
script_paths = re.findall(r'<script defer src="\./([^\"]+)"></script>', html)
assert script_paths and script_paths[-1] == 'app.js'
js = '\n;\n'.join((DIST / name).read_text(encoding='utf-8') for name in script_paths)
def data_svg(name):
    return 'data:image/svg+xml;base64,' + base64.b64encode((DIST / 'assets' / name).read_bytes()).decode('ascii')
html = html.replace('<link rel="stylesheet" href="./styles.css">', '<style>\n' + css + '\n</style>')
html = re.sub(r'  <script defer src="\./[^\"]+"></script>\n', '', html)
html = html.replace('./assets/mark.svg', data_svg('mark.svg'))
js = js.replace('./assets/wearable.svg', data_svg('wearable.svg'))
html = html.replace('</body>', '<script>\n' + js + '\n</script>\n</body>')
target = APP / 'CCEW_Companion.html'
target.write_text(html,encoding='utf-8')
assert './styles.css' not in html and './app.js' not in html and './assets/' not in html
files = [target, APP / 'README.md', APP / 'serve.cjs']
files += sorted(p for p in DIST.rglob('*') if p.is_file())
files += [p for p in [APP / 'preview-desktop.png', APP / 'preview-mobile.png'] if p.exists()]
files += sorted(p for p in (APP / 'tests').rglob('*') if p.is_file() and p.suffix in {'.cjs', '.json', '.png'})
archive = ROOT / 'CCEW_Companion_UI.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as out:
    for p in files:
        if p.exists(): out.write(p,p.relative_to(ROOT).as_posix())
    out.write(Path(__file__), 'tools/package_app_ui.py')
with zipfile.ZipFile(archive) as check:
    assert check.testzip() is None
print(f'Standalone app: {target.name} ({target.stat().st_size:,} bytes)')
print(f'UI package: {archive.name} ({archive.stat().st_size:,} bytes)')
