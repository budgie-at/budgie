import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BANK_LOGO_RADIUS_RATIO } from '../../constant/bank-logo-radius-ratio.constant';
import { ENABLE_BANKING_LOGO } from '../../constant/enable-banking-logo.constant';
import { getEnableBankingLogoSlug } from '../../utils/get-enable-banking-logo-slug.util';

interface Props {
    readonly name: string;
    readonly size: number;
}

const LETTER_SIZE_RATIO = 0.47;

export const EnableBankingBankLogo = ({ name, size }: Props) => {
    const slug = getEnableBankingLogoSlug(name);
    const tileStyle = {
        width: size,
        height: size,
        borderRadius: Math.round(size * BANK_LOGO_RADIUS_RATIO),
        borderCurve: 'continuous' as const
    };

    if (isDefined(slug)) {
        return <Image source={ENABLE_BANKING_LOGO[slug]} style={tileStyle} contentFit="cover" />;
    }

    const letterStyle = { fontSize: Math.round(size * LETTER_SIZE_RATIO) };

    return (
        <View className="items-center justify-center bg-surface-disc" style={tileStyle}>
            <Text className="font-semibold text-primary" style={letterStyle}>
                {name.trim().charAt(0).toLocaleUpperCase()}
            </Text>
        </View>
    );
};
