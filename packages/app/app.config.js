import rootPkg from './package.json';

const APP_VARIANT = process.env.APP_VARIANT;
const IS_DEV = APP_VARIANT === 'development';
const IS_PREVIEW = APP_VARIANT === 'preview';

const getUniqueIdentifier = isAndroid => {
    const prefix = isAndroid ? 'com.vitaliiyehorov.suuudokuuu' : 'com.vitalyiegorov.suuudokuuu';

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
        return 'suuudokuuu (Dev)';
    }

    if (IS_PREVIEW) {
        return 'suuudokuuu (Preview)';
    }

    return 'suuudokuuu';
};

export default ({ config }) => ({
    ...config,
    name: getAppName(),
    slug: 'suuudokuuu',
    scheme: 'suuudokuuu',
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
        associatedDomains: ['applinks:suuudokuuu.com'],
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
                        host: '*.suuudokuuu.com',
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
            projectId: '4a70028a-5f9e-4ab6-9389-82d8b8b6c833'
        }
    },
    owner: 'vitalyiegorov',
    updates: {
        url: 'https://u.expo.dev/4a70028a-5f9e-4ab6-9389-82d8b8b6c833'
    },
    plugins: [
        'expo-sqlite',
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
        ['expo-router', { origin: 'https://www.suuudokuuu.com/' }],
        ['expo-font', { fonts: ['../../node_modules/@expo-google-fonts/inter/Inter_900Black.ttf'] }]
    ],
    experiments: {
        reactCompiler: true,
        buildCacheProvider: 'eas'
    },
    runtimeVersion: {
        policy: 'fingerprint'
    }
});
