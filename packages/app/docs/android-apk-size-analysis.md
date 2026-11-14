# Android E2E APK size analysis

Measured on 2026-11-14 from GitHub Actions artifacts, without rebuilding the baseline. PR #2208: run `43568920239`; PR #2210: run `43499067677`. Both artifacts are named `android-e2e-app-e2e` and contain `app-release.apk`.

## Baseline comparison

APK sizes are **104,156,901 bytes (99.33 MiB)** and **108,787,151 bytes (103.75 MiB)**: **+4,630,250 bytes (+4.42 MiB)**. GitHub artifact ZIP sizes are 76,664,928 and 82,031,171 bytes (73.11 and 78.23 MiB), respectively. Artifact ZIP size is not APK upload size.

The tables distinguish ZIP entry bytes (contribution to APK size) from raw bytes after extraction. APK signing blocks, alignment and ZIP headers explain the difference between entry totals and file size. Resource names are obfuscated and differ between builds, so individual resource-name deltas are not reliable semantic comparisons.

| Category | #2208 raw bytes | #2210 raw bytes | #2208 APK entry bytes | #2210 APK entry bytes | APK delta bytes |
|---|---:|---:|---:|---:|---:|
| DEX | 13,407,372 | 14,137,564 | 6,160,680 | 6,425,554 | +264,874 |
| Fonts | 410,712 | 410,712 | 210,865 | 210,865 | +0 |
| Hermes bytecode | 35,784,772 | 35,276,916 | 35,784,772 | 35,276,916 | -507,856 |
| ML Kit model assets | 0 | 1,486,803 | 0 | 1,272,325 | +1,272,325 |
| Native libraries | 131,117,512 | 142,182,056 | 51,854,216 | 56,259,885 | +4,405,669 |
| Other (including resources.arsc) | 3,744,177 | 2,651,901 | 2,950,926 | 2,527,971 | -422,955 |
| Other assets | 8,302,775 | 8,303,656 | 3,431,634 | 3,432,515 | +881 |
| Resources / images | 3,953,757 | 3,953,708 | 3,020,022 | 3,018,802 | -1,220 |

The new `libmlkit_google_ocr_pipeline.so` contributes **4,405,669 APK bytes** (11,064,544 raw). The bundled OCR assets add **1,272,325 APK bytes** (1,486,803 raw). Together these add **5,677,994 bytes (5.41 MiB)**. DEX grows by 264,874 bytes while the Hermes bundle shrinks by 507,856 bytes; other changes offset part of the OCR increase.

Both APKs contain only `arm64-v8a`, so ABI pruning cannot shrink these CI artifacts further.

## Top 25 entries in each APK

Ranked by ZIP entry bytes, not extracted size.

### #2208

| Entry | APK bytes | Raw bytes |
|---|---:|---:|
| `assets/index.android.bundle` | 35,784,772 | 35,784,772 |
| `lib/arm64-v8a/librnllama_v8_2_dotprod_i8mm_hexagon_opencl.so` | 5,235,937 | 13,655,016 |
| `classes.dex` | 5,000,940 | 10,576,768 |
| `lib/arm64-v8a/librnllama_v8_2_dotprod_i8mm.so` | 4,551,682 | 10,869,472 |
| `lib/arm64-v8a/librnllama_v8_2_dotprod.so` | 4,542,427 | 10,855,328 |
| `lib/arm64-v8a/librnllama_v8_2_i8mm.so` | 4,529,738 | 10,829,648 |
| `lib/arm64-v8a/librnllama_v8.so` | 4,517,266 | 10,784,536 |
| `lib/arm64-v8a/librnllama_v8_2.so` | 4,509,343 | 10,779,760 |
| `lib/arm64-v8a/librnllama.so` | 4,492,982 | 10,722,264 |
| `resources.arsc` | 2,621,508 | 2,621,508 |
| `lib/arm64-v8a/libreactnative.so` | 2,363,448 | 7,048,592 |
| `lib/arm64-v8a/libcrypto.so` | 2,282,018 | 4,978,952 |
| `lib/arm64-v8a/libavformat.so` | 2,098,669 | 5,370,200 |
| `classes2.dex` | 1,159,740 | 2,830,604 |
| `lib/arm64-v8a/libhermesvm.so` | 1,143,801 | 2,705,536 |
| `lib/arm64-v8a/libreact-native-audio-api.so` | 1,117,248 | 2,768,224 |
| `lib/arm64-v8a/libop-sqlite.so` | 889,275 | 1,912,632 |
| `lib/arm64-v8a/librnwhisper.so` | 740,748 | 1,730,176 |
| `lib/arm64-v8a/librnwhisper_v8.so` | 738,044 | 1,726,936 |
| `lib/arm64-v8a/librnwhisper_v8fp16_va_2.so` | 733,270 | 1,721,016 |
| `lib/arm64-v8a/libreanimated.so` | 572,119 | 1,668,200 |
| `assets/ggml-hexagon/libggml-htp-v73.so` | 503,388 | 957,736 |
| `assets/ggml-hexagon/libggml-htp-v81.so` | 499,067 | 944,712 |
| `assets/ggml-hexagon/libggml-htp-v79.so` | 490,955 | 911,816 |
| `assets/ggml-hexagon/libggml-htp-v75.so` | 490,479 | 903,528 |

### #2210

| Entry | APK bytes | Raw bytes |
|---|---:|---:|
| `assets/index.android.bundle` | 35,276,916 | 35,276,916 |
| `lib/arm64-v8a/librnllama_v8_2_dotprod_i8mm_hexagon_opencl.so` | 5,235,937 | 13,655,016 |
| `classes.dex` | 4,898,401 | 10,413,108 |
| `lib/arm64-v8a/librnllama_v8_2_dotprod_i8mm.so` | 4,551,682 | 10,869,472 |
| `lib/arm64-v8a/librnllama_v8_2_dotprod.so` | 4,542,427 | 10,855,328 |
| `lib/arm64-v8a/librnllama_v8_2_i8mm.so` | 4,529,738 | 10,829,648 |
| `lib/arm64-v8a/librnllama_v8.so` | 4,517,266 | 10,784,536 |
| `lib/arm64-v8a/librnllama_v8_2.so` | 4,509,343 | 10,779,760 |
| `lib/arm64-v8a/librnllama.so` | 4,492,982 | 10,722,264 |
| `lib/arm64-v8a/libmlkit_google_ocr_pipeline.so` | 4,405,669 | 11,064,544 |
| `resources.arsc` | 2,438,796 | 2,438,796 |
| `lib/arm64-v8a/libreactnative.so` | 2,363,448 | 7,048,592 |
| `lib/arm64-v8a/libcrypto.so` | 2,282,018 | 4,978,952 |
| `lib/arm64-v8a/libavformat.so` | 2,098,669 | 5,370,200 |
| `classes2.dex` | 1,527,153 | 3,724,456 |
| `lib/arm64-v8a/libhermesvm.so` | 1,143,801 | 2,705,536 |
| `lib/arm64-v8a/libreact-native-audio-api.so` | 1,117,248 | 2,768,224 |
| `lib/arm64-v8a/libop-sqlite.so` | 889,275 | 1,912,632 |
| `lib/arm64-v8a/librnwhisper.so` | 740,748 | 1,730,176 |
| `lib/arm64-v8a/librnwhisper_v8.so` | 738,044 | 1,726,936 |
| `lib/arm64-v8a/librnwhisper_v8fp16_va_2.so` | 733,270 | 1,721,016 |
| `lib/arm64-v8a/libreanimated.so` | 572,119 | 1,668,200 |
| `assets/ggml-hexagon/libggml-htp-v73.so` | 503,388 | 957,736 |
| `assets/ggml-hexagon/libggml-htp-v81.so` | 499,067 | 944,712 |
| `assets/ggml-hexagon/libggml-htp-v79.so` | 490,955 | 911,816 |

## Every native library: comparison

`lib/arm64-v8a/` is omitted from names. Asset libraries retain their full path. Every existing library is byte-size identical between the two APKs; the OCR pipeline is the only new `.so`.

| Library | #2208 APK bytes | #2210 APK bytes | #2210 raw bytes | Delta bytes |
|---|---:|---:|---:|---:|
| `assets/ggml-hexagon/libggml-htp-v73.so` | 503,388 | 503,388 | 957,736 | +0 |
| `assets/ggml-hexagon/libggml-htp-v75.so` | 490,479 | 490,479 | 903,528 | +0 |
| `assets/ggml-hexagon/libggml-htp-v79.so` | 490,955 | 490,955 | 911,816 | +0 |
| `assets/ggml-hexagon/libggml-htp-v81.so` | 499,067 | 499,067 | 944,712 | +0 |
| `libQmBlur.so` | 3,643 | 3,643 | 7,624 | +0 |
| `libandroidx.graphics.path.so` | 4,386 | 4,386 | 10,096 | +0 |
| `libanimation-decoder-gif.so` | 89,159 | 89,159 | 275,368 | +0 |
| `libappmodules.so` | 386,471 | 386,471 | 2,139,544 | +0 |
| `libavcodec.so` | 305,004 | 305,004 | 615,728 | +0 |
| `libavformat.so` | 2,098,669 | 2,098,669 | 5,370,200 | +0 |
| `libavif_android.so` | 435,915 | 435,915 | 899,752 | +0 |
| `libavutil.so` | 235,694 | 235,694 | 573,248 | +0 |
| `libc++_shared.so` | 406,557 | 406,557 | 1,292,904 | +0 |
| `libcrypto.so` | 2,282,018 | 2,282,018 | 4,978,952 | +0 |
| `libdatastore_shared_counter.so` | 2,630 | 2,630 | 7,112 | +0 |
| `libexpo-modules-core.so` | 388,933 | 388,933 | 1,589,544 | +0 |
| `libexpo-modules-jsi.so` | 34,137 | 34,137 | 91,072 | +0 |
| `libexpo-modules-v2.so` | 151,211 | 151,211 | 351,880 | +0 |
| `libexpo-modules-worklets.so` | 36,696 | 36,696 | 115,912 | +0 |
| `libexpo-updates.so` | 50,418 | 50,418 | 101,912 | +0 |
| `libexpo-widgets.so` | 32,152 | 32,152 | 89,120 | +0 |
| `libfbjni.so` | 62,764 | 62,764 | 177,000 | +0 |
| `libgesturehandler.so` | 30,676 | 30,676 | 90,488 | +0 |
| `libhermestooling.so` | 46,711 | 46,711 | 140,792 | +0 |
| `libhermesvm.so` | 1,143,801 | 1,143,801 | 2,705,536 | +0 |
| `libimagepipeline.so` | 3,175 | 3,175 | 8,760 | +0 |
| `libjsi.so` | 177,052 | 177,052 | 412,784 | +0 |
| `libmlkit_google_ocr_pipeline.so` | 0 | 4,405,669 | 11,064,544 | +4,405,669 |
| `libnative-filters.so` | 94,478 | 94,478 | 277,744 | +0 |
| `libnative-imagetranscoder.so` | 224,841 | 224,841 | 585,376 | +0 |
| `liboboe.so` | 100,758 | 100,758 | 296,080 | +0 |
| `libop-sqlite.so` | 889,275 | 889,275 | 1,912,632 | +0 |
| `libreact-native-audio-api.so` | 1,117,248 | 1,117,248 | 2,768,224 | +0 |
| `libreact_codegen_RNKC.so` | 48,470 | 48,470 | 147,960 | +0 |
| `libreact_codegen_rngesturehandler_codegen.so` | 128,299 | 128,299 | 365,984 | +0 |
| `libreact_codegen_rnscreens.so` | 302,537 | 302,537 | 1,230,440 | +0 |
| `libreact_codegen_rnsvg.so` | 231,283 | 231,283 | 771,800 | +0 |
| `libreact_codegen_safeareacontext.so` | 53,279 | 53,279 | 156,440 | +0 |
| `libreactnative.so` | 2,363,448 | 2,363,448 | 7,048,592 | +0 |
| `libreanimated.so` | 572,119 | 572,119 | 1,668,200 | +0 |
| `librnllama.so` | 4,492,982 | 4,492,982 | 10,722,264 | +0 |
| `librnllama_jni.so` | 288,506 | 288,506 | 837,464 | +0 |
| `librnllama_jni_v8.so` | 288,511 | 288,511 | 837,464 | +0 |
| `librnllama_jni_v8_2.so` | 282,504 | 282,504 | 831,232 | +0 |
| `librnllama_jni_v8_2_dotprod.so` | 282,530 | 282,530 | 831,248 | +0 |
| `librnllama_jni_v8_2_dotprod_i8mm.so` | 282,472 | 282,472 | 831,264 | +0 |
| `librnllama_jni_v8_2_dotprod_i8mm_hexagon_opencl.so` | 282,477 | 282,477 | 831,312 | +0 |
| `librnllama_jni_v8_2_i8mm.so` | 282,522 | 282,522 | 831,248 | +0 |
| `librnllama_v8.so` | 4,517,266 | 4,517,266 | 10,784,536 | +0 |
| `librnllama_v8_2.so` | 4,509,343 | 4,509,343 | 10,779,760 | +0 |
| `librnllama_v8_2_dotprod.so` | 4,542,427 | 4,542,427 | 10,855,328 | +0 |
| `librnllama_v8_2_dotprod_i8mm.so` | 4,551,682 | 4,551,682 | 10,869,472 | +0 |
| `librnllama_v8_2_dotprod_i8mm_hexagon_opencl.so` | 5,235,937 | 5,235,937 | 13,655,016 | +0 |
| `librnllama_v8_2_i8mm.so` | 4,529,738 | 4,529,738 | 10,829,648 | +0 |
| `librnscreens.so` | 35,797 | 35,797 | 103,928 | +0 |
| `librnwhisper.so` | 740,748 | 740,748 | 1,730,176 | +0 |
| `librnwhisper_v8.so` | 738,044 | 738,044 | 1,726,936 | +0 |
| `librnwhisper_v8fp16_va_2.so` | 733,270 | 733,270 | 1,721,016 | +0 |
| `libsqlite_vec.so` | 53,640 | 53,640 | 133,464 | +0 |
| `libswresample.so` | 34,948 | 34,948 | 75,064 | +0 |
| `libworklets.so` | 338,603 | 338,603 | 1,293,000 | +0 |
| `libzstd-kmp.so` | 276,362 | 276,362 | 731,872 | +0 |

## Build configuration and tree shaking

`packages/app/app.config.js` already enables `enableMinifyInReleaseBuilds`, `enableShrinkResourcesInReleaseBuilds`, Hermes V1, and disables React Native GIF/WebP support. E2E already sets `useLegacyPackaging: true`. Generated Gradle properties confirm these flags reach `minifyEnabled`, `shrinkResources` and native library packaging. Existing custom ProGuard rules are narrow React Native/BlurView member and name keeps, plus a JP2 warning suppression; no new keep rule is needed for the dependency substitution.

The Android job in `.github/workflows/pr.yml` pins `android-abis: arm64-v8a`. Its fingerprint and repack environments both set `APP_VARIANT=e2e`, `EXPO_PUBLIC_AI_DISABLE=true`, and `EXPO_PUBLIC_LOGGING_DISABLE=true`. Generated Gradle defaults list four ABIs, but the CI override selects one. Production config limits builds to ARMv7 and ARM64; use an AAB for per-device delivery rather than pruning supported production devices.

AI disable currently removes config plugins and sets `extra.aiEnabled=false`; it does not exclude React Native dependencies from autolinking. Both APKs still include Llama, Whisper, audio-api and FFmpeg. The local Gradle configuration confirms all those projects are linked with AI disabled. JavaScript tree shaking and R8 do not remove native `.so` payloads merely because the feature flag disables the UI.

`assets/index.android.bundle` starts with Hermes bytecode magic `c61fbc03c103191f`. It is stored, not deflated: 35,276,916 bytes. A level-9 zlib probe compresses the same bytecode to 11,826,982 bytes, an estimated **23,449,934-byte (22.36 MiB)** reduction before ZIP overhead. That is packaging compression, not dead-code elimination. Metro currently enables experimental import support and inline requires; source-map/module attribution is needed before promising any tree-shaking savings.

## Ranked optimizations

Savings below refer to APK bytes, are not all additive, and exclude secondary DEX changes unless measured.

| Rank | Optimization | Savings / evidence | Risk / tradeoff | Native fingerprint |
|---|---|---|---|---|
| 1 | Exclude AI native autolinking in AI-disabled builds, with matching JS boundaries | Llama 34,368,897 + Whisper 2,212,062 + Hexagon assets 1,983,889 = **36.78 MiB**, plus audio/FFmpeg below | Medium: imports/provider boot must tolerate missing modules; requires native and launch QA. Recommendation only | Yes |
| 2 | Compress the Hermes bundle in E2E | Probe estimates **22.36 MiB**; release-build result below | Low configuration risk; decompression can slow startup. Restrict to E2E; retain production mmap startup behavior | Yes, app config / Gradle property |
| 3 | Use Play-services OCR instead of bundled OCR | **5.41 MiB gross** native/model payload removed; net differs with DEX/dependencies | First-use download, Play services required; no offline OCR until model installed. Implemented | Yes |
| 4 | Remove audio-api and FFmpeg from AI-disabled linking | audio-api 1,117,248 + avcodec 305,004 + avformat 2,098,669 + avutil 235,694 + swresample 34,948 = **3.62 MiB** upper bound | Medium: verify other consumers before removing codecs; overlaps rank 1's broader AI exclusion | Yes |
| 5 | Retain one Llama CPU variant instead of seven, if AI must stay bundled | Removing six runtime/JNI pairs saves roughly **28.2 MiB**, excluding Hexagon assets | High: runtime CPU dispatch expects variant names; performance/device compatibility work. Alternative to rank 1 | Yes |
| 6 | Analyze Hermes module graph and remove unreachable AI / unused modules | Not measured; **33.64 MiB** stored bundle is the upper bound, not achievable savings | Medium: dynamic imports, i18n and service initialization affect reachability | JS-only edits normally no; Metro config may affect fingerprint |
| 7 | Fonts / images / PDF resources audit | All fonts total **0.20 MiB** compressed; `res/` totals **2.88 MiB**; PDFBox assets total **1.54 MiB**, including its font | Low upside for fonts; removing PDF CMaps/AFM can break PDF receipt extraction. No blindly safe exclusion | Native resources yes; JS-only assets depend on fingerprint coverage |
| 8 | Enable R8 + resource shrinking, compress `.so`, prune ABIs | **0 additional** for this E2E artifact: all already enabled / ARM64 only | Keep existing setup; production compression trades startup/install cost for smaller standalone APK | Config changes yes |

## Implementation and failure behavior

The receipt scanner now depends on `com.google.android.gms:play-services-mlkit-text-recognition:19.0.2`, using the same `TextRecognition` / `TextRecognizerOptions` API. Its library manifest adds `com.google.mlkit.vision.DEPENDENCIES=ocr`; Android's manifest merger places it on the application. Google documents the install-time hint for Play Store installs; sideloaded farm APKs must still tolerate a first-use model download.

`Tasks.await` propagates a failed recognition task. `finally` closes the recognizer. Expo's `AsyncFunctionComponent` catches the exception and rejects its JS promise; `ReceiptScanService.process` catches the resulting Effect cause and returns its existing `FAILED` result. No JS API or exception-swallowing change is needed. A model-download failure was not exercised on a physical device.

References: [Google's OCR Android guide](https://developers.google.com/ml-kit/vision/text-recognition/v2/android), [Expo build properties](https://docs.expo.dev/versions/latest/sdk/build-properties/), and the pinned installed Expo module exception bridge and build-properties plugin sources.

## JavaScript source-map findings

The local release Metro export contains 7,891 modules and copies 652 assets. Its indexed packager source map contains 33,101,976 source-content bytes. These are source bytes before minification/Hermes compilation, not APK savings:

| Source | Source-content bytes | Follow-up |
|---|---:|---|
| `reicon-glyphs.constant.ts` | 4,314,480 | Audit icon coverage and representation before considering subsets; icon selection is real product behavior |
| `icon-search-index.json` | 1,365,227 | Its dynamic import is still included in the native bundle; lazy evaluation is not download splitting |
| `xlsx/xlsx.js` | 835,379 | Required by PrivatBank and Inzhur import parsers; investigate a supported smaller build |
| `xlsx/dist/cpexcel.js` | 471,759 | Check supported statement encodings before excluding code-page tables |
| `lodash/lodash.js` | 545,945 | Trace the importing dependency and assess per-function or ESM imports |
| `effect/dist/Schema.js` | 360,248 | Shared core dependency; inspect retained exports rather than assuming the whole source is unused |
| `effect/dist/Effect.js` | 273,577 | Shared core dependency; same caveat |
| `effect/dist/Stream.js` | 251,212 | Trace consumers before changing imports |

Do not count all these bytes as removable. The icon picker, offline bank imports, localization, and application runtime intentionally need substantial data/code. Dynamic imports in a normal native Metro bundle defer evaluation but do not by themselves remove the module from the APK. Recommend a separate bundle audit with module attribution, before/after Hermes sizes and feature QA; no speculative tree-shaking switch is included here.

## Verified release result

A local ARM64 E2E `:app:assembleRelease` succeeded in **14m 9s** with `--no-daemon --max-workers=2 -PreactNativeArchitectures=arm64-v8a`, using the same three E2E environment variables. R8 and resource optimization completed successfully.

| Measurement | Bytes | MiB |
|---|---:|---:|
| Downloaded #2210 APK | 108,787,151 | 103.75 |
| Local optimized APK | 78,422,654 | 74.79 |
| Observed APK reduction | 30,364,497 | 28.96 |
| Identical raw Hermes bundle | 35,276,916 | 33.64 |
| Hermes compressed entry | 11,938,827 | 11.39 |
| Measured bundle packaging saving | 23,338,089 | 22.26 |

The generated Gradle property is `android.enableBundleCompression=true`, scoped to `APP_VARIANT=e2e`. The local bundle has exactly the same raw byte size as the downloaded #2210 bundle. Its measured ZIP entry savings are **22.26 MiB** (the earlier level-9 probe was an estimate; Gradle's actual compression differs). The local APK contains neither `libmlkit_google_ocr_pipeline.so` nor `assets/mlkit-google-ocr-models/`; only the Play-services metadata remains. Compressed native libraries total 51,858,978 bytes and DEX totals 6,105,919 bytes.

The **28.96 MiB** total APK reduction is an observed local-build comparison, not an isolated measurement of the dependency substitution: local native compilation, resource/signing/metadata differences also contribute. The old OCR native/model payload of **5.41 MiB** is the measured gross removal; compression contributes **22.26 MiB** for the same-sized bundle. No claim is made that CI repacking will produce a byte-identical APK. The upload through Cloudflare and first-use OCR were not exercised on a device.

The merged application manifest contains `com.google.mlkit.vision.DEPENDENCIES=ocr`. Both the dependency and E2E packaging configuration change native inputs and require a new native base/fingerprint; the PR already has the native-change acknowledgment.

## Validation

- `pnpm install --frozen-lockfile`: passed (2.4 seconds).
- `pnpm build`: passed, 14 tasks, all cached (1.389 seconds).
- `pnpm format`, `pnpm ts`, `pnpm lint`, `pnpm deadcode`, `pnpm cpd`: passed; rerun after the final configuration change, each exited zero. Knip printed advisory configuration hints; duplication was zero.
- App tests: **67 files, 483 tests passed** (12.64 seconds).
- Clean E2E Android prebuild: passed; regenerated config for bundle compression also passed.
- `:receipt-scanner:compileReleaseKotlin :app:processReleaseMainManifest`: passed (2m 17s).
- ARM64 `:app:assembleRelease`: passed (14m 9s, 1,444 tasks).
- A rejected native-promise Effect probe returned `FAILED` through the same `Effect.promise` / `catchCause` shape as the service; the Expo exception bridge and recognizer `finally` path were inspected. This is not device execution of an unavailable model.
- `git diff --check`: passed.

Follow-up proposal: exclude AI autolinking and matching JS imports in AI-disabled variants. Besides the measured size opportunity, this local release spent several minutes compiling more than 2,600 Llama native build actions for a disabled feature. Preserve full checks; remove the unnecessary build inputs rather than skipping verification.

Only source/configuration and this report are retained. Downloaded artifacts, generated Android directories, module build output and task-local scratch are removed after verification.
