import {
    AccountEntityTable,
    ExternalSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { OwnTransferRepairService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { ownTransferDetector } from '../../../../../packages/sync/src/core/detector/own-transfer.detector';
import { OwnTransferRepository } from '../../../../../packages/sync/src/core/repository/own-transfer.repository';
import { explainQueryPlan, seed, testDb, TestLayer, testQueryService } from '../../harness';

const operatedAt = new Date('2026-05-01T12:00:00Z');
const fixture = Effect.gen(function* () {
    const repair = yield* OwnTransferRepairService;
    const integration = yield* seed.bankIntegration({ provider: ExternalSourceEnum.MONOBANK, label: 'Коваленко Олена' });
    const source = yield* seed.account();
    const target = yield* seed.account({ externalId: 'fixture-mono-id', title: 'Monobank Black •2468', integrationId: integration.id });
    yield* testDb.update(AccountEntityTable).set({ integrationId: integration.id }).where(eq(AccountEntityTable.id, target.id));
    const expense = yield* seed.bankPairExpense({ operatedAt, externalId: 'outgoing' }, { accountId: source.id, amount: 50_000_000 });
    yield* seed.updateTransaction(expense.id, { title: 'Зі своєї картки *2468', externalSource: ExternalSourceEnum.MONOBANK });

    return { repair, source, target, expense };
});
const addIncome = (accountId: number) =>
    Effect.gen(function* () {
        const income = yield* seed.bankPairIncome({ operatedAt, externalId: 'incoming' }, { accountId, amount: 50_000_000 });
        yield* seed.updateTransaction(income.id, { externalSource: ExternalSourceEnum.MONOBANK });

        return income;
    });
const expectExpense = (transactionId: number) =>
    Effect.gen(function* () {
        const transaction = yield* testQueryService.findTransactionById(transactionId);
        expect(transaction.type).toBe(TransactionTypeEnum.EXPENSE);
        expect(transaction.consolidationParentTransactionId).toBeNull();
    });
const expectUnpaired = (expenseId: number, incomeId: number) =>
    Effect.gen(function* () {
        const repair = yield* OwnTransferRepairService;
        expect(yield* repair.repair()).toBe(0);
        yield* expectExpense(expenseId);
        expect((yield* testQueryService.findTransactionById(incomeId)).type).toBe(TransactionTypeEnum.INCOME);
    });
const expectPair = (expenseId: number, incomeId: number, sourceId: number, targetId: number) =>
    Effect.gen(function* () {
        const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonical.type).toBe(TransactionTypeEnum.TRANSFER);
        expect(canonical.fromAccountId).toBe(sourceId);
        expect(canonical.toAccountId).toBe(targetId);
        expect((yield* testQueryService.findTransactionById(expenseId)).consolidationParentTransactionId).toBe(canonical.id);
        expect((yield* testQueryService.findTransactionById(incomeId)).consolidationParentTransactionId).toBe(canonical.id);
    });

describe('account/own-transfer-repair', () => {
    it.effect('pairs an API-id account using the mask in its title', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            const income = yield* addIncome(target.id);
            const repository = yield* OwnTransferRepository;
            expect(yield* repository.findOpposites([expense.id])).toEqual([{ transactionId: expense.id, oppositeId: income.id }]);
            expect((yield* explainQueryPlan(repository.findOpposites([expense.id]))).some(step => step.includes('SEARCH'))).toBe(true);
            expect(yield* repair.repair()).toBe(1);
            yield* expectPair(expense.id, income.id, source.id, target.id);
            expect(yield* repair.repair()).toBe(0);
        }).pipe(Effect.provide([OwnTransferRepository.layer, TestLayer]))
    );

    it.effect('leaves a synced card without its opposite unchanged and creates no account', () =>
        Effect.gen(function* () {
            const { repair, expense } = yield* fixture;
            expect(yield* repair.repair()).toBe(0);
            yield* expectExpense(expense.id);
            expect(yield* testDb.query.AccountEntityTable.findMany({ where: { externalId: 'untracked-own-account' } })).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('pairs a phrase only after the other synced leg arrives in a later scoped repair', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            const scope = { operatedAtFrom: operatedAt, operatedAtTo: operatedAt, transactionIds: [expense.id] };
            yield* seed.updateTransaction(expense.id, { title: 'На свою картку' });
            expect(yield* repair.repair(scope)).toBe(0);
            yield* expectExpense(expense.id);
            const income = yield* addIncome(target.id);
            expect(yield* repair.repair(scope)).toBe(1);
            yield* expectPair(expense.id, income.id, source.id, target.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('preserves a phrase with two matching card targets', () =>
        Effect.gen(function* () {
            const { repair, expense } = yield* fixture;
            yield* seed.account({ title: 'Another card •2468' });
            expect(yield* repair.repair()).toBe(0);
            yield* expectExpense(expense.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('preserves two expenses competing for one eligible income', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            const duplicate = yield* seed.bankPairExpense(
                { operatedAt, externalId: 'duplicate' },
                { accountId: source.id, amount: 50_000_000 }
            );
            yield* seed.updateTransaction(duplicate.id, { title: 'На свою картку', externalSource: ExternalSourceEnum.MONOBANK });
            const income = yield* addIncome(target.id);
            expect(yield* repair.repair()).toBe(0);
            yield* expectExpense(expense.id);
            yield* expectExpense(duplicate.id);
            expect((yield* testQueryService.findTransactionById(income.id)).type).toBe(TransactionTypeEnum.INCOME);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not convert into a manual account with an existing manual opposite', () =>
        Effect.gen(function* () {
            const { target, expense } = yield* fixture;
            yield* testDb.update(AccountEntityTable).set({ integrationId: null }).where(eq(AccountEntityTable.id, target.id));
            const income = yield* addIncome(target.id);
            yield* testDb.update(TransactionEntityTable).set({ externalSource: null }).where(eq(TransactionEntityTable.id, income.id));
            yield* expectUnpaired(expense.id, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('preserves a user-edited opposite', () =>
        Effect.gen(function* () {
            const { target, expense } = yield* fixture;
            const income = yield* addIncome(target.id);
            yield* testDb
                .update(TransactionEntityTable)
                .set({ updatedBy: TransactionUpdatedByEnum.USER })
                .where(eq(TransactionEntityTable.id, income.id));
            yield* expectUnpaired(expense.id, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('converts a unique manual card without an opposite exactly once', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            yield* testDb.update(AccountEntityTable).set({ integrationId: null }).where(eq(AccountEntityTable.id, target.id));
            expect(yield* repair.repair()).toBe(1);
            const result = yield* testQueryService.findTransactionById(expense.id);
            expect(result.type).toBe(TransactionTypeEnum.TRANSFER);
            expect(result.fromAccountId).toBe(source.id);
            expect(result.toAccountId).toBe(target.id);
            expect(yield* repair.repair()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('uses Binance titles only for pairing', () =>
        Effect.gen(function* () {
            const { repair, source, target, expense } = yield* fixture;
            yield* seed.updateTransaction(expense.id, { title: 'Binance USDT withdrawal', externalSource: ExternalSourceEnum.BINANCE });
            expect(yield* repair.repair()).toBe(0);
            yield* expectExpense(expense.id);
            const income = yield* addIncome(target.id);
            expect(yield* repair.repair()).toBe(1);
            yield* expectPair(expense.id, income.id, source.id, target.id);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('own transfer detector', () => {
    it.each(['400000****2468', '*2468', '****2468', '•2468', 'Зі своєї картки *2468'])('matches the account title mask for %s', title => {
        expect(ownTransferDetector.matchesAccount(title, { externalId: 'fixture-mono-id', title: 'Monobank Black •2468' })).toBe(true);
    });
    it.each([
        'Олена Коваленко',
        'Kovalenko Olena',
        'own card *9999',
        'Зі своєї картки *9999',
        'propre compte',
        'eigenes Konto',
        'cuenta propia',
        'Відкриття депозиту',
        'deposit closing',
        'P24 *Kovalenko Olena'
    ])('recognizes own movement signal %s', title => {
        expect(ownTransferDetector.matches(title, ['Коваленко Олена'])).toBe(true);
    });
    it.each(['Amy Cardenas', 'Tommy Card Shop', 'Brown Accountants', 'Top up my card Uber', 'Tax 2024'])(
        'rejects unrelated title %s',
        title => {
            expect(ownTransferDetector.matches(title, ['Коваленко Олена'])).toBe(false);
            expect(ownTransferDetector.matchesAbbreviatedName(title, ['Коваленко Олена'])).toBe(false);
        }
    );
});
