import {
    AccountBalanceRepository,
    AccountTypeEnum,
    BankIntegrationEntityTable,
    DebtEventEntityTable,
    convertFromMicroUnits
} from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { groupBy } from '../../@generic/utils/group-by.util';
import { decimalPlacesAtom, defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { ACCOUNT_CONVERTED_BALANCE_TABLES } from '../constant/account-balance-tables.constant';
import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { buildIntegrationProviderMap } from '../utils/build-integration-provider-map.util';
import { getDebtProgressDisplayState } from '../utils/get-debt-progress-display-state.util';
import { getDebtSectionKind } from '../utils/get-debt-section-kind.util';
import { getIntegrationGroupNumber } from '../utils/get-integration-group-number.util';
import { resolveBankProviderGroup } from '../utils/resolve-bank-provider-group.util';

import type { DebtSectionInterface } from '../interface/debt-section.interface';
import type { HomeAccountBalanceSummaryInterface } from '../interface/home-account-balance-summary.interface';
import type { HomeAccountBalanceInterface } from '../interface/home-account-balance.interface';
import type { HomeSectionInterface } from '../interface/home-section.interface';
import type { InstitutionGroupInterface } from '../interface/institution-group.interface';
import type { AccountWithSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

export const homeAccountRowsAtom = databaseQueryFamily(
    [...ACCOUNT_CONVERTED_BALANCE_TABLES, DebtEventEntityTable, BankIntegrationEntityTable],
    AccountBalanceRepository,
    (accountBalanceRepository, defaultInstrumentId: number) => accountBalanceRepository.getHomeAccountRows(defaultInstrumentId)
);

const createHomeAccountBalanceSummary = () => ({
    balancesByAccountId: new Map<number, HomeAccountBalanceInterface>(),
    bankProviderTotals: new Map<number, number>(),
    debtSectionTotals: new Map<DebtSectionInterface['kind'], number>(),
    netWorth: 0
});

const sumConvertedBalances = (
    accounts: readonly Pick<AccountWithSyncEntityInterface, 'id'>[],
    balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>
): number => accounts.reduce((total, account) => total + (balancesByAccountId.get(account.id)?.convertedBalance ?? 0), 0);

const buildInstitutionGroups = (
    providerAccounts: AccountWithSyncEntityInterface[],
    integrationProviders: ReadonlyMap<number, ExternalSourceEnum>,
    integrationLabels: ReadonlyMap<number, string | null>,
    balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>
): InstitutionGroupInterface[] => {
    const entries = [...groupBy(providerAccounts, account => account.integrationId)].flatMap(([integrationId, accounts]) => {
        const provider = resolveBankProviderGroup(integrationId, integrationProviders)?.provider;

        return isDefined(provider) && isDefined(integrationId)
            ? [{ provider, integrationId, label: integrationLabels.get(integrationId) ?? null, accounts }]
            : [];
    });

    const integrations = entries.map(({ integrationId, provider, label }) => ({ id: integrationId, provider, label }));

    return entries.map((entry, index) => ({
        ...entry,
        groupNumber: getIntegrationGroupNumber(integrations, integrations[index]),
        total: sumConvertedBalances(entry.accounts, balancesByAccountId)
    }));
};

const isCryptoInstitution = (institution: InstitutionGroupInterface): boolean =>
    institution.accounts.every(account => account.type === AccountTypeEnum.CRYPTO_SYNC);

const isInvestmentInstitution = (institution: InstitutionGroupInterface): boolean =>
    institution.accounts.some(account => account.type === AccountTypeEnum.STOCKS);

const getInstitutionSectionType = (institution: InstitutionGroupInterface): AccountTypeEnum => {
    if (isCryptoInstitution(institution)) {
        return AccountTypeEnum.CRYPTO;
    }

    return isInvestmentInstitution(institution) ? AccountTypeEnum.STOCKS : AccountTypeEnum.BANK;
};

const buildHomePageSections = (
    activeAccounts: AccountWithSyncEntityInterface[],
    integrationProviders: ReadonlyMap<number, ExternalSourceEnum>,
    integrationLabels: ReadonlyMap<number, string | null>,
    balanceSummary: Pick<HomeAccountBalanceSummaryInterface, 'balancesByAccountId' | 'debtSectionTotals'>
): HomeSectionInterface[] => {
    const { balancesByAccountId } = balanceSummary;
    const isSharedByOther = (account: AccountWithSyncEntityInterface) => balancesByAccountId.get(account.id)?.isSharedByOther === true;
    const familyAccounts = activeAccounts.filter(isSharedByOther).sort((left, right) => left.title.localeCompare(right.title));
    const ownAccounts = activeAccounts.filter(account => !isSharedByOther(account));
    const debtAccounts = ownAccounts.filter(account => account.type === AccountTypeEnum.DEBT);
    const otherAccounts = ownAccounts.filter(account => account.type !== AccountTypeEnum.DEBT);
    const isProviderAccount = (account: AccountWithSyncEntityInterface) =>
        isDefined(resolveBankProviderGroup(account.integrationId, integrationProviders));
    const cashAccounts = otherAccounts.filter(account => account.type === AccountTypeEnum.CASH && !isProviderAccount(account));
    const typeAccounts = otherAccounts.filter(account => !isProviderAccount(account) && account.type !== AccountTypeEnum.CASH);
    const institutions = buildInstitutionGroups(
        otherAccounts.filter(isProviderAccount),
        integrationProviders,
        integrationLabels,
        balancesByAccountId
    );
    const institutionsByType = groupBy(institutions, getInstitutionSectionType);
    const debtGroups = groupBy(debtAccounts, account => getDebtSectionKind(account.debtType));

    const typeGroups = groupBy(typeAccounts, account => account.type);
    const sectionTypes = new Set([
        ...typeGroups.keys(),
        ...[...institutionsByType].flatMap(([type, typeInstitutions]) => (isNotEmptyArray(typeInstitutions) ? [type] : []))
    ]);

    const typeSections = [...sectionTypes].map(type => {
        const accounts = typeGroups.get(type) ?? [];
        const accountItems =
            type === AccountTypeEnum.CRYPTO
                ? [...groupBy(accounts, account => account.instrument.id).values()].map(group => ({
                      instrument: group[0].instrument,
                      accounts: group
                  }))
                : accounts;

        const typeInstitutions = institutionsByType.get(type) ?? [];
        const institutionsTotal = typeInstitutions.reduce((sum, institution) => sum + institution.total, 0);

        return {
            kind: HomeSectionKindEnum.ACCOUNT_TYPE as const,
            type,
            total: sumConvertedBalances(accounts, balancesByAccountId) + institutionsTotal,
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
    const familyTotal = sumConvertedBalances(familyAccounts, balancesByAccountId);
    const familySections = isNotEmptyArray(familyAccounts)
        ? [{ kind: HomeSectionKindEnum.FAMILY as const, data: familyAccounts, total: familyTotal }]
        : [];
    const cashSection = isNotEmptyArray(cashAccounts)
        ? [
              {
                  kind: HomeSectionKindEnum.CASH as const,
                  type: AccountTypeEnum.CASH as const,
                  total: sumConvertedBalances(cashAccounts, balancesByAccountId),
                  data: cashAccounts
              }
          ]
        : [];

    return [...cashSection, ...typeSections.sort((left, right) => right.total - left.total), ...debtSections, ...familySections];
};

const addTotal = <Key>(totals: Map<Key, number>, key: Key, amount: number): void => {
    totals.set(key, (totals.get(key) ?? 0) + amount);
};

const addBankProviderTotal = (totals: Map<number, number>, integrationId: number | null, amount: number, isActive: boolean): void => {
    if (isActive && isDefined(integrationId)) {
        addTotal(totals, integrationId, amount);
    }
};

const addDebtSectionTotal = (totals: Map<DebtSectionInterface['kind'], number>, homeAccountBalance: HomeAccountBalanceInterface): void => {
    const { accountType, convertedDebtProgressSummary, debtType, isActive } = homeAccountBalance;

    if (isActive && !homeAccountBalance.isSharedByOther && accountType === AccountTypeEnum.DEBT) {
        addTotal(totals, getDebtSectionKind(debtType), convertedDebtProgressSummary.outstandingAmount);
    }
};

const addNetWorth = (
    summary: ReturnType<typeof createHomeAccountBalanceSummary>,
    homeAccountBalance: HomeAccountBalanceInterface
): void => {
    if (homeAccountBalance.includeInNetWorth && !homeAccountBalance.isSharedByOther) {
        summary.netWorth += homeAccountBalance.convertedBalance;
    }
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
            isSharedByOther: row.isSharedByOther === 1,
            isValued: row.isValued,
            hasLedgerHistory: row.hasLedgerHistory === 1
        };
        const { accountId, convertedBalance, isActive } = homeAccountBalance;

        summary.balancesByAccountId.set(accountId, homeAccountBalance);
        addBankProviderTotal(
            summary.bankProviderTotals,
            bankProviderGroup?.integrationId ?? null,
            convertedBalance,
            isActive && !homeAccountBalance.isSharedByOther
        );
        addDebtSectionTotal(summary.debtSectionTotals, homeAccountBalance);
        addNetWorth(summary, homeAccountBalance);

        return summary;
    }, createHomeAccountBalanceSummary());

    const displayedAccounts = accounts.filter(account => account.isActive && !isSettledDebtAccount(account, balanceSummary, decimalPlaces));
    const integrationLabels = new Map(
        data.flatMap(row => (isDefined(row.account.integrationId) ? [[row.account.integrationId, row.integrationLabel] as const] : []))
    );
    const sections = buildHomePageSections(displayedAccounts, integrationProviders, integrationLabels, balanceSummary);

    return {
        activeAccountCount: displayedAccounts.length,
        accounts,
        balanceSummary,
        isLoading: AsyncResult.isInitial(result),
        sections
    };
};
