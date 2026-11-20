import { YieldGroupEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useIsLargeText } from '../../../@generic/hook/use-is-large-text.hook';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { selectYieldScrubbedBuckets } from '../../utils/select-yield-scrubbed-buckets.util';
import { YieldLegendRow } from '../yield-legend-row/yield-legend-row';
import { YieldLegendTaxRow } from '../yield-legend-tax-row/yield-legend-tax-row';

const ONE_COLUMN = 1;
const TWO_COLUMNS = 2;

export const YieldLegend = () => {
    const { t } = useLingui();
    const isLargeText = useIsLargeText();
    const { screenKey, mode } = use(YieldScreenContext);
    const { selectedIndex, cancelScrub } = use(YieldSelectionContext);
    const summary = useYieldSummary();

    const handlePress = (group: YieldGroupEnum) => {
        cancelScrub();
        router.setParams({ group: screenKey.key.group === group ? '' : group });
    };

    const scrubbedBuckets = selectYieldScrubbedBuckets(summary?.buckets ?? [], selectedIndex, mode);
    const rows = (summary?.groups ?? []).map(({ group, total }) => ({
        group,
        total: isDefined(selectedIndex) ? scrubbedBuckets.reduce((sum, item) => sum + item.amounts[group], 0) : total
    }));
    const taxRowTotal = isDefined(selectedIndex)
        ? scrubbedBuckets.reduce((sum, item) => sum + item.amounts[YieldGroupEnum.TAX], 0)
        : (summary?.tax ?? 0);
    const hasTax = isPositiveNumber(summary?.tax);
    const columns = isLargeText ? ONE_COLUMN : TWO_COLUMNS;
    const itemCount = rows.length + Number(hasTax);
    const isFullWidthAt = (position: number) => isLargeText || (itemCount % TWO_COLUMNS === 1 && position === itemCount - 1);

    return (
        <View className="flex-row flex-wrap" accessibilityLabel={t`Passive income by kind`} testID={PassiveIncomeSelector.Legend(columns)}>
            {rows.map(({ group, total }, position) => (
                <YieldLegendRow key={group} group={group} total={total} isFullWidth={isFullWidthAt(position)} onPress={handlePress} />
            ))}
            {hasTax ? <YieldLegendTaxRow total={taxRowTotal} isFullWidth={isFullWidthAt(rows.length)} /> : null}
        </View>
    );
};
