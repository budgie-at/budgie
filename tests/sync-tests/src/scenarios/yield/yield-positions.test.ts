import {
    AccountEntityTable,
    AccountTypeEnum,
    LanguageEnum,
    InstrumentTypeEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionTypeEnum,
    YieldKindEnum,
    YieldRepository
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';

import type { YieldScopeInterface } from '@budgie/contracts';

const ALL: YieldScopeInterface = { positionAccountId: null, instrumentId: null };

const seedIncome = Effect.fnUntraced(function* (accountId: number, day: number, kind: YieldKindEnum | null) {
    const transaction = yield* seed.manualExpense({
        accountId,
        amount: day * PRECISION,
        operatedAt: new Date(2026, 2, day, 12, 0, 0),
        type: TransactionTypeEnum.INCOME
    });

    yield* testDb.update(TransactionEntityTable).set({ yieldKind: kind }).where(eq(TransactionEntityTable.id, transaction.id));

    return transaction;
});

const seedDepositAndCard = Effect.gen(function* () {
    const deposit = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });
    const card = yield* seed.account({ type: AccountTypeEnum.BANK });

    return { deposit, card };
});

describe('yield/positions', () => {
    it.effect('lists attributed positions and rated deposits or savings without payouts', () =>
        Effect.gen(function* () {
            const repository = yield* YieldRepository;
            const crypto = yield* seed.account({ type: AccountTypeEnum.CRYPTO, title: 'ETH' });
            const rated = yield* seed.account({ type: AccountTypeEnum.DEPOSIT, title: 'Term' });
            const unrated = yield* seed.account({ type: AccountTypeEnum.SAVINGS, title: 'Jar' });
            const closed = yield* seed.account({ type: AccountTypeEnum.DEPOSIT, title: 'Closed', isActive: false });

            yield* testDb.update(AccountEntityTable).set({ interestRate: 12 }).where(eq(AccountEntityTable.id, rated.id));
            yield* testDb.update(AccountEntityTable).set({ interestRate: 9 }).where(eq(AccountEntityTable.id, closed.id));

            const all = yield* repository.findPositions([crypto.id], ALL);
            const scoped = yield* repository.findPositions([], { positionAccountId: unrated.id, instrumentId: null });

            expect(all).toHaveLength(2);
            expect(all.map(row => [row.title, row.interestRate])).toEqual(
                expect.arrayContaining([
                    ['ETH', null],
                    ['Term', 12]
                ])
            );
            expect(scoped).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('scopes rated accounts by position and instrument and excludes deleted or rate-0 deposits', () =>
        Effect.gen(function* () {
            const repository = yield* YieldRepository;
            const coin = yield* seed.instrument({ code: 'YPS1', name: 'Yield coin', symbol: 'YPS1', type: InstrumentTypeEnum.CRYPTO });
            const rated = yield* seed.account({ type: AccountTypeEnum.DEPOSIT, title: 'Term', instrumentId: coin.id });
            const savings = yield* seed.account({ type: AccountTypeEnum.SAVINGS, title: 'Jar' });
            const zero = yield* seed.account({ type: AccountTypeEnum.DEPOSIT, title: 'Zero' });
            const deleted = yield* seed.account({ type: AccountTypeEnum.DEPOSIT, title: 'Gone' });
            const deadline = new Date(2027, 0, 5, 12, 0, 0);

            yield* testDb.update(AccountEntityTable).set({ interestRate: 12, deadline }).where(eq(AccountEntityTable.id, rated.id));
            yield* testDb.update(AccountEntityTable).set({ interestRate: 5 }).where(eq(AccountEntityTable.id, savings.id));
            yield* testDb.update(AccountEntityTable).set({ interestRate: 0 }).where(eq(AccountEntityTable.id, zero.id));
            yield* testDb
                .update(AccountEntityTable)
                .set({ interestRate: 7, deletedAt: new Date() })
                .where(eq(AccountEntityTable.id, deleted.id));

            const titles = (positions: readonly { readonly title: string }[]) => positions.map(position => position.title);

            expect(titles(yield* repository.findPositions([], ALL))).toEqual(expect.arrayContaining(['Term', 'Jar']));
            expect(yield* repository.findPositions([], ALL)).toHaveLength(2);
            expect(titles(yield* repository.findPositions([], { positionAccountId: rated.id, instrumentId: null }))).toEqual(['Term']);
            expect(yield* repository.findPositions([], { positionAccountId: zero.id, instrumentId: null })).toEqual([]);
            expect(yield* repository.findPositions([], { positionAccountId: deleted.id, instrumentId: null })).toEqual([]);
            expect(titles(yield* repository.findPositions([], { positionAccountId: null, instrumentId: coin.id }))).toEqual(['Term']);
            expect(yield* repository.findPositions([], { positionAccountId: null, instrumentId: coin.id + 1000 })).toEqual([]);
            expect(yield* repository.findPositions([], { positionAccountId: savings.id, instrumentId: coin.id })).toEqual([]);

            const [term] = yield* repository.findPositions([], { positionAccountId: rated.id, instrumentId: null });

            expect(term).toMatchObject({
                interestRate: 12,
                instrumentCode: 'YPS1',
                instrumentType: InstrumentTypeEnum.CRYPTO,
                isActive: true
            });
            expect(term.deadline?.getTime()).toBe(deadline.getTime());
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns attributed accounts regardless of the rated scope', () =>
        Effect.gen(function* () {
            const repository = yield* YieldRepository;
            const crypto = yield* seed.account({ type: AccountTypeEnum.CRYPTO, title: 'ETH' });
            const other = yield* seed.account({ type: AccountTypeEnum.DEPOSIT, title: 'Other' });
            const positions = yield* repository.findPositions([crypto.id], { positionAccountId: other.id, instrumentId: null });

            expect(positions.map(position => position.title)).toEqual(['ETH']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('counts transfers in and out and fees, skipping deleted transactions and consolidation children', () =>
        Effect.gen(function* () {
            const repository = yield* YieldRepository;
            const { deposit, card } = yield* seedDepositAndCard;
            const day = (value: number) => new Date(2026, 2, value, 12, 0, 0);
            const transferAmount = (sourceAccountId: number, targetAccountId: number, amount: number, operatedAt: Date) =>
                seed.directTransfer({
                    exchangeRate: 1,
                    toIban: null,
                    sourceEntryExchangeRate: 1,
                    operatedAt,
                    sourceAccountId,
                    sourceAmount: amount,
                    targetAccountId,
                    targetAmount: amount
                });

            yield* transferAmount(card.id, deposit.id, 10 * PRECISION, day(1));
            yield* transferAmount(deposit.id, card.id, 4 * PRECISION, day(2));
            const withFee = yield* seed.manualExpense({ accountId: deposit.id, amount: 2 * PRECISION, operatedAt: day(3) });
            yield* seed.feeEntry(withFee.id, null, { accountId: deposit.id, amount: PRECISION });
            const removed = yield* seed.manualExpense({ accountId: deposit.id, amount: 100 * PRECISION, operatedAt: day(4) });
            const child = yield* seed.manualExpense({ accountId: deposit.id, amount: 200 * PRECISION, operatedAt: day(5) });

            yield* testDb.update(TransactionEntityTable).set({ deletedAt: new Date() }).where(eq(TransactionEntityTable.id, removed.id));
            yield* testDb
                .update(TransactionEntityTable)
                .set({ consolidationParentTransactionId: withFee.id })
                .where(eq(TransactionEntityTable.id, child.id));

            const movements = yield* repository.findPositionMovements([deposit.id]);

            expect(movements.map(movement => movement.amount)).toEqual([10 * PRECISION, -4 * PRECISION, -2 * PRECISION, -PRECISION]);
            expect(movements.every(movement => movement.accountId === deposit.id)).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns signed ledger movements in date order', () =>
        Effect.gen(function* () {
            const repository = yield* YieldRepository;
            const deposit = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });

            yield* seedIncome(deposit.id, 1, null);
            yield* seed.manualExpense({ accountId: deposit.id, amount: 3 * PRECISION, operatedAt: new Date(2026, 2, 2, 12, 0, 0) });

            expect((yield* repository.findPositionMovements([deposit.id])).map(movement => movement.amount)).toEqual([
                PRECISION,
                -3 * PRECISION
            ]);
            expect(yield* repository.findPositionMovements([])).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns payouts newest first, filtered by kinds or to Unassigned only', () =>
        Effect.gen(function* () {
            const repository = yield* YieldRepository;
            const { deposit, card } = yield* seedDepositAndCard;
            const interest = yield* seedIncome(deposit.id, 1, YieldKindEnum.INTEREST);
            const dividend = yield* seedIncome(deposit.id, 2, YieldKindEnum.DIVIDEND);
            const unassigned = yield* seedIncome(card.id, 3, YieldKindEnum.INTEREST);
            const query = { scope: ALL, kinds: null, isUnassignedOnly: false, limit: 10, language: LanguageEnum.EN };

            expect((yield* repository.findPayouts(query)).map(transaction => transaction.id)).toEqual([
                unassigned.id,
                dividend.id,
                interest.id
            ]);
            expect(
                (yield* repository.findPayouts({ ...query, kinds: [YieldKindEnum.INTEREST] })).map(transaction => transaction.id)
            ).toEqual([unassigned.id, interest.id]);
            expect((yield* repository.findPayouts({ ...query, isUnassignedOnly: true })).map(transaction => transaction.id)).toEqual([
                unassigned.id
            ]);
            expect((yield* repository.findPayouts(query)).at(0)?.entries.at(0)?.account.id).toBe(card.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
