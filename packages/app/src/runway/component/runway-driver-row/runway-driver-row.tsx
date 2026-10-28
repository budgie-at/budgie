import { RunwayDriverDimensionEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { GrowBar } from '../../../@generic/component/grow-bar/grow-bar';
import { STATUS_TONE_FILL_CLASS_NAME } from '../../../@generic/constant/status-tone-fill-class-name.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { StatusToneType } from '../../../@generic/type/status-tone.type';
import type { RunwayDriverInterface } from '../../interface/runway-driver.interface';

interface Props {
    readonly driver: RunwayDriverInterface;
    readonly dimension: RunwayDriverDimensionEnum;
    readonly maxAmount: number;
    readonly rank: number;
    readonly tone: StatusToneType;
}

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

export const RunwayDriverRow = ({ driver, dimension, maxAmount, rank, tone }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useFormatDigits(0);
    const formatProtectedAmount = useProtectedAmountLabel();

    const { foldedDriverCount } = driver;
    const isFolded = isPositiveNumber(foldedDriverCount);
    const foldedTitle = t`Other · ${foldedDriverCount}`;
    const emptyTitle = dimension === RunwayDriverDimensionEnum.TAG ? t`Untagged` : t`Uncategorized`;
    const namedTitle = isNotEmptyString(driver.title) ? driver.title : emptyTitle;
    const title = isFolded ? foldedTitle : namedTitle;
    const formattedAmount = formatDigits(convertFromMicroUnits(driver.monthlyAmount), defaultInstrument.symbol);
    const protectedAmount = formatProtectedAmount(convertFromMicroUnits(driver.monthlyAmount), defaultInstrument.symbol);
    const barToneClassName = rank === 0 && !isFolded ? STATUS_TONE_FILL_CLASS_NAME[tone] : 'bg-primary/70';
    const share = isPositiveNumber(maxAmount) ? driver.monthlyAmount / maxAmount : 0;

    return (
        <View accessible accessibilityLabel={t`${title}, ${protectedAmount} per month`} className="min-h-[44px] justify-center gap-y-sm">
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

            <View className="h-[3px] overflow-hidden rounded-full bg-secondary-corner">
                <GrowBar ratio={share} className={cn('h-full rounded-full', barToneClassName)} staggerIndex={rank} />
            </View>
        </View>
    );
};
