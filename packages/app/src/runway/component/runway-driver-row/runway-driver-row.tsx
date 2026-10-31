import { RunwayDriverDimensionEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View, useWindowDimensions } from 'react-native';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { GrowBar } from '../../../@generic/component/grow-bar/grow-bar';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RunwayDriverAmount } from '../runway-driver-amount/runway-driver-amount';

import type { RunwayDriverInterface } from '../../interface/runway-driver.interface';

interface Props {
    readonly driver: RunwayDriverInterface;
    readonly dimension: RunwayDriverDimensionEnum;
    readonly maxAmount: number;
    readonly rank: number;
}

const titleVariants = cva('shrink text-[15px]', {
    variants: {
        isFolded: {
            true: 'text-secondary-foreground',
            false: 'text-primary'
        }
    }
});

const headlineVariants = cva('gap-x-md', {
    variants: {
        isStacked: {
            true: 'gap-y-xs',
            false: 'flex-row items-center justify-between'
        }
    }
});

const ACCESSIBILITY_FONT_SCALE = 1.6;

export const RunwayDriverRow = ({ driver, dimension, maxAmount, rank }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatProtectedAmount = useProtectedAmountLabel();
    const isStacked = useWindowDimensions().fontScale >= ACCESSIBILITY_FONT_SCALE;

    const { foldedDriverCount } = driver;
    const isFolded = isPositiveNumber(foldedDriverCount);
    const foldedTitle =
        dimension === RunwayDriverDimensionEnum.TAG
            ? t({ message: plural(foldedDriverCount, { one: 'Other (# tag)', other: 'Other (# tags)' }) })
            : t({ message: plural(foldedDriverCount, { one: 'Other (# category)', other: 'Other (# categories)' }) });
    const emptyTitle = dimension === RunwayDriverDimensionEnum.TAG ? t`Untagged` : t`Uncategorized`;
    const namedTitle = isNotEmptyString(driver.title) ? driver.title : emptyTitle;
    const title = isFolded ? foldedTitle : namedTitle;
    const protectedAmount = formatProtectedAmount(convertFromMicroUnits(driver.monthlyAmount), defaultInstrument.symbol);
    const share = isPositiveNumber(maxAmount) ? driver.monthlyAmount / maxAmount : 0;
    const titleLineCount = isStacked ? 3 : 1;

    return (
        <View
            accessible
            accessibilityLabel={t`${title}, ${protectedAmount} per month`}
            className="min-h-[52px] justify-center gap-y-sm px-3xl py-md"
        >
            <View className={headlineVariants({ isStacked })}>
                <View className="shrink flex-row flex-wrap items-center gap-x-sm">
                    <Text numberOfLines={titleLineCount} className={titleVariants({ isFolded })}>
                        {title}
                    </Text>

                    {driver.isIrregular ? (
                        <Text className="shrink-0 text-xs text-warning-foreground">
                            <Trans>One-off</Trans>
                        </Text>
                    ) : null}
                </View>

                <RunwayDriverAmount monthlyAmount={driver.monthlyAmount} isFolded={isFolded} />
            </View>

            {isFolded ? null : (
                <View className="h-[4px] overflow-hidden rounded-full bg-surface-fill">
                    <GrowBar ratio={share} className="h-full rounded-full bg-primary/70" staggerIndex={rank} />
                </View>
            )}
        </View>
    );
};
