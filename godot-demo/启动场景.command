#!/bin/zsh
cd "${0:A:h}"
for engine in ../.tools/Godot.app/Contents/MacOS/Godot /Applications/Godot.app/Contents/MacOS/Godot; do
  if [[ -x "$engine" ]]; then
    exec "$engine" --path . "$@"
  fi
done
for engine in godot godot4; do
  if command -v "$engine" >/dev/null 2>&1; then
    exec "$engine" --path . "$@"
  fi
done
print '未找到 Godot。请安装 Godot，并导入本目录的 project.godot 后运行。'
exit 1
