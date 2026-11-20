import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useIsLargeText } from '../../../@generic/hook/use-is-large-text.hook';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldLegendRows } from '../../hook/use-yield-legend-rows.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendRow } from '../yield-legend-row/yield-legend-row';
import { YieldLegendTaxRow } from '../yield-legend-tax-row/yield-legend-tax-row';

import type { YieldGroupEnum } from '@budgie/market';

const ONE_COLUMN = 1;
const TWO_COLUMNS = 2;

export const YieldLegend = () => {
    const { t } = useLingui();
    const isLargeText = useIsLargeText();
    const { screenKey } = use(YieldScreenContext);
    const { cancelScrub } = use(YieldSelectionContext);
    const summary = useYieldSummary();
    const { rows, taxTotal } = useYieldLegendRows();

    const handlePress = (group: YieldGroupEnum) => {
        cancelScrub();
        router.setParams({ group: screenKey.key.group === group ? '' : group });
    };

    const hasTax = isPositiveNumber(summary?.tax);
    const columns = isLargeText ? ONE_COLUMN : TWO_COLUMNS;
    const itemCount = rows.length;
    const isFullWidthAt = (position: number) => isLargeText || (itemCount % TWO_COLUMNS === 1 && position === itemCount - 1);

    return (
        <View>
            <View
                className="-mx-sm flex-row flex-wrap"
                accessibilityLabel={t`Passive income by kind`}
                testID={PassiveIncomeSelector.Legend(columns)}
            >
                {rows.map(({ group, total }, position) => (
                    <YieldLegendRow key={group} group={group} total={total} isFullWidth={isFullWidthAt(position)} onPress={handlePress} />
                ))}
            </View>
            {hasTax ? <YieldLegendTaxRow total={taxTotal} /> : null}
        </View>
    );
};
