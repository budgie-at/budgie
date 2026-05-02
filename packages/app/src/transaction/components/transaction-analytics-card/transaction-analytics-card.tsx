import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { HUNDRED_THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly label: string;
    readonly amount: number;
    readonly icon: UserIconNameEnum;
    readonly variant: ColorPaletteVariant;
}

const TABULAR_NUMS_STYLE = { fontVariant: ['tabular-nums' as const] };

export const TransactionAnalyticsCard = ({ label, icon, variant, amount }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const formatCompactDigits = useFormatCompactDigits();

    const fullAmount = formatDigits(amount, defaultInstrument.symbol);
    const compactAmount = formatCompactDigits(amount, defaultInstrument.symbol);
    const isAbbreviated = Math.abs(amount) >= HUNDRED_THOUSAND;
    const heroAmount = isAbbreviated ? compactAmount : fullAmount;

    return (
        <Card className="flex-1 gap-y-lg p-3xl items-center">
            <CircleIcon border={false} icon={icon} variant={variant} size={28} iconSize={14} radius={14} />
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="uppercase tracking-wider text-secondary-foreground text-xxs text-center"
            >
                {label}
            </Text>

            <View className="gap-y-xxs items-center w-full">
                <ProtectedText
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.7}
                    style={TABULAR_NUMS_STYLE}
                    className="text-primary text-2xl font-bold text-center"
                >
                    {heroAmount}
                </ProtectedText>
                {isAbbreviated ? (
                    <ProtectedText
                        numberOfLines={1}
                        style={TABULAR_NUMS_STYLE}
                        className="text-secondary-foreground text-xxs text-center"
                    >
                        {fullAmount}
                    </ProtectedText>
                ) : null}
            </View>
        </Card>
    );
};
