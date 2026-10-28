import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { useProtectedWholeAmountLabel } from '../../../@generic/hook/use-protected-whole-amount-label.hook';
import { BUDGET_DAY_STRIP_STAGGER_SPAN } from '../../constant/budget-day-strip-motion.constant';
import { BudgetDayStateEnum } from '../../enum/budget-day-state.enum';
import { resolveBudgetDayState } from '../../utils/resolve-budget-day-state.util';
import { BudgetDayStripCell } from '../budget-day-strip-cell/budget-day-strip-cell';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

export const BudgetDayStrip = ({ projection, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatWholeAmount = useProtectedWholeAmountLabel();
    const { days, elapsedDays, totalDays, dailyAllowance } = projection;
    const todayIndex = elapsedDays - 1;
    const dayCells = days.map((day, index) => ({
        key: day.date.getTime(),
        dayState: resolveBudgetDayState(day, index, todayIndex, dailyAllowance)
    }));
    const overDays = dayCells.filter(
        ({ dayState }) => dayState === BudgetDayStateEnum.OVER || dayState === BudgetDayStateEnum.FAR_OVER
    ).length;
    const overLabel = t({
        message: plural(overDays, { one: '# day over your daily allowance', other: '# days over your daily allowance' })
    });
    const accessibilityLabel = t`Day ${elapsedDays} of ${totalDays}. ${overLabel}.`;
    const accessibilityValue = { min: 1, max: totalDays, now: elapsedDays };
    const allowanceLabel = formatWholeAmount(convertFromMicroUnits(dailyAllowance), currencySymbol);

    return (
        <EntranceReveal step={1} className="gap-y-md">
            <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={accessibilityLabel}
                accessibilityValue={accessibilityValue}
                className="flex-row items-center gap-x-[3px]"
            >
                {dayCells.map(({ key, dayState }, index) => {
                    const fillDelay = (index / Math.max(todayIndex, 1)) * BUDGET_DAY_STRIP_STAGGER_SPAN;

                    return <BudgetDayStripCell key={key} dayState={dayState} fillDelay={fillDelay} />;
                })}
            </View>

            <Text className="text-xs text-secondary-foreground">{t`Each day against your ${allowanceLabel} daily allowance`}</Text>
        </EntranceReveal>
    );
};
