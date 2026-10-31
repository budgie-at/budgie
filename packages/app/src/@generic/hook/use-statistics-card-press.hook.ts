import { TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { CategorizeInboxKindEnum } from '../../categorize-inbox/enum/categorize-inbox-kind.enum';
import { ROUTE_DATE_FORMAT } from '../../transaction/constant/route-date-format.constant';
import { buildUncategorizedRouteParams } from '../../transaction/utils/build-uncategorized-route-params.util';

export const useStatisticsCardPress = (
    filters: TransactionFilterInterface,
    type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE,
    inboxKind: CategorizeInboxKindEnum,
    entityParams: Record<string, string> | null
) => {
    const router = useRouter();

    return () => {
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
                ...(filters.date?.from && { startDate: format(filters.date.from, ROUTE_DATE_FORMAT) }),
                ...(filters.date?.to && { endDate: format(filters.date.to, ROUTE_DATE_FORMAT) }),
                ...(isDefined(filters.accountIds) && { accountIds: filters.accountIds.join(',') }),
                ...(isDefined(filters.amount?.from) && { amountFrom: String(filters.amount.from) }),
                ...(isDefined(filters.amount?.to) && { amountTo: String(filters.amount.to) })
            }
        });
    };
};
