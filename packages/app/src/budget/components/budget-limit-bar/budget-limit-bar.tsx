import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_PACE_FILL_CLASS_NAME } from '../../constant/budget-pace-fill-class-name.constant';

import type { BudgetPaceVariant } from '../../type/budget-pace-variant.type';

interface Props {
    readonly spent: number;
    readonly limit: number;
    readonly tone: BudgetPaceVariant;
    readonly elapsedFraction?: number;
}

const PERCENT_MULTIPLIER = 100;

export const BudgetLimitBar = ({ spent, limit, tone, elapsedFraction }: Props) => {
    const ratio = isPositiveNumber(limit) ? Math.min(spent / limit, 1) : Number(isPositiveNumber(spent));
    const fillWidth: `${number}%` = `${Math.max(ratio, 0) * PERCENT_MULTIPLIER}%`;
    const todayLeft: `${number}%` = `${(elapsedFraction ?? 0) * PERCENT_MULTIPLIER}%`;

    return (
        <View className="h-2 justify-center">
            <View className="h-1 overflow-hidden rounded-full bg-secondary-corner">
                <View className={cn('h-full rounded-full', BUDGET_PACE_FILL_CLASS_NAME[tone])} style={{ width: fillWidth }} />
            </View>
            {isDefined(elapsedFraction) ? (
                <View className="absolute top-0 h-2 w-0.5 -ml-px rounded-full bg-primary" style={{ left: todayLeft }} />
            ) : null}
        </View>
    );
};
