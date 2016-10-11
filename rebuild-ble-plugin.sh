#!/bin/bash
#
# Remove and add BLE plugin, build android.
#
cordova plugin rm cordova-plugin-ble
cordova plugin add ../cordova-ble
#cordova build ios
cordova build android
#adb install -r ./platforms/android/build/outputs/apk/android-debug.apk
