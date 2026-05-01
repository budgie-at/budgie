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
        <Card className="flex-1 gap-y-3xl p-3xl">
            <View className="flex-row items-center gap-x-md">
                <CircleIcon border={false} icon={icon} variant={variant} size={24} iconSize={12} radius={12} />
                <Text className="uppercase tracking-wider text-secondary-foreground text-xxs">{label}</Text>
            </View>

            <View className="gap-y-xxs">
                <ProtectedText
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.7}
                    style={TABULAR_NUMS_STYLE}
                    className="text-primary text-2xl font-bold"
                >
                    {heroAmount}
                </ProtectedText>
                {isAbbreviated ? (
                    <ProtectedText numberOfLines={1} style={TABULAR_NUMS_STYLE} className="text-secondary-foreground text-xxs text-center">
                        {fullAmount}
                    </ProtectedText>
                ) : null}
            </View>
        </Card>
    );
};
