import { RunwayDriverDimensionEnum } from '@budgie/contracts';
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
    readonly dimension: RunwayDriverDimensionEnum;
    readonly maxAmount: number;
}

const QUIET_BAR_CLASSNAME = 'h-full rounded-full bg-secondary-foreground';

const titleVariants = cva('shrink text-sm', {
    variants: {
        isFolded: {
            true: 'text-secondary-foreground',
            false: 'font-medium text-primary'
        }
    }
});

const amountVariants = cva('text-sm tabular-nums', {
    variants: {
        isFolded: {
            true: 'font-medium text-secondary-foreground',
            false: 'font-semibold text-primary'
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

export const RunwayDriverRow = ({ driver, dimension, maxAmount }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(0);

    const { foldedDriverCount } = driver;
    const isFolded = isPositiveNumber(foldedDriverCount);
    const foldedTitle = t`Other · ${foldedDriverCount}`;
    const emptyTitle = dimension === RunwayDriverDimensionEnum.TAG ? t`Untagged` : t`Uncategorized`;
    const namedTitle = isNotEmptyString(driver.title) ? driver.title : emptyTitle;
    const title = isFolded ? foldedTitle : namedTitle;
    const formattedAmount = formatDigits(convertFromMicroUnits(driver.monthlyAmount), defaultInstrument.symbol);
    const barClassName = isFolded ? QUIET_BAR_CLASSNAME : barVariants({ isIrregular: driver.isIrregular });
    const share = isPositiveNumber(maxAmount) ? driver.monthlyAmount / maxAmount : 0;
    const shareStyle: ViewStyle = { width: `${Math.round(share * 100)}%` };

    return (
        <View className="gap-y-sm">
            <View className="flex-row items-center justify-between gap-x-md">
                <View className="shrink flex-row items-center gap-x-sm">
                    <Text numberOfLines={1} className={titleVariants({ isFolded })}>
                        {title}
                    </Text>

                    {driver.isIrregular ? (
                        <View className="shrink-0 rounded-full border border-warning-corner bg-warning-background px-xs py-xxs">
                            <Text className="text-xxs font-semibold text-warning-foreground">
                                <Trans>One-off</Trans>
                            </Text>
                        </View>
                    ) : null}
                </View>

                <Text numberOfLines={1} className={amountVariants({ isFolded })}>
                    <Trans>{formattedAmount} / mo</Trans>
                </Text>
            </View>

            <View className="h-1 overflow-hidden rounded-full bg-secondary-corner">
                <View className={barClassName} style={shareStyle} />
            </View>
        </View>
    );
};
