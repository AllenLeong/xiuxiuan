"""Bundle repository artwork, references and provenance without runtime dependencies."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
files = sorted(p for p in root.rglob('*') if p.is_file() and p.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp', '.svg'} and not any(part in {'.git', 'exports', 'node_modules', 'tmp', '.cache'} for part in p.relative_to(root).parts))
records = [{'path': p.relative_to(root).as_posix(), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
(root / 'assets-manifest.json').write_text(json.dumps({'version': 1, 'files': records}, ensure_ascii=False, indent=2) + '\n')
lines = ['# 资产索引', '', '运行 `python3 scripts/package-assets.py` 可重新生成资产压缩包与 SHA-256 清单。', '', '- `sideview/assets/`：横版山域美术。', '- `feasibility/assets/`：生态观测图标、山石与植被图集。', '- `参考图片/` 和根目录图片：用户提供的参考素材。', '- `docs/18-mountain-art-and-immersion.md`：生成提示词、素材用途与实现边界。', '', f'共 {len(files)} 个图像文件，原始大小 {sum(r["bytes"] for r in records) / 1024 / 1024:.2f} MiB。校验值见 `assets-manifest.json`。', '', '| 文件 | 字节 |', '| --- | ---: |']
lines.extend(f'| [{r["path"]}](<{r["path"]}>) | {r["bytes"]} |' for r in records)
(root / 'ASSETS.md').write_text('\n'.join(lines) + '\n')
output = root / 'exports' / 'xiuxian-assets-v0.2.0.zip'
output.parent.mkdir(exist_ok=True)
extras = [root / 'ASSETS.md', root / 'assets-manifest.json', root / 'docs/18-mountain-art-and-immersion.md']
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for p in files + extras:
        info = zipfile.ZipInfo(p.relative_to(root).as_posix(), date_time=(2026, 9, 20, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, p.read_bytes())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for record in records:
        assert hashlib.sha256(archive.read(record['path'])).hexdigest() == record['sha256']
print(f'{output.name}: {len(files)} images, {output.stat().st_size / 1024 / 1024:.2f} MiB; every checksum verified')
