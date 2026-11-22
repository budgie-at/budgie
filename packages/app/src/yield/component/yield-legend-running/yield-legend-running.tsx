import { YieldRangeEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { buildYieldSummaryRunningTotals } from '../../utils/build-yield-summary-running-totals.util';
import { YieldLegendFootnote } from '../yield-legend-footnote/yield-legend-footnote';
import { YieldLegendHeader } from '../yield-legend-header/yield-legend-header';
import { YieldLegendRunningRow } from '../yield-legend-running-row/yield-legend-running-row';

export const YieldLegendRunning = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const summary = useYieldSummary();

    const { cumulative, prior } = buildYieldSummaryRunningTotals(summary ?? { buckets: [], priorTotals: null });
    const index = selectedIndex ?? cumulative.length - 1;
    const approximate = summary?.buckets.slice(0, index + 1).some(bucket => bucket.isEstimated) === true ? '≈ ' : '';
    const currentAmount = `${approximate}${formatAmount(cumulative.at(index) ?? 0, symbol)}`;
    const priorAmount = formatAmount(prior?.at(index) ?? prior?.at(-1) ?? 0, symbol);
    const currentLabel = screenKey.key.range === YieldRangeEnum.YEAR ? t`Last 12 months` : t`This period`;
    const priorLabel = screenKey.key.range === YieldRangeEnum.YEAR ? t`Previous 12 months` : t`Previous period`;

    return (
        <View className="gap-y-xs" accessibilityLabel={t`Running total legend`}>
            <YieldLegendHeader title={t`Running total`} />
            <View className="gap-y-xs">
                <YieldLegendRunningRow
                    label={currentLabel}
                    amount={currentAmount}
                    accessibilityLabel={t`${currentLabel}, ${currentAmount}`}
                    strokeClassName="accent-positive-action"
                    strokeWidth={2}
                />
                {isDefined(prior) ? (
                    <YieldLegendRunningRow
                        label={priorLabel}
                        amount={priorAmount}
                        accessibilityLabel={t`${priorLabel}, ${priorAmount}`}
                        strokeClassName="accent-secondary-foreground/60"
                        strokeWidth={1.5}
                    />
                ) : null}
            </View>
            <YieldLegendFootnote />
        </View>
    );
};
