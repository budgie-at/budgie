import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View, ViewStyle } from 'react-native';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

import type { RunwayDriverInterface } from '../../interface/runway-driver.interface';

interface Props {
    readonly driver: RunwayDriverInterface;
    readonly maxAmount: number;
}

const nameVariants = cva('text-sm font-medium', {
    variants: {
        isIrregular: {
            true: 'text-secondary-foreground',
            false: 'text-primary'
        }
    }
});

const barVariants = cva('h-full rounded-full', {
    variants: {
        isIrregular: {
            true: 'bg-warning-foreground',
            false: 'bg-destructive-foreground'
        }
    }
});

export const RunwayDriverRow = ({ driver, maxAmount }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const title = isNotEmptyString(driver.title) ? driver.title : t`Uncategorized`;
    const formattedAmount = formatDigits(convertFromMicroUnits(driver.monthlyAmount), defaultInstrument.symbol);
    const share = isPositiveNumber(maxAmount) ? driver.monthlyAmount / maxAmount : 0;
    const shareStyle: ViewStyle = { width: `${Math.round(share * 100)}%` };

    return (
        <View className="gap-y-sm">
            <View className="flex-row items-baseline justify-between">
                <View className="flex-row items-center gap-x-xs">
                    <Text className={nameVariants({ isIrregular: driver.isIrregular })}>{title}</Text>
                    {driver.isIrregular ? (
                        <View className="rounded-full border border-warning-corner bg-warning-background px-sm py-xxs">
                            <Text className="text-xxs font-semibold text-warning-foreground">
                                <Trans>One-off</Trans>
                            </Text>
                        </View>
                    ) : null}
                </View>

                <Text className="text-sm font-semibold tabular-nums text-primary">
                    <Trans>{formattedAmount} / mo</Trans>
                </Text>
            </View>

            <View className="h-2 overflow-hidden rounded-full bg-secondary-corner">
                <View className={barVariants({ isIrregular: driver.isIrregular })} style={shareStyle} />
            </View>
        </View>
    );
};
