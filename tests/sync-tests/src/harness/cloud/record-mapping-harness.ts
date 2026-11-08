import { TestSeedService } from '@budgie-at/test-kit';
import {
    SYNC_RECORD_DEFINITIONS,
    SyncApplyService,
    syncAccountBalanceRefresherLayer,
    encodeSyncAggregate,
    isSyncAggregateRecordType
} from '@budgie/cloud-sync';
import {
    AccountDebtTypeEnum,
    Db,
    AccountEntityTable,
    AccountExternalIdEntityTable,
    AccountNatureEnum,
    AccountTypeEnum,
    BankIntegrationEntityTable,
    BudgetCategoryLimitEntityTable,
    BudgetEntityTable,
    BudgetKindEnum,
    BudgetLimitChangeEntityTable,
    BudgetLimitChangeReasonEnum,
    BudgetPeriodEnum,
    BudgetSinkingFundEntityTable,
    CategoryEntityTable,
    ExternalSourceEnum,
    InstrumentEntityTable,
    MccCategoryEntityTable,
    RecurringSeriesEntityTable,
    RecurringSeriesKindEnum,
    RecurringSeriesStatusEnum,
    RecurringSeriesUserStateEnum,
    RuleActionEntityTable,
    RuleActionTypeEnum,
    RuleConditionEntityTable,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleEntityTable,
    SyncRecordTypeEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionReceiptEntityTable,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNumber, isString } from '@rnw-community/shared';

import { OPERATED_AT } from './cloud-fixtures';

import type {
    SyncAggregateInterface,
    SyncIdentityInterface,
    SyncRecordInterface,
    SyncReferenceResolverInterface,
    SyncRowInputType
} from '@budgie/cloud-sync';
import type { DB } from '@budgie/contracts';

const TABLE_ORDER = [
    'bank_integrations',
    'categories',
    'tags',
    'accounts',
    'account_external_ids',
    'rules',
    'rule_conditions',
    'rule_actions',
    'recurring_series',
    'budgets',
    'budget_category_limits',
    'budget_sinking_funds',
    'budget_limit_changes',
    'transactions',
    'transaction_entries',
    'transaction_tags',
    'transaction_receipts',
    'debt_events'
];

const IGNORED_SNAPSHOT_COLUMNS = new Set([
    'id',
    'title_search',
    'title_en',
    'title_tags',
    'tags_generated_at',
    'contact_id',
    'token',
    'owner_install_id',
    'history_progress',
    'needs_embedding',
    'operated_weekday',
    'operated_minute_of_day'
]);

const UNDECLARED_FOREIGN_KEYS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
    accounts: { parent_id: 'accounts' },
    categories: { parent_id: 'categories' }
};

const SEQUENCE_OFFSET = 1000;

const allDefinitions = Object.values(SYNC_RECORD_DEFINITIONS).filter(({ recordType }) => recordType !== SyncRecordTypeEnum.TRANSACTION_LEG);

export interface SyncStateInterface {
    readonly aggregates: readonly SyncAggregateInterface[];
    readonly resolver: SyncReferenceResolverInterface;
}

export const loadSyncState = (database: DB) =>
    Effect.gen(function* () {
        const aggregates: SyncAggregateInterface[] = [];
        const identities = new Map<string, Map<number, SyncIdentityInterface>>();
        const rememberIdentities = (tableName: string, rows: readonly SyncRowInputType[]) => {
            const byId = identities.get(tableName) ?? new Map<number, SyncIdentityInterface>();

            for (const row of rows) {
                if (isNumber(row['id']) && isString(row['syncId']) && isString(row['syncZone'])) {
                    byId.set(row['id'], { syncId: row['syncId'], syncZone: row['syncZone'] });
                }
            }

            identities.set(tableName, byId);
        };

        for (const definition of allDefinitions) {
            const parentRows: readonly SyncRowInputType[] = yield* database.select().from(definition.parent.table);

            rememberIdentities(definition.parent.tableName, parentRows);

            const childRowsByTable = new Map<string, readonly SyncRowInputType[]>();

            for (const child of definition.children) {
                const childRows: readonly SyncRowInputType[] = yield* database.select().from(child.descriptor.table);

                rememberIdentities(child.descriptor.tableName, childRows);
                childRowsByTable.set(child.descriptor.tableName, childRows);
            }

            for (const parent of parentRows) {
                if (isSyncAggregateRecordType(definition.recordType)) {
                    aggregates.push({
                        recordType: definition.recordType,
                        parent,
                        children: Object.fromEntries(
                            definition.children.map(child => [
                                child.descriptor.tableName,
                                (childRowsByTable.get(child.descriptor.tableName) ?? []).filter(
                                    row => row[child.descriptor.parentLink?.property ?? ''] === parent['id']
                                )
                            ])
                        )
                    });
                }
            }
        }

        const instrumentRows = yield* database.select().from(InstrumentEntityTable);
        const mccRows = yield* database.select().from(MccCategoryEntityTable);
        const naturalKeys = new Map<string, Map<number, string>>([
            ['instruments', new Map(instrumentRows.map(row => [row.id, row.code]))],
            ['mcc_categories', new Map(mccRows.map(row => [row.id, row.mcc]))]
        ]);
        const resolver: SyncReferenceResolverInterface = {
            findSyncIdentity: (tableName, localId) => identities.get(tableName)?.get(localId) ?? null,
            findNaturalKey: (tableName, localId) => naturalKeys.get(tableName)?.get(localId) ?? null
        };

        return { aggregates, resolver } satisfies SyncStateInterface;
    });

export const encodeAllRecords = (state: SyncStateInterface) =>
    Effect.forEach(state.aggregates, aggregate => Effect.fromResult(encodeSyncAggregate(aggregate, state.resolver))).pipe(
        Effect.map(recordGroups => recordGroups.flat())
    );

export const throughTransport = (records: readonly SyncRecordInterface[]): unknown[] =>
    records.map((record): unknown => structuredClone(record));

export const prepareTarget = (database: DB) =>
    Effect.gen(function* () {
        const client = database.$client;
        const tables = yield* client.unsafe<{ readonly name: string }>(
            `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name IN (${TABLE_ORDER.map(name => `'${name}'`).join(', ')})`
        );

        yield* client.unsafe('PRAGMA foreign_keys = OFF');
        yield* Effect.forEach(
            [...TABLE_ORDER].reverse(),
            name => client.unsafe(`DELETE FROM "${name}" ${name === 'categories' ? 'WHERE is_default = 0' : ''}`),
            { discard: true }
        );
        yield* client.unsafe('PRAGMA foreign_keys = ON');
        yield* Effect.forEach(
            tables.map(({ name }, index) => ({ name, seq: SEQUENCE_OFFSET * (index + 1) })),
            ({ name, seq }) =>
                client
                    .unsafe('DELETE FROM sqlite_sequence WHERE name = ?', [name])
                    .pipe(Effect.andThen(client.unsafe('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)', [name, seq]))),
            { discard: true }
        );
    });

export const materializeRecords = (database: DB, records: readonly SyncRecordInterface[]) =>
    Effect.gen(function* () {
        const service = yield* SyncApplyService;
        const result = yield* service.apply({
            records: throughTransport(records).map(record => ({ record, systemFields: 'mapping-test' })),
            deletions: []
        });

        return result.rejected;
    }).pipe(
        Effect.provide(SyncApplyService.layer.pipe(Layer.provide(syncAccountBalanceRefresherLayer))),
        Effect.provideService(Db, database)
    );

export const hydratedSnapshot = (database: DB) =>
    Effect.gen(function* () {
        const client = database.$client;
        const labels = new Map<string, string>();

        for (const tableName of TABLE_ORDER) {
            const identityRows = yield* client.unsafe<{ readonly id?: number; readonly sync_id: string; readonly sync_zone: string }>(
                `SELECT rowid AS id, sync_id, sync_zone FROM "${tableName}"`
            );

            for (const row of identityRows) {
                labels.set(`${tableName}|${row.id}`, `${tableName}:${row.sync_zone}:${row.sync_id}`);
            }
        }

        const naturalRows = [
            ...(yield* client.unsafe<{ readonly id: number; readonly label: string }>(
                `SELECT id, 'instruments:' || code AS label FROM instruments`
            )).map(row => [`instruments|${row.id}`, row.label] as const),
            ...(yield* client.unsafe<{ readonly id: number; readonly label: string }>(
                `SELECT id, 'mcc_categories:' || mcc AS label FROM mcc_categories`
            )).map(row => [`mcc_categories|${row.id}`, row.label] as const)
        ];

        for (const [key, label] of naturalRows) {
            labels.set(key, label);
        }

        const snapshot: Record<string, readonly Record<string, unknown>[]> = {};

        for (const tableName of TABLE_ORDER) {
            const foreignKeys = yield* client.unsafe<{ readonly from: string; readonly table: string }>(
                `PRAGMA foreign_key_list("${tableName}")`
            );
            const targetByColumn = new Map<string, string>([
                ...Object.entries(UNDECLARED_FOREIGN_KEYS[tableName] ?? {}),
                ...foreignKeys.map(foreignKey => [foreignKey.from, foreignKey.table] as const)
            ]);
            const rows = yield* client.unsafe<Record<string, unknown>>(`SELECT * FROM "${tableName}"`);
            const normalized = rows.map(row =>
                Object.fromEntries(
                    Object.entries(row)
                        .filter(([column]) => !IGNORED_SNAPSHOT_COLUMNS.has(column))
                        .map(([column, value]) => {
                            const target = targetByColumn.get(column);

                            return [
                                column,
                                isDefined(target) && isNumber(value)
                                    ? (labels.get(`${target}|${value}`) ?? `missing:${target}|${value}`)
                                    : value
                            ];
                        })
                )
            );

            snapshot[tableName] = normalized.sort((left, right) => {
                const leftKey = `${String(left['sync_zone'])}|${String(left['sync_id'])}`;
                const rightKey = `${String(right['sync_zone'])}|${String(right['sync_id'])}`;

                if (leftKey < rightKey) {
                    return -1;
                }

                return leftKey > rightKey ? 1 : 0;
            });
        }

        return snapshot;
    });

export const seedFullLedger = (database: DB) =>
    Effect.gen(function* () {
        const seed = new TestSeedService(database);
        const [primaryInstrument, secondaryInstrument] = yield* database
            .select()
            .from(InstrumentEntityTable)
            .orderBy(InstrumentEntityTable.id);
        const [mccCategory] = yield* database.select().from(MccCategoryEntityTable).orderBy(MccCategoryEntityTable.id);
        const [seededCategory] = yield* database.select().from(CategoryEntityTable).where(eq(CategoryEntityTable.isDefault, true));
        const integration = yield* seed.bankIntegration({ provider: ExternalSourceEnum.MONOBANK, token: 'secret-token', label: 'Mono' });

        yield* database
            .update(BankIntegrationEntityTable)
            .set({ ownerInstallId: 'install-owner', externalClientId: 'client-1', historyProgress: '{"cursor":1}' })
            .where(eq(BankIntegrationEntityTable.id, integration.id));

        const wallet = yield* seed.account({ title: 'Wallet', instrumentId: primaryInstrument.id });
        const cash = yield* seed.account({
            title: 'Cash',
            type: AccountTypeEnum.CASH,
            instrumentId: primaryInstrument.id,
            parentId: wallet.id,
            contactId: 'contact-1',
            targetBaseInstrumentId: secondaryInstrument.id,
            targetBaseExchangeRate: 0.025,
            targetBaseAmount: 5_000_000,
            deadline: new Date('2027-01-01T00:00:00Z')
        });
        const bank = yield* seed.account({
            title: 'Bank',
            instrumentId: secondaryInstrument.id,
            externalId: 'mono-1',
            externalSource: ExternalSourceEnum.MONOBANK,
            iban: 'UA1234'
        });
        const friend = yield* seed.account({
            title: 'Friend',
            type: AccountTypeEnum.DEBT,
            nature: AccountNatureEnum.LIABILITY,
            debtType: AccountDebtTypeEnum.LENT,
            instrumentId: primaryInstrument.id
        });

        yield* database.update(AccountEntityTable).set({ integrationId: integration.id }).where(eq(AccountEntityTable.id, bank.id));
        yield* database.insert(AccountExternalIdEntityTable).values([
            { externalId: 'ext-a1', accountId: bank.id },
            { externalId: 'ext-a2', accountId: bank.id }
        ]);

        const coffee = yield* seed.category('Coffee');
        const espresso = yield* seed.category('Espresso');

        yield* database.update(CategoryEntityTable).set({ parentId: seededCategory.id }).where(eq(CategoryEntityTable.id, coffee.id));
        yield* database.update(CategoryEntityTable).set({ parentId: coffee.id }).where(eq(CategoryEntityTable.id, espresso.id));

        const trip = yield* seed.tag('trip');
        const work = yield* seed.tag('work');
        const [rule] = yield* database
            .insert(RuleEntityTable)
            .values({ enabled: true, conditionMatchType: RuleConditionMatchTypeEnum.ALL })
            .returning();

        yield* database.insert(RuleConditionEntityTable).values([
            { ruleId: rule.id, field: RuleConditionFieldEnum.TITLE, operator: RuleConditionOperatorEnum.CONTAINS, value: 'coffee' },
            {
                ruleId: rule.id,
                field: RuleConditionFieldEnum.AMOUNT,
                operator: RuleConditionOperatorEnum.BETWEEN,
                value: '1',
                secondaryValue: '9'
            }
        ]);
        yield* database.insert(RuleActionEntityTable).values([
            { ruleId: rule.id, type: RuleActionTypeEnum.SET_CATEGORY, categoryId: coffee.id },
            { ruleId: rule.id, type: RuleActionTypeEnum.ADD_TAG, tagId: trip.id }
        ]);

        const [series] = yield* database
            .insert(RecurringSeriesEntityTable)
            .values({
                merchantKey: 'netflix',
                kind: RecurringSeriesKindEnum.EXPENSE,
                periodDays: 30,
                amount: 9_990_000,
                status: RecurringSeriesStatusEnum.ACTIVE,
                userState: RecurringSeriesUserStateEnum.CONFIRMED,
                title: 'Netflix',
                categoryId: coffee.id,
                lastSeenAt: new Date('2026-10-01T00:00:00Z')
            })
            .returning();
        const [budget] = yield* database
            .insert(BudgetEntityTable)
            .values({
                name: 'Main',
                kind: BudgetKindEnum.MAIN,
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: 1,
                useLastDayOfMonth: false,
                overallLimit: 100_000_000,
                otherLimit: 10_000_000,
                instrumentId: primaryInstrument.id,
                tagId: trip.id
            })
            .returning();

        yield* database
            .insert(BudgetCategoryLimitEntityTable)
            .values({ budgetId: budget.id, categoryId: coffee.id, limitAmount: 5_000_000 });
        yield* database.insert(BudgetSinkingFundEntityTable).values({
            budgetId: budget.id,
            name: 'Fund',
            categoryId: coffee.id,
            targetAmount: 1_000_000,
            dueAt: new Date('2027-03-01T00:00:00Z'),
            recurringSeriesId: series.id
        });
        yield* database.insert(BudgetLimitChangeEntityTable).values({
            budgetId: budget.id,
            categoryId: coffee.id,
            previousAmount: 1,
            newAmount: 2,
            reason: BudgetLimitChangeReasonEnum.UNDER_SPENT,
            periodsObserved: 3,
            periodStart: new Date('2026-09-01T00:00:00Z')
        });

        const expense = yield* seed.manualExpense({
            accountId: cash.id,
            amount: 12_500_000,
            operatedAt: OPERATED_AT,
            categoryId: coffee.id,
            comment: 'morning',
            title: 'Cafe'
        });

        yield* database
            .update(TransactionEntityTable)
            .set({ updatedBy: TransactionUpdatedByEnum.USER, importFingerprint: 'imp-1' })
            .where(eq(TransactionEntityTable.id, expense.id));
        yield* database
            .update(TransactionEntryEntityTable)
            .set({ mccCategoryId: mccCategory.id })
            .where(eq(TransactionEntryEntityTable.transactionId, expense.id));
        yield* seed.transactionTag(expense.id, trip.id);
        yield* seed.transactionTag(expense.id, work.id);
        yield* database.insert(TransactionReceiptEntityTable).values({
            transactionId: expense.id,
            fingerprint: 'fp-1',
            receiptNumber: 'R1',
            merchantVatId: 'VAT',
            merchantLegalName: 'Cafe LLC'
        });

        const [expenseEntry] = yield* database
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, expense.id));

        yield* seed.manualExpense({
            accountId: cash.id,
            amount: 70_000_000,
            operatedAt: new Date('2026-10-03T10:00:00Z'),
            title: 'Salary',
            type: TransactionTypeEnum.INCOME
        });

        return {
            primaryInstrument,
            secondaryInstrument,
            mccCategory,
            wallet,
            cash,
            bank,
            friend,
            coffee,
            trip,
            expense,
            expenseEntry,
            seed
        };
    });

export const seedTransferRefundAndConsolidation = (database: DB, fixture: Effect.Success<ReturnType<typeof seedFullLedger>>) =>
    Effect.gen(function* () {
        const { seed, cash, bank, friend, expenseEntry, expense, mccCategory } = fixture;

        yield* seed.directTransfer({
            exchangeRate: 0.025,
            operatedAt: new Date('2026-10-04T10:00:00Z'),
            sourceAccountId: cash.id,
            sourceAmount: 100_000_000,
            sourceEntryExchangeRate: 1,
            targetAccountId: bank.id,
            targetAmount: 2_500_000,
            toIban: 'UA1234',
            title: 'Move'
        });

        const refunded = yield* seed.refundedExpense({
            accountId: cash.id,
            expenseAmount: 20_000_000,
            refundAmounts: [5_000_000],
            title: 'Shop'
        });
        const [refund] = refunded.refunds;

        yield* database
            .update(TransactionEntryEntityTable)
            .set({ originalTransactionId: refunded.expense.id })
            .where(eq(TransactionEntryEntityTable.transactionId, refund.id));
        yield* database
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: refunded.expense.id, consolidationType: TransactionConsolidationTypeEnum.REFUND })
            .where(eq(TransactionEntityTable.id, refund.id));

        const pair = yield* seed.amountTransferPair(40_000_000, mccCategory.id);
        const canonical = yield* seed.directTransfer({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            exchangeRate: 1,
            operatedAt: new Date('2026-10-05T10:00:00Z'),
            sourceAccountId: pair.fromAccount.id,
            sourceAmount: 40_000_000,
            sourceEntryExchangeRate: 1,
            targetAccountId: pair.toAccount.id,
            targetAmount: 40_000_000,
            toIban: null,
            title: 'Pair transfer'
        });

        for (const child of [pair.expense, pair.income]) {
            yield* database
                .update(TransactionEntityTable)
                .set({ consolidationParentTransactionId: canonical.id, consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR })
                .where(eq(TransactionEntityTable.id, child.id));
        }

        yield* seed.debtEvent(expense.id, friend.id, 3_000_000, expenseEntry.id);
    });

export const seedCrossZoneTransfer = (database: DB, sharedZone: string) =>
    Effect.gen(function* () {
        const seed = new TestSeedService(database);
        const [instrument] = yield* database.select().from(InstrumentEntityTable).orderBy(InstrumentEntityTable.id);
        const privateAccount = yield* seed.account({ title: 'Private savings', instrumentId: instrument.id });
        const sharedAccount = yield* seed.account({ title: 'Household joint', instrumentId: instrument.id });
        const privateTag = yield* seed.tag('secret-plan');

        yield* database.update(AccountEntityTable).set({ syncZone: sharedZone }).where(eq(AccountEntityTable.id, sharedAccount.id));

        const transfer = yield* seed.directTransfer({
            exchangeRate: 1,
            operatedAt: new Date('2026-10-06T10:00:00Z'),
            sourceAccountId: sharedAccount.id,
            sourceAmount: 7_654_321,
            sourceEntryExchangeRate: 1,
            targetAccountId: privateAccount.id,
            targetAmount: 3_141_592,
            toIban: 'UA-PRIVATE-IBAN',
            title: 'Top up savings'
        });

        yield* database.update(TransactionEntityTable).set({ comment: 'private memo' }).where(eq(TransactionEntityTable.id, transfer.id));
        yield* seed.transactionTag(transfer.id, privateTag.id);
        yield* database.insert(TransactionReceiptEntityTable).values({
            transactionId: transfer.id,
            fingerprint: 'private-fingerprint',
            receiptNumber: null,
            merchantVatId: null,
            merchantLegalName: null
        });
        yield* database
            .update(TransactionEntryEntityTable)
            .set({ syncZone: sharedZone })
            .where(eq(TransactionEntryEntityTable.accountId, sharedAccount.id));

        return { privateAccount, sharedAccount, privateTag, transfer };
    });
