#!/usr/bin/env bash
set -euo pipefail

if [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
  VEC_SRC="../../node_modules/expo-sqlite/ios/vec.xcframework"
  if [[ -d "$VEC_SRC" ]]; then
    echo "Pre-copying vec.xcframework to Xcode DerivedData for ExpoSQLite"
    XCFW_DIR=~/Library/Developer/Xcode/DerivedData/Build/Products/Release-iphonesimulator/XCFrameworkIntermediates/ExpoSQLite
    mkdir -p "$XCFW_DIR"
    cp -R "$VEC_SRC/ios-arm64-simulator/vec.framework" "$XCFW_DIR/"

    XCFW_DIR_DEVICE=~/Library/Developer/Xcode/DerivedData/Build/Products/Release-iphoneos/XCFrameworkIntermediates/ExpoSQLite
    mkdir -p "$XCFW_DIR_DEVICE"
    cp -R "$VEC_SRC/ios-arm64/vec.framework" "$XCFW_DIR_DEVICE/"

    echo "vec.xcframework pre-copied successfully"
  else
    echo "Warning: vec.xcframework not found at $VEC_SRC"
  fi
fi
