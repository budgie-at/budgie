import { AccountTypeEnum } from '@budgie/contracts';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useAccountBalancesUpdatedAtQuery } from '../../account/query/use-account-balances-updated-at.query';
import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useLiquidBalanceQuery = (): number => {
    const { defaultInstrument } = useSettingsContext();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const exchangeRatesUpdatedAt = useExchangeRatesUpdatedAtQuery();
    const queryDependencies = [defaultInstrument.id, accountBalancesUpdatedAt, exchangeRatesUpdatedAt];
    const { data: cashRows } = useDatabaseLiveQuery(
        accountBalanceRepository.getTotalByAccountType(defaultInstrument.id, AccountTypeEnum.CASH),
        queryDependencies
    );
    const { data: bankRows } = useDatabaseLiveQuery(
        accountBalanceRepository.getTotalByAccountType(defaultInstrument.id, AccountTypeEnum.BANK),
        queryDependencies
    );
    const { data: bankSyncRows } = useDatabaseLiveQuery(
        accountBalanceRepository.getTotalByAccountType(defaultInstrument.id, AccountTypeEnum.BANK_SYNC),
        queryDependencies
    );

    return (cashRows.at(0)?.total ?? 0) + (bankRows.at(0)?.total ?? 0) + (bankSyncRows.at(0)?.total ?? 0);
};
