import { AccountDebtTypeEnum, AccountTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';
import { useSettingsContext } from '../../settings/context/settings.context';
import { buildIntegrationProviderMap } from '../utils/build-integration-provider-map.util';
import { resolveBankProviderGroup } from '../utils/resolve-bank-provider-group.util';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';

import type { HomeAccountBalanceSummaryInterface } from '../interface/home-account-balance-summary.interface';
import type { HomeAccountBalanceInterface } from '../interface/home-account-balance.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

const createHomeAccountBalanceSummary = () => ({
    accountTypeTotals: new Map<AccountTypeEnum, number>(),
    balancesByAccountId: new Map<number, HomeAccountBalanceInterface>(),
    bankProviderTotals: new Map<number, number>(),
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

const addBankProviderTotal = (totals: Map<number, number>, integrationId: number | null, amount: number, isActive: boolean): void => {
    if (isActive && isDefined(integrationId)) {
        addTotal(totals, integrationId, amount);
    }
};

const addDebtTypeTotal = (totals: Map<AccountDebtTypeEnum, number>, homeAccountBalance: HomeAccountBalanceInterface): void => {
    const { accountType, convertedDebtProgressSummary, debtType, isActive } = homeAccountBalance;

    if (isActive && accountType === AccountTypeEnum.DEBT) {
        addTotal(totals, debtType, convertedDebtProgressSummary.outstandingAmount);
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
    const integrationProviders = buildIntegrationProviderMap(
        data.map(row => ({ integrationId: row.account.integrationId, sync: row.sync }))
    );

    const balanceSummary: HomeAccountBalanceSummaryInterface = data.reduce((summary, row) => {
        const bankProviderGroup = resolveBankProviderGroup(row.account.integrationId, integrationProviders);
        const convertedDebtProgressSummary = {
            closedAmount: convertFromMicroUnits(row.convertedDebtClosedAmount),
            creditAmount: convertFromMicroUnits(row.convertedCreditAmount),
            debitAmount: convertFromMicroUnits(row.convertedDebitAmount),
            openedAmount: convertFromMicroUnits(row.convertedDebtOpenedAmount),
            outstandingAmount: convertFromMicroUnits(row.convertedDebtOutstandingAmount),
            paidAmount: convertFromMicroUnits(row.convertedDebtPaidAmount),
            percentage: row.debtProgressPercentage,
            totalAmount: convertFromMicroUnits(row.convertedDebtTotalAmount)
        };
        const debtProgressSummary = {
            closedAmount: convertFromMicroUnits(row.debtClosedAmount),
            creditAmount: convertFromMicroUnits(row.creditAmount),
            debitAmount: convertFromMicroUnits(row.debitAmount),
            openedAmount: convertFromMicroUnits(row.debtOpenedAmount),
            outstandingAmount: convertFromMicroUnits(row.debtOutstandingAmount),
            paidAmount: convertFromMicroUnits(row.debtPaidAmount),
            percentage: row.debtProgressPercentage,
            totalAmount: convertFromMicroUnits(row.debtTotalAmount)
        };
        const homeAccountBalance: HomeAccountBalanceInterface = {
            accountId: row.account.id,
            accountType: row.account.type,
            balance: convertFromMicroUnits(row.balance),
            bankProvider: bankProviderGroup?.provider ?? null,
            convertedBalance: convertFromMicroUnits(row.convertedBalance),
            convertedCreditAmount: convertFromMicroUnits(row.convertedCreditAmount),
            convertedDebitAmount: convertFromMicroUnits(row.convertedDebitAmount),
            convertedDebtProgressSummary,
            convertedTargetBalance: convertFromMicroUnits(row.convertedTargetBalance),
            debtProgressSummary,
            debtType: row.account.debtType,
            includeInNetWorth: row.account.includeInNetWorth,
            isActive: row.account.isActive
        };
        const { accountType, accountId, convertedBalance, isActive } = homeAccountBalance;

        summary.balancesByAccountId.set(accountId, homeAccountBalance);
        addActiveTotal(summary.accountTypeTotals, accountType, convertedBalance, isActive);
        addBankProviderTotal(summary.bankProviderTotals, bankProviderGroup?.integrationId ?? null, convertedBalance, isActive);
        addDebtTypeTotal(summary.debtTypeTotals, homeAccountBalance);
        addNetWorthAssetTotals(summary, homeAccountBalance);

        return summary;
    }, createHomeAccountBalanceSummary());

    return { accounts, balanceSummary };
};
