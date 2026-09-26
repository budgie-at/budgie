import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { AnalyticsTransactionsModeEnum } from '../enum/analytics-transactions-mode.enum';
import type { TransactionFilterInterface } from '@budgie/contracts';

const buildNullableArrayParam = (values: readonly (number | string)[] | null): string | null => {
    if (isNotEmptyArray(values)) {
        return values.join(',');
    }

    return null;
};

export const buildUncategorizedRouteParams = (filters: TransactionFilterInterface, mode: AnalyticsTransactionsModeEnum) => {
    const types = buildNullableArrayParam(filters.types);
    const accountIds = buildNullableArrayParam(filters.accountIds);
    const tagIds = buildNullableArrayParam(filters.tagIds);
    const startDate = filters.date?.from?.toISOString() ?? null;
    const endDate = filters.date?.to?.toISOString() ?? null;
    const amountFrom = filters.amount?.from?.toString() ?? null;
    const amountTo = filters.amount?.to?.toString() ?? null;

    return {
        mode,
        ...(isDefined(types) && { types }),
        ...(isDefined(accountIds) && { accountIds }),
        ...(isDefined(tagIds) && { tagIds }),
        ...(isDefined(startDate) && { startDate }),
        ...(isDefined(endDate) && { endDate }),
        ...(isDefined(amountFrom) && { amountFrom }),
        ...(isDefined(amountTo) && { amountTo })
    };
};
