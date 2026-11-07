import {
    CategorySourceEnum,
    ExternalSourceEnum,
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
    'own card *9999',
    'Зі своєї картки *9999',
    'mon compte',
    'mein Konto',
    'mi cuenta',
    'Відкриття депозиту',
    'deposit closing',
    'Binance UAH deposit',
    'Binance USDT withdrawal',
    'Олена К.',
    'P24 *Kovalenko Olena'
];

describe('account/own-transfer-repair', () => {
    for (const title of titles) {
        it.effect(`repairs ${title} and is idempotent`, () =>
            Effect.gen(function* () {
                const repair = yield* OwnTransferRepairService;
                yield* seed.bankIntegration({ label: 'Коваленко Олена' });
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
            yield* seed.bankIntegration({ label: 'Коваленко Олена' });
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
            yield* seed.updateTransaction(income.id, { title: 'my account', externalSource: ExternalSourceEnum.MONOBANK });
            yield* seed.updateTransaction(expense.id, { title: 'my account', externalSource: ExternalSourceEnum.MONOBANK });
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
