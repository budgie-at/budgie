import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useTrackedLiveQuery } from '../../@generic/hook/use-tracked-live-query.hook';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { ARCHIVED_ACCOUNT_BALANCE_LIVE_QUERY_TABLE_NAMES } from '../constant/account-balance-live-query-table-names.constant';

export const useArchivedAccountBalanceQuery = (accountId: number) => {
    const { data } = useTrackedLiveQuery(
        accountBalanceRepository.getArchivedAccountBalance(accountId),
        [accountId],
        ARCHIVED_ACCOUNT_BALANCE_LIVE_QUERY_TABLE_NAMES
    );
    const { balance } = data.at(0) ?? { balance: 0 };

    return { balance: convertFromMicroUnits(balance) };
};
