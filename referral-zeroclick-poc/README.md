# Zero-Click Referral-Forgery Delivery PoC (supplementary, optional)

This is **not required** to reproduce or validate the core finding — the `agoda://promocode/?site_id=X` deep link bug is fully reproducible with a single `adb` command against a real device with the Agoda app installed (see the main report). This folder exists only to back up one additional claim: that the same deep link can be fired **with zero interaction with Agoda at all**, from an ordinary, unprivileged, co-installed app.

## What it is

A minimal Android app, package `com.research.zeroclickpoc`. Its manifest (`AndroidManifest.xml`) declares **no permissions of any kind** — verifiable independently by installing it and running `adb shell dumpsys package com.research.zeroclickpoc`, or simply by noting Android shows no permission prompt at install time. Its entire behavior is one `Activity` (`src/com/research/zeroclickpoc/MainActivity.java`) that, the instant it is opened, fires:

```java
Uri uri = Uri.parse("agoda://promocode/?site_id=THIRDPARTYAPP_ZEROCLICK");
startActivity(new Intent(Intent.ACTION_VIEW, uri));
```

That's the entire app. No network code, no background service, no other component.

## Download

A prebuilt, signed APK is attached to the GitHub Release tagged for this folder (see the repo's Releases page). Verify its integrity before installing:

```
sha256: 162A5396E954ECA9534550111203CECCD80D08B5A2A3EA007603EED46CA5CD0F
```

## How to test it yourself

1. Have the Agoda app already installed on a test device.
2. `adb install <downloaded>.apk`
3. Tap the app's icon once (or `adb shell monkey -p com.research.zeroclickpoc -c android.intent.category.LAUNCHER 1`).
4. Observe Agoda's own network traffic (e.g. via a TLS-decrypting proxy) for a `POST .../ndreferralRegister` call carrying `site_id=THIRDPARTYAPP_ZEROCLICK`, and/or check `adb logcat` for `ActivityManager`/`ActivityTaskManager` lines showing `caller=com.research.zeroclickpoc` / `callingPackage com.research.zeroclickpoc` on Agoda's launch.

You can also just read the two source files above directly — the entire app is under 40 lines.
