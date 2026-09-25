import { DEFAULT_TRANSACTION_FILTER, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { AnalyticsTransactionsRouteParamsInterface } from '../interface/analytics-transactions-route-params.interface';
import type { AmountRangeInterface, TransactionFilterInterface } from '@budgie/contracts';

const buildTypes = (params: AnalyticsTransactionsRouteParamsInterface): TransactionTypeEnum[] => {
    if (isNotEmptyArray(params.types)) {
        return params.types;
    }

    if (isDefined(params.type)) {
        return [params.type];
    }

    return [TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE];
};

const buildFilterIds = (values?: number[]): number[] | null => {
    if (isNotEmptyArray(values)) {
        return values;
    }

    return null;
};

const buildAmountRange = (params: AnalyticsTransactionsRouteParamsInterface): AmountRangeInterface | null => {
    if (!isDefined(params.amountFrom) && !isDefined(params.amountTo)) {
        return null;
    }

    return { from: params.amountFrom ?? null, to: params.amountTo ?? null };
};

export const buildUncategorizedFilters = (params: AnalyticsTransactionsRouteParamsInterface): TransactionFilterInterface => ({
    ...DEFAULT_TRANSACTION_FILTER,
    types: buildTypes(params),
    date: {
        from: isDefined(params.startDate) ? new Date(params.startDate) : null,
        to: isDefined(params.endDate) ? new Date(params.endDate) : null
    },
    accountIds: buildFilterIds(params.accountIds),
    tagIds: buildFilterIds(params.tagIds),
    amount: buildAmountRange(params)
});
