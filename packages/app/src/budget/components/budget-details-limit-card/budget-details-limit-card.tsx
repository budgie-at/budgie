import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useEffectEvent, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useBudgetHighlightContext } from '../../context/budget-highlight.context';
import { BudgetCategoryForecast } from '../budget-category-forecast/budget-category-forecast';
import { BudgetPaceTrack } from '../budget-pace-track/budget-pace-track';

import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetProjectionScopeInterface } from '@budgie/budget';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly spentTestID: string;
    readonly onPress: () => void;
    readonly highlightTarget: BudgetHighlightTargetInterface;
}

const HIGHLIGHT_FADE_DURATION = 240;
const HIGHLIGHT_HOLD_DURATION = 1200;

export const BudgetDetailsLimitCard = (props: Props) => {
    const { children, scope, currencySymbol, testID, spentTestID, onPress, highlightTarget } = props;
    const { target, reveal } = useBudgetHighlightContext();
    const reducedMotion = useReducedMotion();
    const cardRef = useRef<View>(null);
    const highlightProgress = useSharedValue(0);
    const highlightStyle = useAnimatedStyle(() => ({ opacity: highlightProgress.value }));
    const isHighlighted = isDefined(target) && target.scope === highlightTarget.scope && target.categoryId === highlightTarget.categoryId;
    const formatDigits = useDisplayFormatDigits();
    const { t } = useLingui();

    const handleHighlight = useEffectEvent(() => {
        const fadeDuration = reducedMotion ? 0 : HIGHLIGHT_FADE_DURATION;

        highlightProgress.set(
            withSequence(
                withTiming(1, { duration: fadeDuration }),
                withDelay(HIGHLIGHT_HOLD_DURATION, withTiming(0, { duration: fadeDuration }))
            )
        );

        if (isDefined(cardRef.current)) {
            reveal(cardRef.current);
        }
    });

    useEffect(() => {
        if (isHighlighted) {
            handleHighlight();
        }
    }, [target, isHighlighted]);

    const remainingAmount = scope.limit - scope.spent;
    const remainingLabel = remainingAmount < 0 ? t`Over budget` : t`Left`;

    return (
        <View ref={cardRef} className="relative" collapsable={false}>
            <Card variant="ghost" size="md" onPress={onPress} className="gap-y-md">
                <View className="gap-y-xs">
                    <View className="flex-row items-center gap-x-md">{children}</View>
                    <BudgetCategoryForecast scope={scope} currencySymbol={currencySymbol} />
                </View>

                <BudgetPaceTrack scope={scope} />

                <View className="flex-row justify-between gap-x-md">
                    <View className="flex-1">
                        <Text className="text-secondary-foreground text-xs">{t`Spent`}</Text>
                        <ProtectedText testID={spentTestID} className="text-primary text-sm font-semibold tabular-nums">
                            {formatDigits(convertFromMicroUnits(scope.spent), currencySymbol)}
                        </ProtectedText>
                    </View>
                    <View className="flex-1 items-center">
                        <Text className="text-secondary-foreground text-xs">{remainingLabel}</Text>
                        <ProtectedText className="text-primary text-sm font-semibold tabular-nums">
                            {formatDigits(convertFromMicroUnits(Math.abs(remainingAmount)), currencySymbol)}
                        </ProtectedText>
                    </View>
                    <View className="flex-1 items-end">
                        <Text className="text-secondary-foreground text-xs">{t`Limit`}</Text>
                        <ProtectedText className="text-primary text-sm font-semibold tabular-nums">
                            {formatDigits(convertFromMicroUnits(scope.limit), currencySymbol)}
                        </ProtectedText>
                    </View>
                </View>
            </Card>
            <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, highlightStyle]}
                className="rounded-5xl border-2 border-warning-corner"
            />
            <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
        </View>
    );
};
