import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { useBudgetHighlightContext } from '../../context/budget-highlight.context';
import { useBudgetLimitAccessibility } from '../../hooks/use-budget-limit-accessibility.hook';
import { resolveBudgetDetailsRowTestIDs } from '../../utils/resolve-budget-details-row-test-ids.util';
import { BudgetCategoryForecast } from '../budget-category-forecast/budget-category-forecast';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';
import { BudgetLimitRow } from '../budget-limit-row/budget-limit-row';
import { BudgetRowChevron } from '../budget-row-chevron/budget-row-chevron';
import { BudgetRowHighlight } from '../budget-row-highlight/budget-row-highlight';

import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetProjectionScopeInterface } from '@budgie/budget';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly carriedAmount: number;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly icon: UserIconType;
    readonly onPress: () => void;
    readonly highlightTarget: BudgetHighlightTargetInterface;
    readonly staggerIndex: number;
}

export const BudgetDetailsLimitRow = (props: Props) => {
    const { title, carriedAmount, scope, currencySymbol, icon, onPress, highlightTarget, staggerIndex } = props;
    const testIDs = resolveBudgetDetailsRowTestIDs(highlightTarget);
    const { target, hint } = useBudgetHighlightContext();
    const rowRef = useRef<View>(null);
    const [hasBeenHighlighted, setHasBeenHighlighted] = useState(false);
    const { accessibilityLabel, accessibilityValue } = useBudgetLimitAccessibility(title, scope, currencySymbol);
    const isHighlightTarget = (candidate: BudgetHighlightTargetInterface | null) =>
        isDefined(candidate) && candidate.scope === highlightTarget.scope && candidate.categoryId === highlightTarget.categoryId;
    const isHighlighted = isHighlightTarget(target);

    if (isHighlighted && !hasBeenHighlighted) {
        setHasBeenHighlighted(true);
    }

    return (
        <View ref={rowRef} className="relative" collapsable={false}>
            {hasBeenHighlighted ? <BudgetRowHighlight rowRef={rowRef} isHighlighted={isHighlighted} /> : null}
            <HapticPressable
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
                accessibilityValue={accessibilityValue}
                className="min-h-[44px] flex-row items-start gap-x-xl py-xs active:opacity-70"
                onPress={onPress}
            >
                <GroupedListIcon icon={icon} />
                <View className="flex-1 pt-md">
                    <BudgetLimitRow
                        title={title}
                        carriedAmount={carriedAmount}
                        spent={scope.spent}
                        limit={scope.limit}
                        currencySymbol={currencySymbol}
                        spentTestID={testIDs.spent}
                        trailing={<BudgetRowChevron />}
                    >
                        <BudgetLimitBar
                            spent={scope.spent}
                            limit={scope.limit}
                            tone={BUDGET_PACE_VARIANT[scope.status]}
                            elapsedFraction={scope.elapsedFraction}
                            staggerIndex={staggerIndex}
                        />
                        {isHighlightTarget(hint) ? null : <BudgetCategoryForecast scope={scope} currencySymbol={currencySymbol} />}
                    </BudgetLimitRow>
                </View>
            </HapticPressable>
            <View collapsable={false} nativeID={testIDs.row} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testIDs.row} />
        </View>
    );
};
