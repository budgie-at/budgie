import { BudgetPeriodEnum, convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { useProtectedWholeAmountLabel } from '../../@generic/hook/use-protected-whole-amount-label.hook';
import { BudgetDayStateEnum } from '../enum/budget-day-state.enum';

import type { BudgetDayStripCellInterface } from '../interface/budget-day-strip-cell.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

const DAYS_PER_WEEK = 7;

export const useBudgetDayStripLabels = (
    projection: Pick<BudgetProjectionInterface, 'elapsedDays' | 'totalDays' | 'dailyAllowance'>,
    period: BudgetPeriodEnum,
    dayCells: readonly Pick<BudgetDayStripCellInterface, 'dayState'>[],
    currencySymbol: string
) => {
    const { t } = useLingui();
    const formatWholeAmount = useProtectedWholeAmountLabel();
    const { elapsedDays, totalDays, dailyAllowance } = projection;
    const isYearly = period === BudgetPeriodEnum.YEARLY;
    const overCount = dayCells.filter(
        ({ dayState }) => dayState === BudgetDayStateEnum.OVER || dayState === BudgetDayStateEnum.FAR_OVER
    ).length;
    const currentWeek = Math.ceil(elapsedDays / DAYS_PER_WEEK);
    const totalWeeks = dayCells.length;
    const periodAllowance = isYearly ? dailyAllowance * DAYS_PER_WEEK : dailyAllowance;
    const allowanceLabel = formatWholeAmount(convertFromMicroUnits(periodAllowance), currencySymbol);
    const dayOverLabel = t({
        message: plural(overCount, { one: '# day over your daily allowance', other: '# days over your daily allowance' })
    });
    const weekOverLabel = t({
        message: plural(overCount, { one: '# week over your weekly allowance', other: '# weeks over your weekly allowance' })
    });

    return {
        accessibilityLabel: isYearly
            ? t`Week ${currentWeek} of ${totalWeeks}. ${weekOverLabel}.`
            : t`Day ${elapsedDays} of ${totalDays}. ${dayOverLabel}.`,
        captionLabel: isYearly
            ? t`Each week against your ${allowanceLabel} weekly allowance`
            : t`Each day against your ${allowanceLabel} daily allowance`
    };
};
