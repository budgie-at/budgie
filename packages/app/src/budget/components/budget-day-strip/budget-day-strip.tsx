import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { BUDGET_DAY_STRIP_STAGGER_SPAN } from '../../constant/budget-day-strip-motion.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { BudgetDayStateEnum } from '../../enum/budget-day-state.enum';
import { BudgetDayStripCell } from '../budget-day-strip-cell/budget-day-strip-cell';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
}

export const BudgetDayStrip = ({ projection }: Props) => {
    const { t } = useLingui();
    const { days, elapsedDays, totalDays, daysLeft, overall } = projection;
    const tone = BUDGET_PACE_VARIANT[overall.status];
    const todayIndex = elapsedDays - 1;
    const daysLeftLabel = t({ message: plural(daysLeft, { one: '# day left', other: '# days left' }) });
    const accessibilityLabel = t`Day ${elapsedDays} of ${totalDays}, ${daysLeftLabel}`;
    const accessibilityValue = { min: 1, max: totalDays, now: elapsedDays };

    const resolveDayState = (index: number) => {
        if (index < todayIndex) {
            return BudgetDayStateEnum.ELAPSED;
        }

        return index === todayIndex ? BudgetDayStateEnum.TODAY : BudgetDayStateEnum.FUTURE;
    };

    return (
        <EntranceReveal step={1}>
            <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={accessibilityLabel}
                accessibilityValue={accessibilityValue}
                className="flex-row gap-x-[3px]"
            >
                {days.map((day, index) => {
                    const fillDelay = (index / Math.max(todayIndex, 1)) * BUDGET_DAY_STRIP_STAGGER_SPAN;

                    return (
                        <BudgetDayStripCell key={day.date.getTime()} dayState={resolveDayState(index)} tone={tone} fillDelay={fillDelay} />
                    );
                })}
            </View>
        </EntranceReveal>
    );
};
