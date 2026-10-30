import { accountBalanceAtom } from '@app/account/query/use-account-balance.query';
import { archivedAccountBalanceAtom } from '@app/account/query/use-archived-account-balance.query';
import { archivedAccountsAtom } from '@app/account/query/use-archived-accounts.query';
import { cryptoInstrumentBalanceAtom } from '@app/account/query/use-crypto-instrument-balance.query';
import { debtAccountManualSettledAmountAtom } from '@app/account/query/use-debt-account-manual-settled-amount.query';
import { debtAccountProgressAtom } from '@app/account/query/use-debt-account-progress-summary.query';
import { accountByIdAtom } from '@app/account/query/use-get-account-by-id.query';
import { accountsByIntegrationIdAtom } from '@app/account/query/use-get-accounts-by-integration-id.query';
import { homeAccountRowsAtom } from '@app/account/query/use-home-page-data.query';
import { inactiveAccountsAtom } from '@app/account/query/use-inactive-accounts.query';
import { netWorthAtom } from '@app/account/query/use-net-worth.query';
import { accountCountAtom, searchAccountsAtom } from '@app/account/query/use-search-accounts-grouped.query';
import { searchAccountsSortedAtom } from '@app/account/query/use-search-accounts-sorted.query';
import { genericBudgetTemplateAtom, suggestedBudgetTemplateAtom } from '@app/budget/hooks/use-budget-template-draft.hook';
import { activeBudgetAtom } from '@app/budget/query/use-get-active-budget.query';
import { budgetCategoryLimitsAtom } from '@app/budget/query/use-get-budget-category-limits.query';
import { budgetProjectionAtom } from '@app/budget/query/use-get-budget-projection.query';
import { budgetSpentAtom } from '@app/budget/query/use-get-budget-spent.query';
import {
    atmCashWithdrawalTransactionIdsAtom,
    categoryEvidenceAtom,
    tagEvidenceAtom,
    uncategorizedRowsAtom,
    untaggedRowsAtom
} from '@app/categorize-inbox/constant/categorize-inbox-atoms.constant';
import { categoryByIdAtom } from '@app/category/query/use-get-category-by-id.query';
import { nonSystemCategoriesAtom } from '@app/category/query/use-non-system-categories.query';
import { searchCategoriesAtom } from '@app/category/query/use-search-categories.query';
import { exchangeRatesUpdatedAtAtom } from '@app/exchange-rate/query/use-exchange-rates-updated-at.query';
import { rateByBaseAndQuoteIdsAtom } from '@app/exchange-rate/query/use-get-rates-by-base-and-quote-ids.query';
import { installmentPlanScheduleAtom } from '@app/installment-plan/query/use-installment-plan-schedule.query';
import { instrumentByIdAtom } from '@app/instrument/query/use-get-instrument-by-id.query';
import { instrumentsByTypeAtom } from '@app/instrument/query/use-get-instruments-by-type.query';
import { cryptoPositionEntriesAtom } from '@app/market-data/query/use-crypto-instrument-position.query';
import { latestMarketDataJobAtom, marketPriceCountAtom } from '@app/market-data/query/use-instrument-market-data-progress.query';
import { recentMarketPricesAtom } from '@app/market-data/query/use-instrument-market-data.query';
import { allMccCategoriesAtom } from '@app/mcc-category/query/use-get-all-mcc-categories.query';
import { mccCategoryByIdAtom } from '@app/mcc-category/query/use-get-mcc-category-by-id.query';
import { accountCountAtom as onboardingAccountCountAtom } from '@app/onboarding/hook/use-is-onboarding-active.hook';
import { enabledRulesAtom } from '@app/rule/constant/enabled-rules-atom.constant';
import { allRulesAtom } from '@app/rule/query/use-get-all-rules.query';
import { ruleByIdAtom } from '@app/rule/query/use-get-rule-by-id.query';
import { liquidBalanceAtom } from '@app/runway/query/use-liquid-balance.query';
import { runwayDriverSeriesAtom, runwaySeriesAtom } from '@app/runway/query/use-runway.query';
import { defaultAccountResultAtom, defaultInstrumentResultAtom, settingsResultAtom } from '@app/settings/constants/settings-atoms.constant';
import { updateSettingsMutation } from '@app/settings/mutation/update-settings.mutation';
import { accountSyncAtom } from '@app/sync/hook/use-account-sync.hook';
import { syncTokenAtom } from '@app/sync/hook/use-sync-token.hook';
import { bankIntegrationByIdAtom } from '@app/sync/query/use-get-bank-integration-by-id.query';
import { bankIntegrationCountAtom } from '@app/sync/query/use-get-bank-integration-count.query';
import { tagsByIdsAtom } from '@app/tag/query/use-get-tag-by-ids.query';
import { searchTagsAtom } from '@app/tag/query/use-search-tags.query';
import { TagService } from '@app/tag/service/tag.service';
import { refundsTotalAtom } from '@app/transaction/constant/refunds-total-atom.constant';
import { recurringCalendarAtom } from '@app/transaction/hook/use-recurring-calendar.hook';
import { consolidationSourcesAtom } from '@app/transaction/query/use-get-consolidation-sources.query';
import { statisticsByCategoryAtom } from '@app/transaction/query/use-get-statistics-by-category.query';
import { statisticsByTagAtom } from '@app/transaction/query/use-get-statistics-by-tag.query';
import { statisticsTransactionsAtom } from '@app/transaction/query/use-get-statistics-transactions.query';
import { totalIncomeAndExpensesAtom } from '@app/transaction/query/use-get-total-income-and-expenses.query';
import { transactionByIdAtom } from '@app/transaction/query/use-get-transaction-by-id.query';
import { transactionCountAtom } from '@app/transaction/query/use-get-transaction-count.query';
import { transactionsAtom } from '@app/transaction/query/use-get-transactions.query';
import { uncategorizedTransactionCountAtom } from '@app/transaction/query/use-get-uncategorized-transaction-count.query';
import { uncategorizedTransactionsAtom } from '@app/transaction/query/use-get-uncategorized-transactions.query';
import { similarStatsAtom } from '@app/transaction/query/use-transaction-info-similar-stats.query';
import {
    AccountDebtTypeEnum,
    AccountEntityTable,
    AccountTypeEnum,
    DEFAULT_TRANSACTION_FILTER,
    Db,
    InstrumentEntityTable,
    InstrumentTypeEnum,
    LanguageEnum,
    RunwayDriverDimensionEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import * as schema from '@budgie/contracts/schema';
import { AccountService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { eq, getTableColumns, getTableName, sql } from 'drizzle-orm';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as AtomRegistry from 'effect/reactivity/AtomRegistry';
import * as TestClock from 'effect/testing/TestClock';

import { seed, seedLedgerBalance, testDb, TestClockLayer } from '../../harness';
import { liveAtomClock, liveStatements, testAtomRuntime } from '../../harness/scenario/test-runtime';

import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type * as Atom from 'effect/reactivity/Atom';

type LiveAtom = Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>>;

const BASE_INSTRUMENT_ID = 1;
const { EN } = LanguageEnum;
const NOW = Date.now();
const FLUSH_WAIT = '120 millis';
const tablesByName = new Map<string, SQLiteTable>(Object.values(schema).map(table => [getTableName(table), table]));

const seedFixture = Effect.gen(function* () {
    const account = yield* seed.account({ title: 'Live atom card' });
    yield* seed.sync({ accountId: account.id });
    const integration = yield* seed.bankIntegration();
    const category = yield* seed.category('Groceries');
    const tag = yield* seed.tag('weekly');
    const expense = yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: new Date(NOW), title: 'Market' });

    const installmentAccount = yield* seed.account({
        title: 'Phone plan',
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.INSTALLMENT
    });

    yield* testDb.update(AccountEntityTable).set({ installmentCount: 12 }).where(eq(AccountEntityTable.id, installmentAccount.id));
    yield* seed.transactionTag(expense.id, tag.id);
    yield* seedLedgerBalance(account.id, 100_000_000);

    return { account, installmentAccount, integrationId: integration.id, category, tag, expense };
});

const liveAtoms = ({
    account,
    installmentAccount,
    integrationId,
    category,
    tag,
    expense
}: Effect.Success<typeof seedFixture>): Record<string, LiveAtom> => ({
    accountBalance: accountBalanceAtom(account.id),
    archivedAccountBalance: archivedAccountBalanceAtom(account.id),
    archivedAccounts: archivedAccountsAtom,
    cryptoInstrumentBalance: cryptoInstrumentBalanceAtom(BASE_INSTRUMENT_ID),
    debtAccountManualSettledAmount: debtAccountManualSettledAmountAtom(installmentAccount.id),
    debtAccountProgress: debtAccountProgressAtom(installmentAccount.id),
    accountById: accountByIdAtom(account.id),
    accountsByIntegrationId: accountsByIntegrationIdAtom(integrationId),
    homeAccountRows: homeAccountRowsAtom(BASE_INSTRUMENT_ID),
    inactiveAccounts: inactiveAccountsAtom,
    netWorth: netWorthAtom(BASE_INSTRUMENT_ID),
    searchAccounts: searchAccountsAtom(''),
    accountCount: accountCountAtom,
    searchAccountsSorted: searchAccountsSortedAtom(['', {}]),
    suggestedBudgetTemplate: suggestedBudgetTemplateAtom({ nowTimestamp: NOW, baseInstrumentId: BASE_INSTRUMENT_ID }),
    genericBudgetTemplate: genericBudgetTemplateAtom('USD'),
    activeBudget: activeBudgetAtom,
    budgetCategoryLimits: budgetCategoryLimitsAtom(1),
    budgetProjection: budgetProjectionAtom({
        id: 1,
        periodStartDay: 1,
        useLastDayOfMonth: false,
        instrumentId: BASE_INSTRUMENT_ID,
        overallLimit: 100_000_000,
        otherLimit: 0,
        dayStart: NOW
    }),
    budgetSpent: budgetSpentAtom({ periodStartDay: 1, useLastDayOfMonth: false, instrumentId: BASE_INSTRUMENT_ID, dayStart: NOW }),
    uncategorizedRows: uncategorizedRowsAtom(DEFAULT_TRANSACTION_FILTER),
    untaggedRows: untaggedRowsAtom(DEFAULT_TRANSACTION_FILTER),
    categoryEvidence: categoryEvidenceAtom,
    tagEvidence: tagEvidenceAtom,
    atmCashWithdrawalTransactionIds: atmCashWithdrawalTransactionIdsAtom([expense.id]),
    categoryById: categoryByIdAtom([category.id, EN]),
    nonSystemCategories: nonSystemCategoriesAtom(EN),
    searchCategories: searchCategoriesAtom(['', true, EN]),
    exchangeRatesUpdatedAt: exchangeRatesUpdatedAtAtom,
    rateByBaseAndQuoteIds: rateByBaseAndQuoteIdsAtom([BASE_INSTRUMENT_ID, 2]),
    installmentPlanSchedule: installmentPlanScheduleAtom(installmentAccount.id),
    instrumentById: instrumentByIdAtom(BASE_INSTRUMENT_ID),
    instrumentsByType: instrumentsByTypeAtom(InstrumentTypeEnum.FIAT),
    cryptoPositionEntries: cryptoPositionEntriesAtom([BASE_INSTRUMENT_ID, BASE_INSTRUMENT_ID]),
    latestMarketDataJob: latestMarketDataJobAtom([BASE_INSTRUMENT_ID, 2]),
    marketPriceCount: marketPriceCountAtom([BASE_INSTRUMENT_ID, 2]),
    recentMarketPrices: recentMarketPricesAtom([BASE_INSTRUMENT_ID, 2]),
    allMccCategories: allMccCategoriesAtom,
    mccCategoryById: mccCategoryByIdAtom(1),
    onboardingAccountCount: onboardingAccountCountAtom,
    enabledRules: enabledRulesAtom,
    allRules: allRulesAtom(EN),
    ruleById: ruleByIdAtom(1),
    liquidBalance: liquidBalanceAtom([BASE_INSTRUMENT_ID, true]),
    runwaySeries: runwaySeriesAtom([BASE_INSTRUMENT_ID, true]),
    runwayDriverSeries: runwayDriverSeriesAtom([BASE_INSTRUMENT_ID, RunwayDriverDimensionEnum.CATEGORY, EN, true]),
    settings: settingsResultAtom,
    defaultInstrument: defaultInstrumentResultAtom,
    defaultAccount: defaultAccountResultAtom,
    accountSync: accountSyncAtom(account.id),
    syncToken: syncTokenAtom(account.id),
    bankIntegrationById: bankIntegrationByIdAtom(integrationId),
    bankIntegrationCount: bankIntegrationCountAtom,
    tagsByIds: tagsByIdsAtom([tag.id]),
    searchTags: searchTagsAtom(''),
    refundsTotal: refundsTotalAtom([expense.id, EN]),
    recurringCalendar: recurringCalendarAtom([new Date(NOW).getFullYear(), new Date(NOW).getMonth(), NOW]),
    consolidationSources: consolidationSourcesAtom([expense.id, EN]),
    statisticsByCategory: statisticsByCategoryAtom([DEFAULT_TRANSACTION_FILTER, BASE_INSTRUMENT_ID, EN]),
    statisticsByTag: statisticsByTagAtom([DEFAULT_TRANSACTION_FILTER, BASE_INSTRUMENT_ID]),
    statisticsTransactions: statisticsTransactionsAtom([
        { type: null, date: null, categoryIds: null, excludedCategoryIds: null, tagIds: null, accountIds: null, amount: null },
        EN,
        20
    ]),
    totalIncomeAndExpenses: totalIncomeAndExpensesAtom([DEFAULT_TRANSACTION_FILTER, BASE_INSTRUMENT_ID]),
    transactionById: transactionByIdAtom([expense.id, EN]),
    transactionCount: transactionCountAtom(DEFAULT_TRANSACTION_FILTER),
    transactions: transactionsAtom([DEFAULT_TRANSACTION_FILTER, EN, 20]),
    uncategorizedTransactionCount: uncategorizedTransactionCountAtom(DEFAULT_TRANSACTION_FILTER),
    uncategorizedTransactions: uncategorizedTransactionsAtom([DEFAULT_TRANSACTION_FILTER, EN, 20]),
    similarStats: similarStatsAtom({
        type: TransactionTypeEnum.EXPENSE,
        operatedAt: new Date(NOW),
        title: expense.title,
        comment: '',
        accountId: account.id,
        categoryId: category.id,
        months: 6
    })
});

const readTables = (statements: readonly string[]) =>
    new Set(
        statements
            .flatMap(statement => [...statement.matchAll(/\b(?:from|join)\s+"?(\w+)"?/giu)].map(match => match[1]))
            .filter(tableName => tablesByName.has(tableName))
    );

const touch = (table: SQLiteTable) =>
    Db.query(database =>
        database
            .update(table)
            .set(Object.fromEntries(Object.entries(getTableColumns(table)).slice(0, 1)))
            .where(sql`0`)
    );

const withLiveRegistry = <A, E, R>(use: (registry: AtomRegistry.AtomRegistry) => Effect.Effect<A, E, R>) =>
    Effect.acquireUseRelease(
        Effect.map(Clock.Clock, clock => AtomRegistry.make({ initialValues: [[liveAtomClock, clock]] })),
        registry =>
            Effect.andThen(
                Effect.sync(() => registry.mount(testAtomRuntime)),
                use(registry)
            ),
        registry => Effect.sync(() => void registry.dispose())
    );

const inLiveRuntime = <A, E, R>(registry: AtomRegistry.AtomRegistry, effect: Effect.Effect<A, E, R>) =>
    Effect.flatMap(AtomRegistry.getResult(registry, testAtomRuntime), services => Effect.provideContext(effect, services));

const settle = (registry: AtomRegistry.AtomRegistry, atoms: readonly LiveAtom[]) =>
    Effect.andThen(
        TestClock.adjust(FLUSH_WAIT),
        Effect.forEach(atoms, atom => Effect.exit(AtomRegistry.getResult(registry, atom, { suspendOnWaiting: true })), { discard: true })
    );

const mountAndTraceReads = (registry: AtomRegistry.AtomRegistry, atoms: Record<string, LiveAtom>) =>
    Effect.forEach(Object.entries(atoms), ([name, atom]) =>
        Effect.gen(function* () {
            liveStatements.length = 0;
            registry.mount(atom);
            const exit = yield* Effect.exit(AtomRegistry.getResult(registry, atom));

            return { name, atom, reads: readTables(liveStatements), isSuccess: exit._tag === 'Success' };
        })
    );

describe('generic/live-atom-refresh', () => {
    it.effect('refreshes every live atom after a write to each table its SQL reads', () =>
        withLiveRegistry(registry =>
            Effect.gen(function* () {
                const fixture = yield* inLiveRuntime(registry, seedFixture);
                const mounted = yield* mountAndTraceReads(registry, liveAtoms(fixture));
                const readTableNames = new Set(mounted.flatMap(({ reads }) => [...reads]));
                const staleReads: string[] = [];

                yield* settle(
                    registry,
                    mounted.map(({ atom }) => atom)
                );

                yield* Effect.forEach(
                    [...tablesByName].filter(([tableName]) => readTableNames.has(tableName)),
                    ([tableName, table]) =>
                        Effect.gen(function* () {
                            const before = mounted.map(({ atom }) => registry.get(atom));

                            yield* inLiveRuntime(registry, touch(table));
                            yield* settle(
                                registry,
                                mounted.map(({ atom }) => atom)
                            );

                            mounted.forEach(({ name, atom, reads }, index) => {
                                if (reads.has(tableName) && registry.get(atom) === before[index]) {
                                    staleReads.push(`${name} <- ${tableName}`);
                                }
                            });
                        })
                );

                expect(mounted.filter(({ isSuccess }) => !isSuccess).map(({ name }) => name)).toEqual([]);
                expect(mounted.filter(({ reads }) => reads.size === 0).map(({ name }) => name)).toEqual([]);
                expect(staleReads).toEqual([]);
            })
        ).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('keeps settings when only accounts or instruments change', () =>
        withLiveRegistry(registry =>
            Effect.gen(function* () {
                registry.mount(settingsResultAtom);
                yield* settle(registry, [settingsResultAtom]);
                const before = registry.get(settingsResultAtom);

                yield* inLiveRuntime(registry, Effect.all([touch(AccountEntityTable), touch(InstrumentEntityTable)]));
                yield* settle(registry, [settingsResultAtom]);

                expect(registry.get(settingsResultAtom)).toBe(before);
            })
        ).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('shows owning-service writes in the live values', () =>
        withLiveRegistry(registry =>
            Effect.gen(function* () {
                const inactive = yield* seed.account({ title: 'Dormant', isActive: false });
                const read = <A, E>(atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>) =>
                    Effect.andThen(TestClock.adjust(FLUSH_WAIT), AtomRegistry.getResult(registry, atom, { suspendOnWaiting: true }));

                registry.mount(settingsResultAtom);
                registry.mount(inactiveAccountsAtom);
                registry.mount(searchTagsAtom(''));

                expect((yield* read(settingsResultAtom))?.showCents).toBe(true);
                expect((yield* read(inactiveAccountsAtom)).map(({ id }) => id)).toEqual([inactive.id]);
                expect(yield* read(searchTagsAtom(''))).toEqual([]);

                yield* inLiveRuntime(
                    registry,
                    Effect.all([
                        updateSettingsMutation({ showCents: false }),
                        Effect.flatMap(AccountService, accountService => accountService.activateById(inactive.id)),
                        Effect.flatMap(TagService, tagService => tagService.create({ title: 'travel' }, null, null))
                    ])
                );

                expect((yield* read(settingsResultAtom))?.showCents).toBe(false);
                expect(yield* read(inactiveAccountsAtom)).toEqual([]);
                expect((yield* read(searchTagsAtom(''))).map(({ title }) => title)).toEqual(['travel']);
            })
        ).pipe(Effect.provide(TestClockLayer))
    );
});
