import { BudgetPaceStatusEnum } from '@budgie/budget';
import { BudgetPeriodEnum, convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { useProtectedWholeAmountLabel } from '../../@generic/hook/use-protected-whole-amount-label.hook';
import { BudgetDayStateEnum } from '../enum/budget-day-state.enum';

import type { BudgetDayStripCellInterface } from '../interface/budget-day-strip-cell.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

const DAYS_PER_WEEK = 7;

export const useBudgetDayStripLabels = (
    projection: Pick<BudgetProjectionInterface, 'elapsedDays' | 'totalDays' | 'dailyAllowance' | 'overall'>,
    period: BudgetPeriodEnum,
    dayCells: readonly Pick<BudgetDayStripCellInterface, 'dayState'>[],
    currencySymbol: string
) => {
    const { t } = useLingui();
    const formatWholeAmount = useProtectedWholeAmountLabel();
    const { elapsedDays, totalDays, dailyAllowance, overall } = projection;
    const isYearly = period === BudgetPeriodEnum.YEARLY;
    const overDays = dayCells.filter(
        ({ dayState }) => dayState === BudgetDayStateEnum.OVER || dayState === BudgetDayStateEnum.FAR_OVER
    ).length;
    const currentWeek = Math.ceil(elapsedDays / DAYS_PER_WEEK);
    const totalWeeks = dayCells.length;
    const periodAllowance = isYearly ? dailyAllowance * DAYS_PER_WEEK : dailyAllowance;
    const allowanceLabel = formatWholeAmount(convertFromMicroUnits(periodAllowance), currencySymbol);
    const dayOverLabel = t({
        message: plural(overDays, { one: '# day over your daily allowance', other: '# days over your daily allowance' })
    });
    const weekOverLabel = t({
        message: plural(overDays, { one: '# week over your weekly allowance', other: '# weeks over your weekly allowance' })
    });

    const overLabel = isYearly ? weekOverLabel : dayOverLabel;
    const safeLabel = formatWholeAmount(convertFromMicroUnits(overall.safePerDay), currencySymbol);
    const dailyCaption =
        overall.status === BudgetPaceStatusEnum.OVER
            ? t`Each day against your ${allowanceLabel} daily allowance`
            : t`Each day against the ${allowanceLabel}/day plan. ${safeLabel}/day from today keeps you on budget.`;

    return {
        accessibilityLabel: isYearly
            ? t`Week ${currentWeek} of ${totalWeeks}. ${overLabel}.`
            : t`Day ${elapsedDays} of ${totalDays}. ${overLabel}.`,
        captionLabel: isYearly ? t`Each week against your ${allowanceLabel} weekly allowance` : dailyCaption
    };
};
