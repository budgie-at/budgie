import { withPodfile } from 'expo/config-plugins';

import rootPkg from './package.json';

const APP_VARIANT = process.env.APP_VARIANT;
const IS_DEV = APP_VARIANT === 'development';
const IS_E2E = APP_VARIANT === 'e2e';
const IS_PREVIEW = APP_VARIANT === 'preview';
const IS_PRODUCTION = APP_VARIANT === 'production';
const IS_AI_DISABLED = process.env.EXPO_PUBLIC_AI_DISABLE === 'true';
const IS_LOGGING_DISABLED = process.env.EXPO_PUBLIC_LOGGING_DISABLE === 'true';
const IS_PROFILING_ENABLED = process.env.EXPO_PUBLIC_PROFILING_ENABLE === 'true';
const IS_LOGGING_ENABLED = (IS_DEV || IS_PROFILING_ENABLED) && !IS_LOGGING_DISABLED;

const getUniqueIdentifier = isAndroid => {
    const prefix = isAndroid ? 'com.vitaliiyehorov.budgie' : 'com.vitalyiegorov.budgie';

    if (IS_DEV) {
        return `${prefix}.dev`;
    }

    if (IS_PREVIEW) {
        return `${prefix}.preview`;
    }

    if (IS_E2E) {
        return `${prefix}.e2e`;
    }

    return prefix;
};

const getAppGroup = () => `group.${getUniqueIdentifier(false)}`;

const getAppName = () => {
    if (IS_DEV) {
        return 'budgie (Dev)';
    }

    if (IS_PREVIEW) {
        return 'budgie (Preview)';
    }

    if (IS_E2E) {
        return 'budgie (E2E)';
    }

    return 'budgie';
};

const STRIP_EMBEDDED_FRAMEWORKS_SCRIPT_PHASE = `
  script_phase name: 'Strip Embedded Frameworks', execution_position: :any, always_out_of_date: '1', script: <<~'SCRIPT'
    set -e
    if [ "$CONFIGURATION" != "Release" ]; then
      exit 0
    fi
    for framework in "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH"/*.framework; do
      binary="$framework/$(basename "$framework" .framework)"
      if [ "$(basename "$framework")" = "hermesvm.framework" ] || [ ! -f "$binary" ]; then
        continue
      fi
      xcrun strip -x "$binary"
      if [ -n "$EXPANDED_CODE_SIGN_IDENTITY" ]; then
        codesign --force --sign "$EXPANDED_CODE_SIGN_IDENTITY" --preserve-metadata=identifier,entitlements "$framework"
      fi
    done
  SCRIPT

  post_install do |installer|`;

const ANDROID_PROGUARD_RULES = `
-dontwarn com.gemalto.jp2.**
-keepnames class com.facebook.react.ReactRootView
-keepnames class com.swmansion.rnscreens.Screen
-keepclassmembers class com.qmdeve.blurview.base.BaseBlurView { boolean mForceRedraw; }
-keepnames class com.facebook.react.uimanager.HasChildPressedStateDelay { *** setHasChildPressedStateDelay(java.lang.Boolean); }
-keepnames class com.facebook.react.views.scroll.ReactNestedScrollView { *** getScrollEnabled(); }
`;

const withStrippedIosFrameworks = config =>
    withPodfile(config, mod => {
        mod.modResults.contents = mod.modResults.contents.replace(
            '\n  post_install do |installer|',
            STRIP_EMBEDDED_FRAMEWORKS_SCRIPT_PHASE
        );

        return mod;
    });

const RECEIPT_SHARE_ACTIVATION_RULE =
    'SUBQUERY (extensionItems, $extensionItem, SUBQUERY ($extensionItem.attachments, $attachment, ANY $attachment.registeredTypeIdentifiers UTI-CONFORMS-TO "public.image" || ANY $attachment.registeredTypeIdentifiers UTI-CONFORMS-TO "com.adobe.pdf").@count == $extensionItem.attachments.@count AND $extensionItem.attachments.@count <= 10).@count == 1';

const getExpoConfig = ({ config }) => ({
    ...config,
    name: getAppName(),
    slug: 'budgie',
    scheme: 'budgie',
    version: rootPkg.version,
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    ios: {
        supportsTablet: true,
        bundleIdentifier: getUniqueIdentifier(false),
        config: {
            usesNonExemptEncryption: false
        },
        infoPlist: {
            BGTaskSchedulerPermittedIdentifiers: ['$(PRODUCT_BUNDLE_IDENTIFIER).sync.*'],
            UIBackgroundModes: ['processing'],
            NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to use the camera to scan receipts. Receipts are read on this device and never uploaded.'
        },
        associatedDomains: ['applinks:budgie.at'],
        entitlements: {
            'com.apple.developer.kernel.extended-virtual-addressing': true,
            'com.apple.developer.kernel.increased-memory-limit': true,
            'com.apple.security.application-groups': [getAppGroup()]
        },
        icon: {
            dark: './assets/icons/ios-dark.png',
            light: './assets/icons/ios-light.png',
            tinted: './assets/icons/ios-tinted.png'
        }
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/icons/adaptive-icon.png',
            monochromeImage: './assets/icons/adaptive-icon.png',
            backgroundColor: '#ffffff'
        },
        package: getUniqueIdentifier(true),
        intentFilters: [
            {
                action: 'VIEW',
                autoVerify: true,
                data: [
                    {
                        scheme: 'https',
                        host: '*.budgie.at',
                        pathPrefix: '/'
                    }
                ],
                category: ['BROWSABLE', 'DEFAULT']
            }
        ]
    },
    web: {
        favicon: './assets/favicon.png',
        bundler: 'metro'
    },
    extra: {
        appVariant: APP_VARIANT ?? 'production',
        aiEnabled: !IS_AI_DISABLED,
        loggingEnabled: IS_LOGGING_ENABLED,
        eas: {
            projectId: '41569eb3-e5c7-41f2-bea0-200d87a7fc36'
        }
    },
    locales: {
        de: './locales/ios/de.json',
        es: './locales/ios/es.json',
        fr: './locales/ios/fr.json',
        uk: './locales/ios/uk.json'
    },
    owner: 'vitalyiegorov',
    updates: {
        enabled: !IS_E2E,
        url: 'https://u.expo.dev/41569eb3-e5c7-41f2-bea0-200d87a7fc36',
        enableBsdiffPatchSupport: true,
        assetPatternsToBeBundled: ['assets/icons/*']
    },
    plugins: [
        [
            'expo-build-properties',
            {
                useHermesV1: true,
                android: {
                    enableMinifyInReleaseBuilds: true,
                    enableShrinkResourcesInReleaseBuilds: true,
                    extraProguardRules: ANDROID_PROGUARD_RULES,
                    gifEnabled: false,
                    webpEnabled: false,
                    packagingOptions: {
                        exclude: ['org/bouncycastle/pqc/**', 'org/bouncycastle/x509/**', 'org/apache/commons/codec/language/bm/**']
                    },
                    ...(IS_PRODUCTION && { buildArchs: ['armeabi-v7a', 'arm64-v8a'] })
                },
                ios: {
                    ccacheEnabled: true,
                    usePrecompiledModules: true
                }
            }
        ],
        [
            'expo-widgets',
            {
                bundleIdentifier: `${getUniqueIdentifier(false)}.BudgieWidgets`,
                groupIdentifier: getAppGroup(),
                widgets: [
                    {
                        name: 'NetWorth',
                        displayName: 'Net worth',
                        description: 'Your total balance, and whether you are growing or burning.',
                        ios: { supportedFamilies: ['systemSmall', 'systemMedium'] }
                    },
                    {
                        name: 'Budget',
                        displayName: 'Budget',
                        description: "How much of this period's budget is left.",
                        ios: { supportedFamilies: ['systemSmall', 'systemMedium'] }
                    },
                    {
                        name: 'QuickAdd',
                        displayName: 'Quick add',
                        description: 'Expense, income and transfer in one tap.',
                        ios: { supportedFamilies: ['systemMedium'] }
                    }
                ]
            }
        ],
        [
            'expo-share-intent',
            {
                iosActivationRules: RECEIPT_SHARE_ACTIVATION_RULE,
                iosAppGroupIdentifier: getAppGroup(),
                iosShareExtensionName: 'Budgie Receipt',
                disableAndroid: true
            }
        ],
        [
            'expo-quick-actions',
            {
                iosActions: [
                    { id: 'scan-receipt', title: 'Scan receipt', icon: 'symbol:doc.text.viewfinder', params: { href: '/scan-receipt' } }
                ]
            }
        ],
        'expo-asset',
        'expo-image',
        [
            'expo-file-system',
            {
                enableFileSharing: IS_E2E,
                supportsOpeningDocumentsInPlace: IS_E2E
            }
        ],
        'expo-sharing',
        'expo-localization',
        'expo-secure-store',
        'expo-background-task',
        [
            'expo-notifications',
            {
                icon: './assets/icons/ios-light.png',
                color: '#ffffff',
                defaultChannel: 'budget-alerts',
                enableBackgroundRemoteNotifications: true,
                sounds: []
            }
        ],
        [
            'expo-contacts',
            {
                contactsPermission: 'Allow $(PRODUCT_NAME) to access your contacts.'
            }
        ],
        ...(!IS_AI_DISABLED
            ? [
                  [
                      'react-native-audio-api',
                      {
                          iosBackgroundMode: true,
                          iosMicrophonePermission: 'This app requires access to the microphone to record audio.',
                          androidPermissions: [
                              'android.permission.MODIFY_AUDIO_SETTINGS',
                              'android.permission.FOREGROUND_SERVICE',
                              'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK'
                          ],
                          androidForegroundService: true,
                          androidFSTypes: ['mediaPlayback']
                      }
                  ]
              ]
            : []),
        [
            'expo-local-authentication',
            {
                faceIDPermission: 'Allow $(PRODUCT_NAME) to use Face ID for authentication'
            }
        ],
        [
            'expo-splash-screen',
            {
                image: './assets/icons/splash-icon-dark.png',
                imageWidth: 200,
                resizeMode: 'contain',
                backgroundColor: '#ffffff',
                dark: {
                    image: './assets/icons/splash-icon-light.png',
                    backgroundColor: '#000000'
                }
            }
        ],
        [
            'expo-document-picker',
            {
                iCloudContainerEnvironment: 'Production'
            }
        ],
        ['expo-router', { origin: 'https://www.budgie.at/' }],
        ...(!IS_AI_DISABLED
            ? [
                  [
                      'llama.rn',
                      {
                          enableEntitlements: true,
                          entitlementsProfile: 'production',
                          forceCxx20: true,
                          enableOpenCLAndHexagon: true
                      }
                  ]
              ]
            : [])
    ],
    experiments: {
        typedRoutes: true,
        reactCompiler: true
    },
    runtimeVersion: {
        policy: 'fingerprint'
    }
});

export default context => withStrippedIosFrameworks(getExpoConfig(context));
