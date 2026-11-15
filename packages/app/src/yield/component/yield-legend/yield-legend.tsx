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
import { YieldLegendRow } from '../yield-legend-row/yield-legend-row';

import type { YieldGroupEnum } from '@budgie/market';

const ONE_COLUMN = 1;
const TWO_COLUMNS = 2;

export const YieldLegend = () => {
    const { t } = useLingui();
    const isLargeText = useIsLargeText();
    const { screenKey } = use(YieldScreenContext);
    const { selectedIndex, cancelScrub } = use(YieldSelectionContext);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    const handlePress = (group: YieldGroupEnum) => {
        cancelScrub();
        router.setParams({ group: screenKey.key.group === group ? '' : group });
    };

    const bucket = isDefined(selectedIndex) ? summary?.buckets.at(selectedIndex) : null;
    const columns = isLargeText ? ONE_COLUMN : TWO_COLUMNS;

    return (
        <View className="flex-row flex-wrap" accessibilityLabel={t`Passive income by kind`} testID={PassiveIncomeSelector.Legend(columns)}>
            {(summary?.groups ?? []).map(({ group, total }) => (
                <YieldLegendRow key={group} group={group} total={bucket?.amounts[group] ?? total} onPress={handlePress} />
            ))}
        </View>
    );
};
