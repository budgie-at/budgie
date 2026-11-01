import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_BAR_FILL_CLASS_NAME } from '../../constant/budget-bar-fill-class-name.constant';
import { BUDGET_PACE_RESERVED_CLASS_NAME } from '../../constant/budget-pace-reserved-class-name.constant';
import { buildBudgetPaceTrackMetrics } from '../../utils/build-budget-pace-track-metrics.util';

import type { BudgetPaceVariant } from '../../type/budget-pace-variant.type';
import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly tone: BudgetPaceVariant;
}

const RING_BORDER_CLASS_NAME = {
    positive: 'border-primary',
    warning: 'border-warning-fill',
    destructive: 'border-destructive-fill'
} as const;

export const BudgetPaceTrack = ({ scope, tone: variant }: Props) => {
    const { spentStyle, upcomingStyle, todayStyle, ringStyle } = buildBudgetPaceTrackMetrics(scope);

    return (
        <View className="h-4 justify-center" importantForAccessibility="no-hide-descendants">
            <View className="h-2 flex-row overflow-hidden rounded-full bg-secondary-corner">
                <View className={cn('h-full', BUDGET_BAR_FILL_CLASS_NAME[variant])} style={spentStyle} />
                <View className={cn('h-full', BUDGET_PACE_RESERVED_CLASS_NAME[variant])} style={upcomingStyle} />
            </View>
            <View className="absolute top-0 h-4 w-0.5 -ms-px rounded-full bg-primary" style={todayStyle} />
            {isDefined(ringStyle) ? (
                <View
                    className={cn(
                        'absolute top-0.5 h-3 w-3 -ms-1.5 rounded-full border-2 bg-primary-reverse dark:bg-secondary-background',
                        RING_BORDER_CLASS_NAME[variant]
                    )}
                    style={ringStyle}
                />
            ) : null}
        </View>
    );
};
