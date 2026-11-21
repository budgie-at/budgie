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
import { YieldLegendHeader } from '../yield-legend-header/yield-legend-header';
import { YieldLegendRow } from '../yield-legend-row/yield-legend-row';
import { YieldLegendTaxRow } from '../yield-legend-tax-row/yield-legend-tax-row';

import type { YieldGroupEnum } from '@budgie/market';

const ONE_COLUMN = 1;
const FOOTER_MAX_FONT_SIZE_MULTIPLIER = 1.5;
const MIN_KINDS_FOR_HINT = 2;

export const YieldLegend = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { cancelScrub } = use(YieldSelectionContext);
    const unfiltered = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily({ ...screenKey.key, group: null })), () => null);
    const { rows: sharedRows, taxTotal } = useYieldLegendRows();

    const handlePress = (group: YieldGroupEnum) => {
        cancelScrub();
        router.setParams({ group: screenKey.key.group === group ? '' : group });
    };

    const hasTax = isPositiveNumber(unfiltered?.tax);
    const isCompact = Math.max(taxTotal, ...sharedRows.map(row => row.total)) >= MILLION;

    const isFilterActive = isDefined(screenKey.key.group);
    const isHintVisible = !isDefined(screenKey.scopeId) && (unfiltered?.groups.length ?? 0) >= MIN_KINDS_FOR_HINT;
    const hint = isFilterActive ? t`Tap again to show all` : t`Tap a kind to filter`;
    const hintText = isHintVisible ? (
        <Text className="shrink-0 text-[13px] text-secondary-foreground" maxFontSizeMultiplier={FOOTER_MAX_FONT_SIZE_MULTIPLIER}>
            {hint}
        </Text>
    ) : null;

    return (
        <View className="gap-y-xs">
            <YieldLegendHeader hint={hintText} />
            <View className="-mx-sm" accessibilityLabel={t`Passive income by kind`} testID={PassiveIncomeSelector.Legend(ONE_COLUMN)}>
                {sharedRows.map(({ group, total, share }) => (
                    <YieldLegendRow key={group} group={group} total={total} share={share} isCompact={isCompact} onPress={handlePress} />
                ))}
                {hasTax ? <YieldLegendTaxRow total={taxTotal} isCompact={isCompact} /> : null}
            </View>
        </View>
    );
};
