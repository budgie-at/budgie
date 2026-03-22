import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useTrackedLiveQuery } from '../../@generic/hook/use-tracked-live-query.hook';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { ACCOUNT_BALANCE_LIVE_QUERY_TABLE_NAMES } from '../constant/account-balance-live-query-table-names.constant';

export const useAccountBalanceQuery = (accountId: number) => {
    const { data } = useTrackedLiveQuery(
        accountBalanceRepository.getByAccountId(accountId),
        [accountId],
        ACCOUNT_BALANCE_LIVE_QUERY_TABLE_NAMES
    );
    const { balance } = data.at(0) ?? { balance: 0 };

    return { balance: convertFromMicroUnits(balance) };
};
