#!/usr/bin/env bash
# Builds a signed release APK locally and copies it to builds/.
# Usage: scripts/build-apk.sh [--no-bump]
set -euo pipefail
cd "$(dirname "$0")/.."

export JAVA_HOME="${JAVA_HOME:-$HOME/Library/Java/JavaVirtualMachines/temurin-17.0.15/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

# Bump android.versionCode so each APK installs over the previous one.
if [[ "${1:-}" != "--no-bump" ]]; then
  node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync("app.json", "utf8"));
    j.expo.android.versionCode = (j.expo.android.versionCode || 0) + 1;
    fs.writeFileSync("app.json", JSON.stringify(j, null, 2) + "\n");
  '
fi

VERSION=$(node -p 'require("./app.json").expo.version')
CODE=$(node -p 'require("./app.json").expo.android.versionCode')

npx expo prebuild --platform android --clean --no-install
(cd android && ./gradlew assembleRelease)

mkdir -p builds
OUT="builds/pills-tracker-v${VERSION}-b${CODE}.apk"
cp android/app/build/outputs/apk/release/app-release.apk "$OUT"
echo
echo "Built $OUT ($(du -h "$OUT" | cut -f1))"
"$ANDROID_HOME"/build-tools/36.0.0/apksigner verify --print-certs "$OUT" | head -2
