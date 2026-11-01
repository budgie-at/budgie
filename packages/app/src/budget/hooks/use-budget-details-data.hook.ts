import { getInclusiveEnd } from '@budgie/budget';

import { isDefined } from '@rnw-community/shared';

import { useToday } from '../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { useGetBudgetProjectionQuery } from '../query/use-get-budget-projection.query';
import { formatBudgetPeriodLabel } from '../utils/format-budget-period-label.util';
import { resolveBudgetWindow } from '../utils/resolve-budget-window.util';

import type { BudgetEntityInterface } from '@budgie/contracts';

export const useBudgetDetailsData = (budget: BudgetEntityInterface) => {
    const today = useToday();
    const { formatMonthAndDay } = useFormatDate();
    const { projection, isLoading } = useGetBudgetProjectionQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { periodStart, nextPeriodStart } = resolveBudgetWindow(budget, today);

    return {
        projection,
        isLoading,
        periodStart,
        periodEnd: getInclusiveEnd(nextPeriodStart),
        currencySymbol: isDefined(instrument) ? instrument.symbol : '',
        dateLabel: formatBudgetPeriodLabel(budget, formatMonthAndDay)
    };
};
