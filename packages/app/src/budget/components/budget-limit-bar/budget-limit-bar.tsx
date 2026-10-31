import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GrowBar } from '../../../@generic/component/grow-bar/grow-bar';
import { cn } from '../../../@generic/utils/cn.util';

import type { BudgetPaceVariant } from '../../type/budget-pace-variant.type';

interface Props {
    readonly spent: number;
    readonly limit: number;
    readonly tone: BudgetPaceVariant;
    readonly elapsedFraction?: number;
    readonly staggerIndex?: number;
}

const PERCENT_MULTIPLIER = 100;
const BAR_FILL_CLASS_NAME: Record<BudgetPaceVariant, string> = {
    positive: 'bg-primary/85',
    warning: 'bg-warning-fill',
    destructive: 'bg-destructive-fill'
};

export const BudgetLimitBar = ({ spent, limit, tone, elapsedFraction, staggerIndex = 0 }: Props) => {
    const ratio = Math.max(isPositiveNumber(limit) ? Math.min(spent / limit, 1) : Number(isPositiveNumber(spent)), 0);
    const todayStart: `${number}%` = `${(elapsedFraction ?? 0) * PERCENT_MULTIPLIER}%`;
    const todayStyle = { start: todayStart };

    return (
        <View className="h-[11px] justify-center">
            <View className="h-[3px] overflow-hidden rounded-full bg-secondary-corner">
                <GrowBar ratio={ratio} className={cn('h-full rounded-full', BAR_FILL_CLASS_NAME[tone])} staggerIndex={staggerIndex} />
            </View>
            {isDefined(elapsedFraction) ? (
                <View className="absolute top-[1px] h-[9px] w-[2px] -ms-[1px] rounded-full bg-secondary-foreground/70" style={todayStyle} />
            ) : null}
        </View>
    );
};
