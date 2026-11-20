import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { router } from 'expo-router';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { MILLION } from '../../../i18n/constant/compact-thresholds.constant';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldLegendRows } from '../../hook/use-yield-legend-rows.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { pickYieldCompactDivisor } from '../../utils/pick-yield-compact-divisor.util';
import { YieldLegendHeader } from '../yield-legend-header/yield-legend-header';
import { YieldLegendRow } from '../yield-legend-row/yield-legend-row';
import { YieldLegendTaxRow } from '../yield-legend-tax-row/yield-legend-tax-row';

import type { YieldGroupEnum } from '@budgie/market';

const ONE_COLUMN = 1;
const FOOTER_MAX_FONT_SIZE_MULTIPLIER = 1.5;

export const YieldLegend = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { cancelScrub } = use(YieldSelectionContext);
    const unfiltered = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily({ ...screenKey.key, group: null })), () => null);
    const { rows, taxTotal } = useYieldLegendRows();

    const handlePress = (group: YieldGroupEnum) => {
        cancelScrub();
        router.setParams({ group: screenKey.key.group === group ? '' : group });
    };

    const rowsTotal = Math.max(
        rows.reduce((sum, row) => sum + row.total, 0),
        1
    );
    const sharedRows = rows.map(row => ({ ...row, share: row.total / rowsTotal }));
    const hasTax = isPositiveNumber(unfiltered?.tax);
    const divisor = pickYieldCompactDivisor(Math.max(taxTotal, ...rows.map(row => row.total)), MILLION);

    const isFilterActive = isDefined(screenKey.key.group);

    return (
        <View className="gap-y-xs">
            <YieldLegendHeader />
            <View className="-mx-sm" accessibilityLabel={t`Passive income by kind`} testID={PassiveIncomeSelector.Legend(ONE_COLUMN)}>
                {sharedRows.map(({ group, total, share }) => (
                    <YieldLegendRow key={group} group={group} total={total} share={share} divisor={divisor} onPress={handlePress} />
                ))}
                {hasTax ? <YieldLegendTaxRow total={taxTotal} divisor={divisor} /> : null}
            </View>
            {isFilterActive ? null : (
                <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={FOOTER_MAX_FONT_SIZE_MULTIPLIER}>
                    {t`Tap a kind to filter`}
                </Text>
            )}
        </View>
    );
};
