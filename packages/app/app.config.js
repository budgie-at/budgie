import rootPkg from './package.json';

const APP_VARIANT = process.env.APP_VARIANT;
const IS_DEV = APP_VARIANT === 'development';
const IS_PREVIEW = APP_VARIANT === 'preview';

const getUniqueIdentifier = isAndroid => {
    const prefix = isAndroid ? 'com.vitaliiyehorov.budgie' : 'com.vitalyiegorov.budgie';

    if (IS_DEV) {
        return `${prefix}.dev`;
    }

    if (IS_PREVIEW) {
        return `${prefix}.preview`;
    }

    return prefix;
};

const getAppName = () => {
    if (IS_DEV) {
        return 'budgie (Dev)';
    }

    if (IS_PREVIEW) {
        return 'budgie (Preview)';
    }

    return 'budgie';
};

export default ({ config }) => ({
    ...config,
    name: getAppName(),
    slug: 'budgie',
    scheme: 'budgie',
    version: rootPkg.version,
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: true,
        bundleIdentifier: getUniqueIdentifier(false),
        config: {
            usesNonExemptEncryption: false
        },
        associatedDomains: ['applinks:budgie.at'],
        entitlements: {
            'com.apple.developer.kernel.extended-virtual-addressing': true,
            'com.apple.developer.kernel.increased-memory-limit': true
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
        eas: {
            projectId: '41569eb3-e5c7-41f2-bea0-200d87a7fc36'
        }
    },
    owner: 'vitalyiegorov',
    updates: {
        url: 'https://u.expo.dev/41569eb3-e5c7-41f2-bea0-200d87a7fc36',
        enableBsdiffPatchSupport: true
    },
    plugins: [
        [
            'expo-build-properties',
            {
                buildReactNativeFromSource: true,
                useHermesV1: true
            }
        ],
        './plugins/with-vec-xcframework-fix',
        'expo-asset',
        'expo-image',
        'expo-sharing',
        'expo-localization',
        'expo-secure-store',
        'expo-background-task',
        [
            'expo-contacts',
            {
                contactsPermission: 'Allow $(PRODUCT_NAME) to access your contacts.'
            }
        ],
        [
            'expo-sqlite',
            {
                enableFTS: true,
                useSQLCipher: true,
                withSQLiteVecExtension: true
            }
        ],
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
        ],
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
        [
            'llama.rn',
            {
                enableEntitlements: true,
                entitlementsProfile: 'production',
                forceCxx20: true,
                enableOpenCLAndHexagon: true
            }
        ],
        [
            'expo-font',
            {
                fonts: [
                    './assets/fonts/FixelDisplay-Regular.ttf',
                    './assets/fonts/FixelDisplay-RegularItalic.ttf',
                    './assets/fonts/FixelDisplay-Medium.ttf',
                    './assets/fonts/FixelDisplay-MediumItalic.ttf',
                    './assets/fonts/FixelDisplay-SemiBold.ttf',
                    './assets/fonts/FixelDisplay-SemiBoldItalic.ttf',
                    './assets/fonts/FixelDisplay-Bold.ttf',
                    './assets/fonts/FixelDisplay-BoldItalic.ttf'
                ],
                android: {
                    fonts: [
                        {
                            fontFamily: 'FixelDisplay',
                            fontDefinitions: [
                                {
                                    path: './assets/fonts/FixelDisplay-Regular.ttf',
                                    weight: 400
                                },
                                {
                                    path: './assets/fonts/FixelDisplay-RegularItalic.ttf',
                                    weight: 400,
                                    style: 'italic'
                                },
                                {
                                    path: './assets/fonts/FixelDisplay-Medium.ttf',
                                    weight: 500
                                },
                                {
                                    path: './assets/fonts/FixelDisplay-MediumItalic.ttf',
                                    weight: 500,
                                    style: 'italic'
                                },
                                {
                                    path: './assets/fonts/FixelDisplay-SemiBold.ttf',
                                    weight: 600
                                },
                                {
                                    path: './assets/fonts/FixelDisplay-SemiBoldItalic.ttf',
                                    weight: 600,
                                    style: 'italic'
                                },
                                {
                                    path: './assets/fonts/FixelDisplay-Bold.ttf',
                                    weight: 700
                                },
                                {
                                    path: './assets/fonts/FixelDisplay-BoldItalic.ttf',
                                    weight: 700,
                                    style: 'italic'
                                }
                            ]
                        }
                    ]
                },
                ios: {
                    fonts: [
                        './assets/fonts/FixelDisplay-Regular.ttf',
                        './assets/fonts/FixelDisplay-RegularItalic.ttf',
                        './assets/fonts/FixelDisplay-Medium.ttf',
                        './assets/fonts/FixelDisplay-MediumItalic.ttf',
                        './assets/fonts/FixelDisplay-SemiBold.ttf',
                        './assets/fonts/FixelDisplay-SemiBoldItalic.ttf',
                        './assets/fonts/FixelDisplay-Bold.ttf',
                        './assets/fonts/FixelDisplay-BoldItalic.ttf'
                    ]
                }
            }
        ]
    ],
    experiments: {
        typedRoutes: true,
        reactCompiler: true,
        buildCacheProvider: 'eas'
    },
    runtimeVersion: {
        policy: 'fingerprint'
    }
});
