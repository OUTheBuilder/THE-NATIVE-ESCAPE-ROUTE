#!/usr/bin/env bash
# Generates the android/ project and injects the SocialBrowser plugin.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d android ] || npx cap add android

PKG_DIR=android/app/src/main/java/com/ou/escaperoute
mkdir -p "$PKG_DIR"
cp plugin/SocialBrowserActivity.java plugin/SocialBrowserPlugin.java "$PKG_DIR/"

cat > "$PKG_DIR/MainActivity.java" <<'JAVA'
package com.ou.escaperoute;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SocialBrowserPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
JAVA

python3 - <<'PY'
p = "android/app/src/main/AndroidManifest.xml"
s = open(p, encoding="utf-8").read()
if "SocialBrowserActivity" not in s:
    block = ('    <activity android:name=".SocialBrowserActivity" '
             'android:excludeFromRecents="true" '
             'android:configChanges="orientation|screenSize|keyboardHidden" '
             'android:theme="@style/AppTheme.NoActionBar" />\n')
    s = s.replace("</application>", block + "    </application>")
    open(p, "w", encoding="utf-8").write(s)
print("manifest ok")
PY

npx cap sync android
echo "Android project ready."
