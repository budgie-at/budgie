import { useEffect, useEffectEvent, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { useBudgetHighlightContext } from '../../context/budget-highlight.context';
import { BudgetCategoryForecast } from '../budget-category-forecast/budget-category-forecast';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';
import { BudgetLimitRow } from '../budget-limit-row/budget-limit-row';

import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly title: string;
    readonly carriedAmount: number;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly spentTestID: string;
    readonly onPress: () => void;
    readonly highlightTarget: BudgetHighlightTargetInterface;
}

const HIGHLIGHT_FADE_DURATION = 240;
const HIGHLIGHT_HOLD_DURATION = 1200;

export const BudgetDetailsLimitRow = (props: Props) => {
    const { title, carriedAmount, scope, currencySymbol, testID, spentTestID, onPress, highlightTarget } = props;
    const { target, reveal } = useBudgetHighlightContext();
    const reducedMotion = useReducedMotion();
    const rowRef = useRef<View>(null);
    const highlightProgress = useSharedValue(0);
    const highlightStyle = useAnimatedStyle(() => ({ opacity: highlightProgress.value }));
    const isHighlighted = isDefined(target) && target.scope === highlightTarget.scope && target.categoryId === highlightTarget.categoryId;

    const handleHighlight = useEffectEvent(() => {
        const fadeDuration = reducedMotion ? 0 : HIGHLIGHT_FADE_DURATION;

        highlightProgress.set(
            withSequence(
                withTiming(1, { duration: fadeDuration }),
                withDelay(HIGHLIGHT_HOLD_DURATION, withTiming(0, { duration: fadeDuration }))
            )
        );

        if (isDefined(rowRef.current)) {
            reveal(rowRef.current);
        }
    });

    useEffect(() => {
        if (isHighlighted) {
            handleHighlight();
        }
    }, [target, isHighlighted]);

    return (
        <View ref={rowRef} className="relative" collapsable={false}>
            <Animated.View
                pointerEvents="none"
                style={highlightStyle}
                className="absolute -inset-x-2 -inset-y-1.5 rounded-2xl bg-warning-background"
            />
            <HapticPressable accessibilityRole="button" onPress={onPress}>
                <BudgetLimitRow
                    title={title}
                    carriedAmount={carriedAmount}
                    spent={scope.spent}
                    limit={scope.limit}
                    currencySymbol={currencySymbol}
                    spentTestID={spentTestID}
                >
                    <BudgetLimitBar
                        spent={scope.spent}
                        limit={scope.limit}
                        tone={BUDGET_PACE_VARIANT[scope.status]}
                        elapsedFraction={scope.elapsedFraction}
                    />
                    <BudgetCategoryForecast scope={scope} currencySymbol={currencySymbol} />
                </BudgetLimitRow>
            </HapticPressable>
            <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
        </View>
    );
};
