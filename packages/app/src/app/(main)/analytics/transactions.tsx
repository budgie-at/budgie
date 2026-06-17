import { TransactionTypeEnum } from '@budgie/contracts';
import { useLocalSearchParams } from 'expo-router';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { AnalyticsTransactionsRoute } from '../../../transaction/components/analytics-transactions-route/analytics-transactions-route';
import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';

const getRouteParam = (value: string | string[] | undefined): string | null => {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
};

const getRouteParamValues = (value: string | string[] | undefined): string[] => {
    const values = Array.isArray(value) ? value : [value].filter(isDefined);

    return values.flatMap(item => item.split(',')).filter(isNotEmptyString);
};

const getTransactionType = (value: string | null): TransactionTypeEnum | null => {
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

const getAnalyticsMode = (value: string | null): AnalyticsTransactionsModeEnum | null => {
    if (value === AnalyticsTransactionsModeEnum.BUDGET_OTHER) {
        return AnalyticsTransactionsModeEnum.BUDGET_OTHER;
    }

    if (value === AnalyticsTransactionsModeEnum.UNCATEGORIZED) {
        return AnalyticsTransactionsModeEnum.UNCATEGORIZED;
    }

    return null;
};

export default function AnalyticsTransactionsPage() {
    const searchParams = useLocalSearchParams<{
        readonly mode?: string | string[];
        readonly startDate?: string | string[];
        readonly endDate?: string | string[];
        readonly categoryId?: string | string[];
        readonly tagId?: string | string[];
        readonly type?: string | string[];
        readonly types?: string | string[];
        readonly accountIds?: string | string[];
        readonly excludedCategoryIds?: string | string[];
        readonly tagIds?: string | string[];
    }>();
    const mode = getAnalyticsMode(getRouteParam(searchParams.mode));
    const startDate = getRouteParam(searchParams.startDate);
    const endDate = getRouteParam(searchParams.endDate);
    const categoryId = getRouteParam(searchParams.categoryId);
    const tagId = getRouteParam(searchParams.tagId);
    const type = getTransactionType(getRouteParam(searchParams.type));
    const types = getTransactionTypes(searchParams.types);
    const accountIds = getNumberParams(searchParams.accountIds);
    const excludedCategoryIds = getNumberParams(searchParams.excludedCategoryIds);
    const tagIds = getNumberParams(searchParams.tagIds);
    const params: AnalyticsTransactionsRouteParamsInterface = {
        ...(isDefined(mode) && { mode }),
        ...(isDefined(startDate) && { startDate }),
        ...(isDefined(endDate) && { endDate }),
        ...(isDefined(categoryId) && { categoryId }),
        ...(isDefined(tagId) && { tagId }),
        ...(isDefined(type) && { type }),
        ...(isNotEmptyArray(types) && { types }),
        ...(isNotEmptyArray(accountIds) && { accountIds }),
        ...(isNotEmptyArray(excludedCategoryIds) && { excludedCategoryIds }),
        ...(isNotEmptyArray(tagIds) && { tagIds })
    };

    return <AnalyticsTransactionsRoute params={params} />;
}
