import { BudgetPeriodEnum } from '@budgie/contracts';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { getBudgetPeriodLabelDate } from '../utils/get-budget-period-label-date.util';

export const useFormatBudgetPeriod = () => {
    const { formatShortMonth, formatFullMonth, formatYear, formatMonthAndDay } = useFormatDate();

    const formatShortPeriod = (period: BudgetPeriodEnum, periodStart: Date, periodEnd: Date): string => {
        if (period === BudgetPeriodEnum.MONTHLY) {
            return formatShortMonth(getBudgetPeriodLabelDate(periodStart, periodEnd));
        }

        return period === BudgetPeriodEnum.YEARLY ? formatYear(periodStart) : formatMonthAndDay(periodStart);
    };

    const formatFullPeriod = (period: BudgetPeriodEnum, periodStart: Date, periodEnd: Date): string => {
        if (period === BudgetPeriodEnum.MONTHLY) {
            return formatFullMonth(getBudgetPeriodLabelDate(periodStart, periodEnd));
        }

        return period === BudgetPeriodEnum.YEARLY
            ? formatYear(periodStart)
            : `${formatMonthAndDay(periodStart)} – ${formatMonthAndDay(periodEnd)}`;
    };

    return { formatShortPeriod, formatFullPeriod };
};
