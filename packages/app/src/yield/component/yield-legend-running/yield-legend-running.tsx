import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldPriorLabel } from '../../hook/use-yield-prior-label.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { buildYieldRunningTotal } from '../../utils/build-yield-running-total.util';
import { YieldLegendFootnote } from '../yield-legend-footnote/yield-legend-footnote';
import { YieldLegendHeader } from '../yield-legend-header/yield-legend-header';
import { YieldLegendLineSwatch } from '../yield-legend-line-swatch/yield-legend-line-swatch';

const rowVariants = cva('flex-row gap-x-md gap-y-xs', { variants: { isAccessibilityText: { true: 'flex-wrap', false: '' } } });
const AMOUNT_CLASSNAME = 'text-sm font-semibold tabular-nums text-primary';

export const YieldLegendRunning = () => {
    const { t } = useLingui();
    const { selectedIndex } = use(YieldSelectionContext);
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const summary = useYieldSummary();
    const isAccessibilityText = useIsAccessibilityTextSize();

    const cumulative = buildYieldRunningTotal(summary?.buckets.map(bucket => bucket.total) ?? []);
    const prior = isDefined(summary?.priorTotals) ? buildYieldRunningTotal(summary.priorTotals) : null;
    const index = selectedIndex ?? cumulative.length - 1;
    const approximate = summary?.buckets.slice(0, index + 1).some(bucket => bucket.isEstimated) === true ? '≈ ' : '';
    const currentAmount = `${approximate}${formatAmount(cumulative.at(index) ?? 0, symbol)}`;
    const priorAmount = formatAmount(prior?.at(index) ?? prior?.at(-1) ?? 0, symbol);
    const currentLabel = t`This period`;
    const priorLabel = useYieldPriorLabel();

    return (
        <View className="items-start gap-y-xs" accessibilityLabel={t`Running total legend`}>
            <YieldLegendHeader />
            <View className={rowVariants({ isAccessibilityText })}>
                <View
                    accessible
                    accessibilityLabel={t`${currentLabel}, ${currentAmount}`}
                    className="min-h-[24px] shrink flex-row items-center gap-x-xs"
                >
                    <YieldLegendLineSwatch strokeClassName="accent-positive-action" strokeWidth={2} />
                    <Text className="shrink text-sm text-primary" numberOfLines={1}>
                        {currentLabel}
                    </Text>
                    <Text className={AMOUNT_CLASSNAME}>{currentAmount}</Text>
                </View>
                {isDefined(prior) ? (
                    <View
                        accessible
                        accessibilityLabel={t`${priorLabel}, ${priorAmount}`}
                        className="min-h-[24px] shrink flex-row items-center gap-x-xs"
                    >
                        <YieldLegendLineSwatch strokeClassName="accent-secondary-foreground" strokeWidth={1.5} dash="4 3" />
                        <Text className="shrink text-sm text-primary" numberOfLines={1}>
                            {priorLabel}
                        </Text>
                        <Text className={AMOUNT_CLASSNAME}>{priorAmount}</Text>
                    </View>
                ) : null}
            </View>
            <YieldLegendFootnote />
        </View>
    );
};
