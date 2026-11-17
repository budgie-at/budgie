import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { router } from 'expo-router';
import { use } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsLargeText } from '../../../@generic/hook/use-is-large-text.hook';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { selectYieldScrubbedBuckets } from '../../utils/select-yield-scrubbed-buckets.util';
import { YieldLegendRow } from '../yield-legend-row/yield-legend-row';

import type { YieldGroupEnum } from '@budgie/market';

const ONE_COLUMN = 1;
const TWO_COLUMNS = 2;

export const YieldLegend = () => {
    const { t } = useLingui();
    const isLargeText = useIsLargeText();
    const { screenKey, mode } = use(YieldScreenContext);
    const { selectedIndex, cancelScrub } = use(YieldSelectionContext);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    const handlePress = (group: YieldGroupEnum) => {
        cancelScrub();
        router.setParams({ group: screenKey.key.group === group ? '' : group });
    };

    const scrubbedBuckets = selectYieldScrubbedBuckets(summary?.buckets ?? [], selectedIndex, mode);
    const rows = (summary?.groups ?? []).map(({ group, total }) => ({
        group,
        total: isDefined(selectedIndex) ? scrubbedBuckets.reduce((sum, item) => sum + item.amounts[group], 0) : total
    }));
    const columns = isLargeText ? ONE_COLUMN : TWO_COLUMNS;

    return (
        <View className="flex-row flex-wrap" accessibilityLabel={t`Passive income by kind`} testID={PassiveIncomeSelector.Legend(columns)}>
            {rows.map(({ group, total }) => (
                <YieldLegendRow key={group} group={group} total={total} onPress={handlePress} />
            ))}
        </View>
    );
};
