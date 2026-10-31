import { UserIconNameEnum } from '@budgie/contracts';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { useBudgetHighlightContext } from '../../context/budget-highlight.context';
import { useBudgetLimitAccessibility } from '../../hooks/use-budget-limit-accessibility.hook';
import { BudgetCategoryForecast } from '../budget-category-forecast/budget-category-forecast';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';
import { BudgetLimitRow } from '../budget-limit-row/budget-limit-row';
import { BudgetRowHighlight } from '../budget-row-highlight/budget-row-highlight';

import type { BudgetDetailsRowTestIDsInterface } from '../../interface/budget-details-row-test-ids.interface';
import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly title: string;
    readonly carriedAmount: number;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly testIDs: BudgetDetailsRowTestIDsInterface;
    readonly onPress: () => void;
    readonly highlightTarget: BudgetHighlightTargetInterface;
    readonly staggerIndex: number;
}

export const BudgetDetailsLimitRow = (props: Props) => {
    const { title, carriedAmount, scope, currencySymbol, testIDs, onPress, highlightTarget, staggerIndex } = props;
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
                className="min-h-[44px] flex-row items-center gap-x-md py-xs active:opacity-70"
                onPress={onPress}
            >
                <View className="flex-1">
                    <BudgetLimitRow
                        title={title}
                        carriedAmount={carriedAmount}
                        spent={scope.spent}
                        limit={scope.limit}
                        currencySymbol={currencySymbol}
                        spentTestID={testIDs.spent}
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
                <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
            </HapticPressable>
            <View collapsable={false} nativeID={testIDs.row} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testIDs.row} />
        </View>
    );
};
