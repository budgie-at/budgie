import { isDefined } from '@rnw-community/shared';

import type { TransactionFilterInterface } from '@budgie/contracts';

const buildNullableArrayKey = (values: readonly (number | string)[] | null): string => values?.join(',') ?? 'null';

export const buildTransactionFilterKey = (filters?: TransactionFilterInterface): string => {
    if (!isDefined(filters)) {
        return 'null';
    }

    const from = filters.date?.from?.getTime() ?? 'null';
    const to = filters.date?.to?.getTime() ?? 'null';

    return [
        buildNullableArrayKey(filters.accountIds),
        buildNullableArrayKey(filters.categoryIds),
        buildNullableArrayKey(filters.tagIds),
        buildNullableArrayKey(filters.types),
        from,
        to
    ].join('|');
};
