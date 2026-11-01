import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_PACE_RESERVED_CLASS_NAME } from '../../constant/budget-pace-reserved-class-name.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { buildBudgetPaceTrackMetrics } from '../../utils/build-budget-pace-track-metrics.util';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

const FILL_CLASS_NAME = {
    positive: 'bg-positive-gauge',
    warning: 'bg-warning-fill',
    destructive: 'bg-destructive-fill'
} as const;

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
}

export const BudgetPaceTrack = ({ scope }: Props) => {
    const isAmountProtected = useIsAmountProtected();
    const variant = BUDGET_PACE_VARIANT[scope.status];
    const { isOverBudget, neutralStyle, fillStyle, reservedStyle, markerStyle, labelStyle } = buildBudgetPaceTrackMetrics(scope);
    const limitLabelStyle = labelStyle;
    const isFillVisible = !isAmountProtected;
    const withinPlanClassName = isOverBudget ? 'bg-[#F4C2BE] opacity-100 dark:bg-destructive-fill/35' : FILL_CLASS_NAME[variant];
    const isMarkerVisible = isFillVisible && !isOverBudget;
    const isReservedVisible = isFillVisible && !isOverBudget;
    const trackClassName = isOverBudget ? 'gap-x-[3px]' : 'bg-secondary-corner';

    return (
        <View className="mt-sm h-3.5 justify-center" importantForAccessibility="no-hide-descendants">
            <View className={cn('h-1.5 flex-row items-center overflow-hidden rounded-full', trackClassName)}>
                {isFillVisible ? <View className={cn('h-full opacity-35', withinPlanClassName)} style={neutralStyle} /> : null}
                {isFillVisible ? <View className={cn('h-full', FILL_CLASS_NAME[variant])} style={fillStyle} /> : null}
                {isReservedVisible ? (
                    <View className={cn('h-[3px]', BUDGET_PACE_RESERVED_CLASS_NAME[variant])} style={reservedStyle} />
                ) : null}
            </View>
            {isMarkerVisible ? <View className="absolute top-0 h-3.5 w-0.5 -ms-px rounded-full bg-primary" style={markerStyle} /> : null}
            {isFillVisible && isOverBudget ? (
                <Text
                    className="absolute -top-3.5 -ms-6 w-12 text-center text-[11px] font-semibold text-secondary-foreground"
                    style={limitLabelStyle}
                >
                    <Trans>Limit</Trans>
                </Text>
            ) : null}
            {isMarkerVisible ? (
                <Text
                    className="absolute -top-3.5 -ms-6 w-12 text-center text-[11px] font-semibold text-secondary-foreground"
                    style={labelStyle}
                >
                    <Trans>Today</Trans>
                </Text>
            ) : null}
        </View>
    );
};
