import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { router } from 'expo-router';
import { use } from 'react';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { MILLION, THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldLegendRows } from '../../hook/use-yield-legend-rows.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendRow } from '../yield-legend-row/yield-legend-row';
import { YieldLegendTaxRow } from '../yield-legend-tax-row/yield-legend-tax-row';

import type { YieldGroupEnum } from '@budgie/market';

const ONE_COLUMN = 1;

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
    const compactThreshold = [...rows.map(row => row.total), taxTotal].some(total => total >= MILLION) ? THOUSAND : MILLION;

    return (
        <View>
            <View className="-mx-sm" accessibilityLabel={t`Passive income by kind`} testID={PassiveIncomeSelector.Legend(ONE_COLUMN)}>
                {sharedRows.map(({ group, total, share }) => (
                    <YieldLegendRow
                        key={group}
                        group={group}
                        total={total}
                        share={share}
                        compactThreshold={compactThreshold}
                        onPress={handlePress}
                    />
                ))}
                {hasTax ? <YieldLegendTaxRow total={taxTotal} compactThreshold={compactThreshold} /> : null}
            </View>
        </View>
    );
};
