#!/usr/bin/env bash
# Usage: bash scripts/build.sh [debug|release]
# Needs: Node 18+, JDK 17, Android SDK (ANDROID_HOME set).
# Release signing: set KEYSTORE_PATH, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD.
set -euo pipefail
cd "$(dirname "$0")/.."
MODE="${1:-debug}"

npm install
bash scripts/setup-android.sh
mkdir -p dist

cd android
chmod +x gradlew
if [ "$MODE" = "debug" ]; then
  ./gradlew assembleDebug
  cp app/build/outputs/apk/debug/app-debug.apk ../dist/ou-escape-route-debug.apk
  echo "Built dist/ou-escape-route-debug.apk"
  exit 0
fi

./gradlew assembleRelease
UNSIGNED=$(ls app/build/outputs/apk/release/*.apk | head -1)
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
"$BT/zipalign" -f -p 4 "$UNSIGNED" ../dist/aligned.apk
"$BT/apksigner" sign \
  --ks "$KEYSTORE_PATH" --ks-pass "pass:$KEYSTORE_PASSWORD" \
  --ks-key-alias "$KEY_ALIAS" --key-pass "pass:$KEY_PASSWORD" \
  --out ../dist/ou-escape-route-release.apk ../dist/aligned.apk
rm -f ../dist/aligned.apk
echo "Built dist/ou-escape-route-release.apk"
