import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { normalizeRouteParam } from '../../@generic/utils/normalize-route-param.util';
import { AnalyticsTransactionsModeEnum } from '../enum/analytics-transactions-mode.enum';

import type { AnalyticsTransactionsRouteParamsInterface } from '../interface/analytics-transactions-route-params.interface';
import type { AnalyticsTransactionsSearchParamsType } from '../type/analytics-transactions-search-params.type';

const getRouteParamValues = (value: string | string[] | undefined): string[] => {
    const values = Array.isArray(value) ? value : [value].filter(isDefined);

    return values.flatMap(item => item.split(',')).filter(isNotEmptyString);
};

const getTransactionType = (value: string | undefined): TransactionTypeEnum | null => {
    if (value === TransactionTypeEnum.INCOME) {
        return TransactionTypeEnum.INCOME;
    }

    if (value === TransactionTypeEnum.EXPENSE) {
        return TransactionTypeEnum.EXPENSE;
    }

    return null;
};

const getTransactionTypes = (value: string | string[] | undefined): TransactionTypeEnum[] =>
    getRouteParamValues(value).map(getTransactionType).filter(isDefined);

const getNumberParams = (value: string | string[] | undefined): number[] => getRouteParamValues(value).map(Number).filter(Number.isFinite);

const getNumberParam = (value: string | string[] | undefined): number | null => {
    const rawValue = normalizeRouteParam(value);

    if (!isNotEmptyString(rawValue)) {
        return null;
    }

    const numberValue = Number(rawValue);

    return Number.isFinite(numberValue) ? numberValue : null;
};

const getAnalyticsMode = (value: string | undefined): AnalyticsTransactionsModeEnum | null => {
    if (value === AnalyticsTransactionsModeEnum.BUDGET_OTHER) {
        return AnalyticsTransactionsModeEnum.BUDGET_OTHER;
    }

    if (value === AnalyticsTransactionsModeEnum.UNCATEGORIZED) {
        return AnalyticsTransactionsModeEnum.UNCATEGORIZED;
    }

    return null;
};

export const parseAnalyticsTransactionsRouteParams = (
    searchParams: AnalyticsTransactionsSearchParamsType
): AnalyticsTransactionsRouteParamsInterface => {
    const mode = getAnalyticsMode(normalizeRouteParam(searchParams.mode));
    const startDate = normalizeRouteParam(searchParams.startDate);
    const endDate = normalizeRouteParam(searchParams.endDate);
    const categoryId = normalizeRouteParam(searchParams.categoryId);
    const tagId = normalizeRouteParam(searchParams.tagId);
    const type = getTransactionType(normalizeRouteParam(searchParams.type));
    const types = getTransactionTypes(searchParams.types);
    const [accountIds, categoryIds, excludedCategoryIds, tagIds] = [
        searchParams.accountIds,
        searchParams.categoryIds,
        searchParams.excludedCategoryIds,
        searchParams.tagIds
    ].map(getNumberParams);
    const amountFrom = getNumberParam(searchParams.amountFrom);
    const amountTo = getNumberParam(searchParams.amountTo);

    return {
        ...(isDefined(mode) && { mode }),
        ...(isDefined(startDate) && { startDate }),
        ...(isDefined(endDate) && { endDate }),
        ...(isDefined(categoryId) && { categoryId }),
        ...(isDefined(tagId) && { tagId }),
        ...(isDefined(type) && { type }),
        ...(isNotEmptyArray(types) && { types }),
        ...(isNotEmptyArray(accountIds) && { accountIds }),
        ...(isNotEmptyArray(categoryIds) && { categoryIds }),
        ...(isNotEmptyArray(excludedCategoryIds) && { excludedCategoryIds }),
        ...(isNotEmptyArray(tagIds) && { tagIds }),
        ...(isDefined(amountFrom) && { amountFrom }),
        ...(isDefined(amountTo) && { amountTo })
    };
};
