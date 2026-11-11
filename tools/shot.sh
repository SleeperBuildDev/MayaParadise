#!/usr/bin/env bash
# Headless screenshot of a page served by the local dev server (python -m http.server 8123).
# Usage: tools/shot.sh <path-and-query> <out.png> [W,H] [virtual-time-ms]
#   tools/shot.sh "dev/smoke.html?t=2" /tmp/smoke.png 412,915 6000
# Uses a throwaway browser profile so it never touches anyone's real browser data.
set -euo pipefail
BROWSER="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
[ -x "$BROWSER" ] || BROWSER="/c/Program Files/Google/Chrome/Application/chrome.exe"
URL="http://127.0.0.1:8123/${1#/}"
OUT="$2"
SIZE="${3:-412,915}"
BUDGET="${4:-6000}"
PROFILE="$(mktemp -d)"
OUT_WIN="$(cygpath -w "$OUT" 2>/dev/null || echo "$OUT")"
"$BROWSER" --headless=new --user-data-dir="$(cygpath -w "$PROFILE" 2>/dev/null || echo "$PROFILE")" \
  --no-first-run --no-default-browser-check --disable-extensions --hide-scrollbars \
  --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist \
  --force-device-scale-factor=1 --window-size="$SIZE" --virtual-time-budget="$BUDGET" \
  --screenshot="$OUT_WIN" "$URL" >/dev/null 2>&1 || true
rm -rf "$PROFILE" 2>/dev/null || true
[ -s "$OUT" ] && echo "saved $OUT" || { echo "screenshot failed for $URL"; exit 1; }
