import { TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { CategorizeInboxKindEnum } from '../../categorize-inbox/enum/categorize-inbox-kind.enum';
import { buildUncategorizedRouteParams } from '../../transaction/utils/build-uncategorized-route-params.util';

export const useStatisticsCardPress = (
    filters: TransactionFilterInterface,
    isIncome: boolean,
    inboxKind: CategorizeInboxKindEnum,
    entityParams: Record<string, string> | null
) => {
    const router = useRouter();

    return () => {
        const type = isIncome ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;
        if (!isDefined(entityParams)) {
            router.push({
                pathname: '/categorize',
                params: { kind: inboxKind, ...buildUncategorizedRouteParams({ ...filters, types: [type] }, null) }
            });

            return;
        }

        router.push({
            pathname: '/analytics/transactions',
            params: {
                type,
                ...entityParams,
                ...(filters.date?.from && { startDate: filters.date.from.toISOString() }),
                ...(filters.date?.to && { endDate: filters.date.to.toISOString() })
            }
        });
    };
};
