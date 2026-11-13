import {
    AccountEntityTable,
    AccountTypeEnum,
    LanguageEnum,
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
            const deposit = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });
            const card = yield* seed.account({ type: AccountTypeEnum.BANK });
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
