import { cn } from 'cn';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { HUNDRED_THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly label: string;
    readonly amount: number;
    readonly variant: ColorPaletteVariant;
}

export const RunwayFlowCell = ({ label, amount, variant }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(0);
    const formatCompactDigits = useFormatCompactDigits();

    const isAbbreviated = Math.abs(amount) >= HUNDRED_THOUSAND;
    const value = isAbbreviated ? formatCompactDigits(amount, defaultInstrument.symbol) : formatDigits(amount, defaultInstrument.symbol);

    return (
        <View className="flex-1 items-center gap-y-xs px-sm">
            <Text numberOfLines={1} className="text-xxs uppercase tracking-wider text-secondary-foreground">
                {label}
            </Text>
            <ProtectedText
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
                className={cn('text-md font-semibold tabular-nums', FOREGROUND_COLOR_PALETTE[variant])}
            >
                {value}
            </ProtectedText>
        </View>
    );
};
