import { BlurTint } from 'expo-blur';

import { ColorSchemeEnum } from '../../enum/color-scheme.enum';

export const getBlurTint = (colorScheme: ColorSchemeEnum, isIos: boolean): BlurTint => {
    if (colorScheme === ColorSchemeEnum.Dark) {
        return isIos ? 'systemChromeMaterialDark' : 'systemMaterialDark';
    }

    return isIos ? 'systemChromeMaterialLight' : 'systemMaterialLight';
};
