import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_PACE_FILL_CLASS_NAME } from '../../constant/budget-pace-fill-class-name.constant';
import { BUDGET_PACE_RESERVED_CLASS_NAME } from '../../constant/budget-pace-reserved-class-name.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { buildBudgetPaceTrackMetrics } from '../../utils/build-budget-pace-track-metrics.util';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
}

const RING_BORDER_CLASS_NAME = {
    positive: 'border-positive-foreground',
    warning: 'border-warning-foreground',
    destructive: 'border-destructive-foreground'
} as const;

export const BudgetPaceTrack = ({ scope }: Props) => {
    const variant = BUDGET_PACE_VARIANT[scope.status];
    const { spentStyle, upcomingStyle, todayStyle, ringStyle } = buildBudgetPaceTrackMetrics(scope);

    return (
        <View className="h-5 justify-center" importantForAccessibility="no-hide-descendants">
            <View className="h-3 flex-row overflow-hidden rounded-full bg-secondary-corner">
                <View className={cn('h-full', BUDGET_PACE_FILL_CLASS_NAME[variant])} style={spentStyle} />
                <View className={cn('h-full', BUDGET_PACE_RESERVED_CLASS_NAME[variant])} style={upcomingStyle} />
            </View>
            <View className="absolute top-0 h-5 w-0.5 -ml-px rounded-full bg-primary" style={todayStyle} />
            {isDefined(ringStyle) ? (
                <View
                    className={cn(
                        'absolute top-0.5 h-4 w-4 -ml-2 rounded-full border-2 bg-primary-reverse dark:bg-secondary-background',
                        RING_BORDER_CLASS_NAME[variant]
                    )}
                    style={ringStyle}
                />
            ) : null}
        </View>
    );
};
