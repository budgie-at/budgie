import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { STATUS_TONE_FILL_CLASS_NAME } from '../../../@generic/constant/status-tone-fill-class-name.constant';
import { cn } from '../../../@generic/utils/cn.util';

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
    const fillStyle = { width: fillWidth };
    const todayStyle = { left: todayLeft };

    return (
        <View className="h-[11px] justify-center">
            <View className="h-[3px] overflow-hidden rounded-full bg-secondary-corner">
                <View className={cn('h-full rounded-full', STATUS_TONE_FILL_CLASS_NAME[tone])} style={fillStyle} />
            </View>
            {isDefined(elapsedFraction) ? (
                <View className="absolute top-0 h-[11px] w-[1.5px] -ml-[0.75px] rounded-full bg-primary" style={todayStyle} />
            ) : null}
        </View>
    );
};
