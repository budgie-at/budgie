import type { ScreenChromeColorScheme } from '@rnw-community/react-native-screen-chrome';
import type { BlurTint } from 'expo-blur';

export const getBlurTint = (colorScheme: ScreenChromeColorScheme, isIos: boolean): BlurTint => {
    if (colorScheme === 'dark') {
        return 'systemThinMaterialDark';
    }

    return isIos ? 'systemChromeMaterialLight' : 'systemMaterialLight';
};
