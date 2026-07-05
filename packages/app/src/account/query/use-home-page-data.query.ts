import { AccountDebtTypeEnum, AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';

import type { HomeAccountBalanceSummaryInterface } from '../interface/home-account-balance-summary.interface';
import type { HomeAccountBalanceInterface } from '../interface/home-account-balance.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

const createHomeAccountBalanceSummary = () => ({
    accountTypeTotals: new Map<AccountTypeEnum, number>(),
    balancesByAccountId: new Map<number, HomeAccountBalanceInterface>(),
    bankProviderTotals: new Map<ExternalSourceEnum, number>(),
    cryptoCount: 0,
    cryptoTotal: 0,
    debtTypeTotals: new Map<AccountDebtTypeEnum, number>(),
    fiatCount: 0,
    fiatTotal: 0,
    netWorth: 0
});

const addTotal = <Key>(totals: Map<Key, number>, key: Key, amount: number): void => {
    totals.set(key, (totals.get(key) ?? 0) + amount);
};

const addActiveTotal = <Key>(totals: Map<Key, number>, key: Key, amount: number, isActive: boolean): void => {
    if (isActive) {
        addTotal(totals, key, amount);
    }
};

const addBankProviderTotal = (
    totals: Map<ExternalSourceEnum, number>,
    provider: ExternalSourceEnum | null,
    amount: number,
    isActive: boolean
): void => {
    if (isActive && isDefined(provider)) {
        addTotal(totals, provider, amount);
    }
};

const addDebtTypeTotal = (totals: Map<AccountDebtTypeEnum, number>, homeAccountBalance: HomeAccountBalanceInterface): void => {
    const { accountType, convertedTargetBalance, convertedBalance, debtType, isActive } = homeAccountBalance;

    if (isActive && accountType === AccountTypeEnum.DEBT) {
        addTotal(totals, debtType, Math.max(convertedTargetBalance - convertedBalance, 0));
    }
};

const addNetWorthAssetTotals = (
    summary: ReturnType<typeof createHomeAccountBalanceSummary>,
    homeAccountBalance: HomeAccountBalanceInterface
): void => {
    const { accountType, convertedBalance, includeInNetWorth } = homeAccountBalance;

    if (!includeInNetWorth) {
        return;
    }

    summary.netWorth += convertedBalance;

    if (accountType === AccountTypeEnum.CRYPTO || accountType === AccountTypeEnum.CRYPTO_SYNC) {
        summary.cryptoCount += 1;
        summary.cryptoTotal += convertedBalance;

        return;
    }

    summary.fiatCount += 1;
    summary.fiatTotal += convertedBalance;
};

export const useHomePageDataQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const exchangeRatesUpdatedAt = useExchangeRatesUpdatedAtQuery();
    const queryDependencies = [defaultInstrument.id, accountBalancesUpdatedAt, exchangeRatesUpdatedAt];
    const { data } = useDatabaseLiveQuery(accountBalanceRepository.getHomeAccountRows(defaultInstrument.id), queryDependencies);
    const accounts = data.map(row => {
        const account: AccountWithSyncEntityInterface = {
            ...row.account,
            sync: row.sync,
            instrument: row.instrument
        };

        return account;
    });

    const balanceSummary: HomeAccountBalanceSummaryInterface = data.reduce((summary, row) => {
        const rowBankProvider = isDefined(row.sync) ? row.sync.provider : null;
        const homeAccountBalance: HomeAccountBalanceInterface = {
            accountId: row.account.id,
            accountType: row.account.type,
            balance: convertFromMicroUnits(row.balance),
            bankProvider: rowBankProvider,
            convertedBalance: convertFromMicroUnits(row.convertedBalance),
            convertedTargetBalance: convertFromMicroUnits(row.convertedTargetBalance),
            debtType: row.account.debtType,
            includeInNetWorth: row.account.includeInNetWorth,
            isActive: row.account.isActive
        };
        const { accountType, accountId, bankProvider, convertedBalance, isActive } = homeAccountBalance;

        summary.balancesByAccountId.set(accountId, homeAccountBalance);
        addActiveTotal(summary.accountTypeTotals, accountType, convertedBalance, isActive);
        addBankProviderTotal(summary.bankProviderTotals, bankProvider, convertedBalance, isActive);
        addDebtTypeTotal(summary.debtTypeTotals, homeAccountBalance);
        addNetWorthAssetTotals(summary, homeAccountBalance);

        return summary;
    }, createHomeAccountBalanceSummary());

    return { accounts, balanceSummary };
};
