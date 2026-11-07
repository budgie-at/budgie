import {
    AccountEntityTable,
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { OwnTransferRepairService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer, testQueryService } from '../../harness';

const titles = [
    '400000****2468',
    '*2468',
    '****2468',
    '•2468',
    'Олена Коваленко',
    'Kovalenko Olena',
    'own card *9999',
    'Зі своєї картки *9999',
    'propre compte',
    'eigenes Konto',
    'cuenta propia',
    'Відкриття депозиту',
    'deposit closing',
    'Binance UAH deposit',
    'Binance USDT withdrawal',
    'P24 *Kovalenko Olena'
];

describe('account/own-transfer-repair', () => {
    for (const title of titles) {
        it.effect(`repairs ${title} and is idempotent`, () =>
            Effect.gen(function* () {
                const repair = yield* OwnTransferRepairService;
                yield* seed.bankIntegration({ provider: ExternalSourceEnum.MONOBANK, label: 'Коваленко Олена' });
                const source = yield* seed.account();
                const target = yield* seed.account({ title: 'Own card •2468', externalId: '400000****2468' });
                const transaction = yield* seed.bankPairExpense(
                    { operatedAt: new Date('2026-05-01T12:00:00Z'), externalId: 'own-movement' },
                    { accountId: source.id, amount: 50_000_000 }
                );
                yield* seed.updateTransaction(transaction.id, {
                    title,
                    externalSource: title.startsWith('Binance') ? ExternalSourceEnum.BINANCE : ExternalSourceEnum.MONOBANK
                });

                expect(yield* repair.repair()).toBe(1);
                const result = yield* testQueryService.findTransactionById(transaction.id);
                expect(result.type).toBe(TransactionTypeEnum.TRANSFER);
                expect(result.fromAccountId).toBe(source.id);
                if (title.includes('2468')) {
                    expect(result.toAccountId).toBe(target.id);
                }
                expect(yield* repair.repair()).toBe(0);
            }).pipe(Effect.provide(TestLayer))
        );
    }

    it.effect('pairs a unique counterpart through consolidation', () =>
        Effect.gen(function* () {
            const repair = yield* OwnTransferRepairService;
            const source = yield* seed.account();
            const target = yield* seed.account({ externalId: '400000****2468' });
            const operatedAt = new Date('2026-05-01T12:00:00Z');
            const expense = yield* seed.bankPairExpense(
                { operatedAt, externalId: 'outgoing' },
                { accountId: source.id, amount: 50_000_000 }
            );
            const income = yield* seed.bankPairIncome({ operatedAt, externalId: 'incoming' }, { accountId: target.id, amount: 50_000_000 });
            yield* seed.updateTransaction(expense.id, { title: '*2468', externalSource: ExternalSourceEnum.MONOBANK });
            yield* seed.updateTransaction(income.id, { externalSource: ExternalSourceEnum.MONOBANK });
            expect(yield* repair.repair()).toBe(1);
            expect((yield* testQueryService.findTransactionById(expense.id)).consolidationParentTransactionId).toBeTruthy();
            expect(yield* repair.repair()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('preserves other people, unknown cards and user edits', () =>
        Effect.gen(function* () {
            const repair = yield* OwnTransferRepairService;
            yield* seed.bankIntegration({ provider: ExternalSourceEnum.MONOBANK, label: 'Коваленко Олена' });
            const account = yield* seed.account();
            for (const title of ['*9876', 'Ірина М.', 'own card']) {
                const transaction = yield* seed.bankPairExpense(
                    { operatedAt: new Date('2026-05-01T12:00:00Z'), externalId: title },
                    { accountId: account.id, amount: 20_000_000 }
                );
                yield* seed.updateTransaction(transaction.id, {
                    title,
                    externalSource: ExternalSourceEnum.MONOBANK,
                    ...(title === 'own card' && { updatedBy: TransactionUpdatedByEnum.USER })
                });
            }
            expect(yield* repair.repair()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
    it.effect('preserves manually categorized entries and repairs an unmatched income', () =>
        Effect.gen(function* () {
            const repair = yield* OwnTransferRepairService;
            const account = yield* seed.account();
            const operatedAt = new Date('2026-05-01T12:00:00Z');
            const income = yield* seed.bankPairIncome(
                { operatedAt, externalId: 'income-only' },
                { accountId: account.id, amount: 50_000_000 }
            );
            const expense = yield* seed.bankPairExpense(
                { operatedAt, externalId: 'categorized' },
                { accountId: account.id, amount: 20_000_000 }
            );
            const category = yield* seed.category('Synthetic category');
            yield* seed.updateTransaction(income.id, { title: 'own account', externalSource: ExternalSourceEnum.MONOBANK });
            yield* seed.updateTransaction(expense.id, { title: 'own account', externalSource: ExternalSourceEnum.MONOBANK });
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ categoryId: category.id, categorySource: CategorySourceEnum.USER })
                .where(eq(TransactionEntryEntityTable.transactionId, expense.id));
            expect(yield* repair.repair()).toBe(1);
            const result = yield* testQueryService.findTransactionById(income.id);
            expect(result.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(result.toAccountId).toBe(account.id);
            expect((yield* testQueryService.findTransactionById(expense.id)).type).toBe(TransactionTypeEnum.EXPENSE);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('account/own-transfer-repair safety', () => {
    for (const title of ['Amy Cardenas', 'Tommy Card Shop', 'Brown Accountants', 'Top up my card Uber', 'Tax 2024', 'Олена К.']) {
        it.effect(`preserves ambiguous title ${title}`, () =>
            Effect.gen(function* () {
                const repair = yield* OwnTransferRepairService;
                yield* seed.bankIntegration({ provider: ExternalSourceEnum.MONOBANK, label: 'Коваленко Олена' });
                const source = yield* seed.account();
                yield* seed.account({ externalId: '400000****2024' });
                const transaction = yield* seed.bankPairExpense(
                    { operatedAt: new Date('2026-05-01T12:00:00Z'), externalId: title },
                    { accountId: source.id, amount: 50_000_000 }
                );
                yield* seed.updateTransaction(transaction.id, { title, externalSource: ExternalSourceEnum.MONOBANK });
                expect(yield* repair.repair()).toBe(0);
                expect((yield* testQueryService.findTransactionById(transaction.id)).type).toBe(TransactionTypeEnum.EXPENSE);
            }).pipe(Effect.provide(TestLayer))
        );
    }

    for (const scenario of [
        'synced',
        'manual',
        'ambiguous',
        'deleted',
        'live duplicate',
        'iban',
        'mcc',
        'scope',
        'nonconvertible',
        'abbreviated',
        'binance',
        'enable banking'
    ]) {
        it.effect(`handles ${scenario} safely`, () =>
            Effect.gen(function* () {
                const repair = yield* OwnTransferRepairService;
                const integration = yield* seed.bankIntegration({
                    provider: scenario === 'enable banking' ? ExternalSourceEnum.ENABLE_BANKING : ExternalSourceEnum.MONOBANK,
                    label: scenario === 'enable banking' ? 'Erste Bank' : 'Коваленко Олена'
                });
                const source = yield* seed.account();
                const target = yield* seed.account({
                    externalId: scenario === 'iban' ? 'DE1234562468' : '400000****2468',
                    iban: 'DE1234562468'
                });
                if (scenario === 'synced') {
                    yield* testDb
                        .update(AccountEntityTable)
                        .set({ integrationId: integration.id })
                        .where(eq(AccountEntityTable.id, target.id));
                }
                if (scenario === 'deleted') {
                    yield* testDb.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, target.id));
                }
                if (scenario === 'live duplicate') {
                    const deleted = yield* seed.account({ externalId: target.externalId });
                    yield* testDb.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, deleted.id));
                }
                const operatedAt = new Date('2026-05-01T12:00:00Z');
                const transaction = yield* seed.bankPairExpense(
                    { operatedAt, externalId: 'safety-expense' },
                    { accountId: source.id, amount: 50_000_000 }
                );
                const holderTitle = scenario === 'abbreviated' ? 'Олена К.' : 'XXXX2468';
                yield* seed.updateTransaction(transaction.id, {
                    title: scenario === 'enable banking' ? 'Erste Bank' : holderTitle,
                    externalSource: ExternalSourceEnum.MONOBANK,
                    ...(scenario === 'nonconvertible' && { fromAccountId: null })
                });
                if (scenario === 'mcc') {
                    const category = yield* seed.category('Synthetic MCC');
                    yield* testDb
                        .update(TransactionEntryEntityTable)
                        .set({ categoryId: category.id, categorySource: CategorySourceEnum.MCC_DEFAULT })
                        .where(eq(TransactionEntryEntityTable.transactionId, transaction.id));
                }
                if (['ambiguous', 'abbreviated', 'binance'].includes(scenario)) {
                    const counterpart = yield* seed.bankPairIncome(
                        { operatedAt, externalId: 'safety-income' },
                        { accountId: target.id, amount: 50_000_000 }
                    );
                    yield* seed.updateTransaction(counterpart.id, {
                        title: scenario === 'binance' ? 'Binance UAH deposit' : 'Counterpart',
                        externalSource: scenario === 'binance' ? ExternalSourceEnum.BINANCE : ExternalSourceEnum.MONOBANK
                    });
                }
                if (scenario === 'ambiguous') {
                    const second = yield* seed.bankPairIncome(
                        { operatedAt, externalId: 'second-income' },
                        { accountId: target.id, amount: 50_000_000 }
                    );
                    yield* seed.updateTransaction(second.id, { externalSource: ExternalSourceEnum.MONOBANK });
                }
                const expected = ['manual', 'live duplicate', 'mcc', 'abbreviated', 'binance'].includes(scenario) ? 1 : 0;
                expect(
                    yield* repair.repair(
                        scenario === 'scope'
                            ? {
                                  operatedAtFrom: new Date('2026-08-01'),
                                  operatedAtTo: new Date('2026-08-02'),
                                  transactionIds: []
                              }
                            : null
                    )
                ).toBe(expected);
                if (['manual', 'live duplicate', 'mcc'].includes(scenario)) {
                    expect((yield* testQueryService.findTransactionById(transaction.id)).toAccountId).toBe(target.id);
                }
                if (['abbreviated', 'binance'].includes(scenario)) {
                    const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
                    expect(canonical.fromAccountId).toBe(source.id);
                    expect(canonical.toAccountId).toBe(target.id);
                }
                if (scenario === 'nonconvertible') {
                    expect(yield* repair.repair()).toBe(0);
                }
            }).pipe(Effect.provide(TestLayer))
        );
    }
});
