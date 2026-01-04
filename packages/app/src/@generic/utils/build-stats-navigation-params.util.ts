import { TransactionFilterInterface } from '@budgie/contracts';

export const buildStatsNavigationParams = (
    filters: TransactionFilterInterface,
    isIncome: boolean,
    additionalParams?: Record<string, string>
): Record<string, string> => {
    const params: Record<string, string> = {
        type: isIncome ? 'INCOME' : 'EXPENSE',
        ...additionalParams
    };

    if (filters.date?.from) {
        // eslint-disable-next-line dot-notation
        params['startDate'] = filters.date.from.toISOString();
    }

    if (filters.date?.to) {
        // eslint-disable-next-line dot-notation
        params['endDate'] = filters.date.to.toISOString();
    }

    return params;
};
