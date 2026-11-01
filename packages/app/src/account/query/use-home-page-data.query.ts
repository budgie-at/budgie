import {
    AccountBalanceRepository,
    AccountTypeEnum,
    BankIntegrationEntityTable,
    DebtEventEntityTable,
    InstrumentEntityTable,
    convertFromMicroUnits
} from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { decimalPlacesAtom, defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { ACCOUNT_CONVERTED_BALANCE_TABLES } from '../constant/account-balance-tables.constant';
import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { buildIntegrationProviderMap } from '../utils/build-integration-provider-map.util';
import { getDebtProgressDisplayState } from '../utils/get-debt-progress-display-state.util';
import { getDebtSectionKind } from '../utils/get-debt-section-kind.util';
import { resolveBankProviderGroup } from '../utils/resolve-bank-provider-group.util';

import type { DebtSectionInterface } from '../interface/debt-section.interface';
import type { HomeAccountBalanceSummaryInterface } from '../interface/home-account-balance-summary.interface';
import type { HomeAccountBalanceInterface } from '../interface/home-account-balance.interface';
import type { HomeSectionInterface } from '../interface/home-section.interface';
import type { InstitutionGroupInterface } from '../interface/institution-group.interface';
import type { AccountWithSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

export const homeAccountRowsAtom = databaseQueryFamily(
    [...ACCOUNT_CONVERTED_BALANCE_TABLES, InstrumentEntityTable, DebtEventEntityTable, BankIntegrationEntityTable],
    AccountBalanceRepository,
    (accountBalanceRepository, defaultInstrumentId: number) => accountBalanceRepository.getHomeAccountRows(defaultInstrumentId)
);

const createHomeAccountBalanceSummary = () => ({
    accountTypeTotals: new Map<AccountTypeEnum, number>(),
    balancesByAccountId: new Map<number, HomeAccountBalanceInterface>(),
    bankProviderTotals: new Map<number, number>(),
    cryptoCount: 0,
    cryptoTotal: 0,
    debtSectionTotals: new Map<DebtSectionInterface['kind'], number>(),
    fiatCount: 0,
    fiatTotal: 0,
    netWorth: 0
});

const groupBy = <Item, Key>(items: readonly Item[], getKey: (item: Item) => Key): Map<Key, Item[]> => {
    const groups = new Map<Key, Item[]>();

    items.forEach(item => {
        const key = getKey(item);

        groups.set(key, [...(groups.get(key) ?? []), item]);
    });

    return groups;
};

const buildInstitutionGroups = (
    providerAccounts: AccountWithSyncEntityInterface[],
    integrationProviders: ReadonlyMap<number, ExternalSourceEnum>,
    integrationLabels: ReadonlyMap<number, string | null>
): InstitutionGroupInterface[] => {
    const entries = [...groupBy(providerAccounts, account => account.integrationId)].flatMap(([integrationId, accounts]) => {
        const provider = resolveBankProviderGroup(integrationId, integrationProviders)?.provider;

        return isDefined(provider) && isDefined(integrationId)
            ? [{ provider, integrationId, label: integrationLabels.get(integrationId) ?? null, accounts }]
            : [];
    });

    return entries.map(entry => {
        const unlabeledSameProviderIntegrationIds = entries
            .filter(other => other.provider === entry.provider && !isDefined(other.label))
            .map(other => other.integrationId)
            .sort((left, right) => left - right);
        const groupNumber =
            !isDefined(entry.label) && unlabeledSameProviderIntegrationIds.length > 1
                ? unlabeledSameProviderIntegrationIds.indexOf(entry.integrationId) + 1
                : null;

        return { ...entry, groupNumber };
    });
};

const isCryptoInstitution = (institution: InstitutionGroupInterface): boolean =>
    institution.accounts.every(account => account.type === AccountTypeEnum.CRYPTO_SYNC);

const buildHomePageSections = (
    activeAccounts: AccountWithSyncEntityInterface[],
    integrationProviders: ReadonlyMap<number, ExternalSourceEnum>,
    integrationLabels: ReadonlyMap<number, string | null>,
    balanceSummary: Pick<HomeAccountBalanceSummaryInterface, 'accountTypeTotals' | 'bankProviderTotals' | 'debtSectionTotals'>
): HomeSectionInterface[] => {
    const debtAccounts = activeAccounts.filter(account => account.type === AccountTypeEnum.DEBT);
    const otherAccounts = activeAccounts.filter(account => account.type !== AccountTypeEnum.DEBT);
    const isProviderAccount = (account: AccountWithSyncEntityInterface) =>
        isDefined(resolveBankProviderGroup(account.integrationId, integrationProviders));
    const typeAccounts = otherAccounts.filter(account => !isProviderAccount(account) && account.type !== AccountTypeEnum.CASH);
    const institutions = buildInstitutionGroups(otherAccounts.filter(isProviderAccount), integrationProviders, integrationLabels);
    const institutionsByType = new Map([
        [AccountTypeEnum.BANK, institutions.filter(institution => !isCryptoInstitution(institution))],
        [AccountTypeEnum.CRYPTO, institutions.filter(isCryptoInstitution)]
    ]);
    const debtGroups = groupBy(debtAccounts, account => getDebtSectionKind(account.debtType));

    const typeGroups = groupBy(typeAccounts, account => account.type);
    const hasInstitutionsOnly = (type: AccountTypeEnum) => isNotEmptyArray(institutionsByType.get(type)) && !typeGroups.has(type);
    const sectionTypes = [
        ...(hasInstitutionsOnly(AccountTypeEnum.BANK) ? [AccountTypeEnum.BANK] : []),
        ...typeGroups.keys(),
        ...(hasInstitutionsOnly(AccountTypeEnum.CRYPTO) ? [AccountTypeEnum.CRYPTO] : [])
    ];

    const typeSections = sectionTypes.map(type => {
        const accounts = typeGroups.get(type) ?? [];
        const accountItems =
            type === AccountTypeEnum.CRYPTO
                ? [...groupBy(accounts, account => account.instrument.id).values()].map(group => ({
                      instrument: group[0].instrument,
                      accounts: group
                  }))
                : accounts;

        const typeInstitutions = institutionsByType.get(type) ?? [];
        const institutionsTotal = typeInstitutions.reduce(
            (sum, institution) => sum + (balanceSummary.bankProviderTotals.get(institution.integrationId) ?? 0),
            0
        );

        return {
            kind: HomeSectionKindEnum.ACCOUNT_TYPE as const,
            type,
            total: (balanceSummary.accountTypeTotals.get(type) ?? 0) + institutionsTotal,
            data: [...typeInstitutions, ...accountItems]
        };
    });

    const debtSectionKinds = [
        HomeSectionKindEnum.DEBT_YOU_OWE,
        HomeSectionKindEnum.DEBT_OWED_TO_YOU
    ] satisfies DebtSectionInterface['kind'][];
    const debtSections = debtSectionKinds.flatMap(kind => {
        const data = debtGroups.get(kind);

        return isNotEmptyArray(data) ? [{ kind, data, total: balanceSummary.debtSectionTotals.get(kind) ?? 0 }] : [];
    });

    return [...typeSections.sort((left, right) => right.total - left.total), ...debtSections];
};

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

const addDebtSectionTotal = (totals: Map<DebtSectionInterface['kind'], number>, homeAccountBalance: HomeAccountBalanceInterface): void => {
    const { accountType, convertedDebtProgressSummary, debtType, isActive } = homeAccountBalance;

    if (isActive && accountType === AccountTypeEnum.DEBT) {
        addTotal(totals, getDebtSectionKind(debtType), convertedDebtProgressSummary.outstandingAmount);
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

const isSettledDebtAccount = (
    account: Pick<AccountWithSyncEntityInterface, 'id' | 'type'>,
    balanceSummary: Pick<HomeAccountBalanceSummaryInterface, 'balancesByAccountId'>,
    decimalPlaces: number
): boolean => {
    const debtProgressSummary = balanceSummary.balancesByAccountId.get(account.id)?.debtProgressSummary;

    return (
        account.type === AccountTypeEnum.DEBT &&
        isDefined(debtProgressSummary) &&
        getDebtProgressDisplayState(debtProgressSummary, decimalPlaces).isSettled
    );
};

export const useHomePageDataQuery = () => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const result = useLiveAtomValue(homeAccountRowsAtom(defaultInstrumentId));
    const data = AsyncResult.getOrElse(result, () => []);
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
            outstandingAmount: convertFromMicroUnits(row.convertedDebtOutstandingAmount),
            overpaidAmount: convertFromMicroUnits(row.convertedDebtOverpaidAmount),
            paidAmount: convertFromMicroUnits(row.convertedDebtPaidAmount),
            percentage: row.debtProgressPercentage,
            totalAmount: convertFromMicroUnits(row.convertedDebtTotalAmount)
        };
        const debtProgressSummary = {
            outstandingAmount: convertFromMicroUnits(row.debtOutstandingAmount),
            overpaidAmount: convertFromMicroUnits(row.debtOverpaidAmount),
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
            convertedDebtProgressSummary,
            convertedTargetBalance: convertFromMicroUnits(row.convertedTargetBalance),
            debtProgressSummary,
            debtType: row.account.debtType,
            includeInNetWorth: row.account.includeInNetWorth,
            isActive: row.account.isActive,
            hasLedgerHistory: row.hasLedgerHistory === 1
        };
        const { accountType, accountId, convertedBalance, isActive } = homeAccountBalance;

        summary.balancesByAccountId.set(accountId, homeAccountBalance);
        addActiveTotal(summary.accountTypeTotals, accountType, convertedBalance, isActive);
        addBankProviderTotal(summary.bankProviderTotals, bankProviderGroup?.integrationId ?? null, convertedBalance, isActive);
        addDebtSectionTotal(summary.debtSectionTotals, homeAccountBalance);
        addNetWorthAssetTotals(summary, homeAccountBalance);

        return summary;
    }, createHomeAccountBalanceSummary());

    const displayedAccounts = accounts.filter(account => account.isActive && !isSettledDebtAccount(account, balanceSummary, decimalPlaces));
    const integrationLabels = new Map(
        data.flatMap(row => (isDefined(row.account.integrationId) ? [[row.account.integrationId, row.integrationLabel] as const] : []))
    );
    const sections = buildHomePageSections(displayedAccounts, integrationProviders, integrationLabels, balanceSummary);
    const cashAccounts = displayedAccounts.filter(
        account =>
            account.type === AccountTypeEnum.CASH && !isDefined(resolveBankProviderGroup(account.integrationId, integrationProviders))
    );

    return {
        activeAccountCount: displayedAccounts.length,
        accounts,
        balanceSummary,
        cashAccounts,
        isLoading: AsyncResult.isInitial(result),
        sections
    };
};
