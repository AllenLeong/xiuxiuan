"""Bundle repository artwork, references and provenance without runtime dependencies."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
files = sorted(p for p in root.rglob('*') if p.is_file() and p.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp', '.svg'} and not any(part in {'.git', 'exports', 'node_modules', 'tmp', '.cache', '.tools', '.godot'} for part in p.relative_to(root).parts))
records = [{'path': p.relative_to(root).as_posix(), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
(root / 'assets-manifest.json').write_text(json.dumps({'version': 2, 'files': records}, ensure_ascii=False, indent=2) + '\n')
lines = ['# 资产索引', '', '运行 `python3 scripts/package-assets.py` 可重新生成资产压缩包与 SHA-256 清单。', '', '- `godot-demo/assets/`：当前 Godot 图集、岩面材质与布局数据；qinglan-world.png 为停用底画。', '- `godot-demo/evidence/`：实际运行截图，不是场景纹理。', '- `sideview/assets/`：横版山域美术。', '- `feasibility/assets/`：生态观测图标、山石与植被图集。', '- `参考图片/` 和根目录图片：用户提供的参考素材。', '- `docs/18-mountain-art-and-immersion.md`：生成提示词、素材用途与实现边界。', '', f'共 {len(files)} 个图像文件，原始大小 {sum(r["bytes"] for r in records) / 1024 / 1024:.2f} MiB。校验值见 `assets-manifest.json`。', '', '| 文件 | 字节 |', '| --- | ---: |']
lines.extend(f'| [{r["path"]}](<{r["path"]}>) | {r["bytes"]} |' for r in records)
(root / 'ASSETS.md').write_text('\n'.join(lines) + '\n')
output = root / 'exports' / 'xiuxian-assets-v0.3.0.zip'
output.parent.mkdir(exist_ok=True)
extras = [root / 'ASSETS.md', root / 'assets-manifest.json', root / 'docs/18-mountain-art-and-immersion.md', root / 'godot-demo/README.md', root / 'godot-demo/assets/layered-world.json']
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

# Standalone importable project; omit engine, import cache and OS metadata.
demo_files = sorted(p for p in (root / 'godot-demo').rglob('*') if p.is_file() and '.godot' not in p.parts and p.name != '.DS_Store')
demo_output = root / 'exports' / 'xiuxian-godot-demo-v0.3.0.zip'
with zipfile.ZipFile(demo_output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for p in demo_files:
        info = zipfile.ZipInfo(p.relative_to(root).as_posix(), date_time=(2026, 9, 20, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o100755 if p.suffix == '.command' else 0o100644) << 16
        archive.writestr(info, p.read_bytes())
with zipfile.ZipFile(demo_output) as archive:
    assert archive.testzip() is None
    assert 'godot-demo/project.godot' in archive.namelist()
    assert not any('/.godot/' in name or '/.tools/' in name for name in archive.namelist())
print(f'{demo_output.name}: {len(demo_files)} files, {demo_output.stat().st_size / 1024 / 1024:.2f} MiB; archive verified')
