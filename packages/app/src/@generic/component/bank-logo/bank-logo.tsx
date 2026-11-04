import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { BANK_LOGO } from '../../constant/bank-logo.constant';
import { BANK_PROVIDER_LOGO_SLUG } from '../../constant/bank-provider-logo-slug.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { getBankLogoSlug } from '../../utils/get-bank-logo-slug.util';
import { CircleIcon } from '../circle-icon/circle-icon';

interface Props {
    readonly bankProvider?: ExternalSourceEnum;
    readonly bankName?: string | null;
    readonly size?: number;
}

const TILE_RADIUS_RATIO = 0.28;
const LETTER_SIZE_RATIO = 0.47;

export const BankLogo = ({ bankProvider, bankName, size = 32 }: Props) => {
    const hasName = isNotEmptyString(bankName);
    const nameSlug = hasName ? getBankLogoSlug(bankName) : null;
    const slug = (isDefined(bankProvider) ? BANK_PROVIDER_LOGO_SLUG[bankProvider] : null) ?? nameSlug;
    const radius = Math.round(size * TILE_RADIUS_RATIO);
    const tileStyle = { width: size, height: size, borderRadius: radius, borderCurve: 'continuous' as const };

    if (isDefined(slug)) {
        return (
            <View className="overflow-hidden border-hairline border-surface-separator" style={tileStyle}>
                <Image source={BANK_LOGO[slug]} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
        );
    }

    if (!hasName) {
        return (
            <CircleIcon
                icon={UserIconNameEnum.Landmark}
                variant="primary"
                border={false}
                size={size}
                iconSize={Math.round(size / 2)}
                radius={radius}
                className="bg-surface-disc"
            />
        );
    }

    const letterStyle = { fontSize: Math.round(size * LETTER_SIZE_RATIO) };

    return (
        <View className="items-center justify-center bg-surface-disc" style={tileStyle}>
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="font-semibold text-primary" style={letterStyle}>
                {bankName.trim().charAt(0).toLocaleUpperCase()}
            </Text>
        </View>
    );
};
