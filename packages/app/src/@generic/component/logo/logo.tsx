/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment */
import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { useThemeContext } from '../../../theme/context/theme.context';

const DEFAULT_SIZE = 64;

const darkLogo = require('../../../../assets/icons/splash-icon-dark.png');
const lightLogo = require('../../../../assets/icons/splash-icon-light.png');

interface Props {
    readonly size?: number;
}

export const Logo = ({ size = DEFAULT_SIZE }: Props) => {
    const { isDarkColorSchema } = useThemeContext();

    const logoSource = isDarkColorSchema ? darkLogo : lightLogo;
    const imageStyle = useMemo(() => ({ width: size, height: size }), [size]);

    return (
        <View className="items-center justify-center">
            <Image source={logoSource} style={imageStyle} resizeMode="contain" />
        </View>
    );
};

