const fs = require('fs');

const packageJsonPath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const excludedPackages = [
    'expo-dev-client',
    'expo-dev-launcher',
    'expo-dev-menu',
    'expo-dev-menu-interface',
    'llama.rn',
    'react-native-audio-api'
];

packageJson.expo ??= {};
packageJson.expo.autolinking ??= {};
packageJson.expo.autolinking.exclude = [...new Set(excludedPackages)];

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 4)}\n`);
console.log('Applied E2E autolinking excludes');
