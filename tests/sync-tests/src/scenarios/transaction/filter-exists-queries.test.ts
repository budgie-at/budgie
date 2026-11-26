import {
    AccountTypeEnum,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    TagSourceEnum,
    TransactionViewRepository
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, TestLayer } from '../../harness';

const OPERATED_AT = new Date(2026, 2, 10, 12, 0, 0);

describe('transaction/filter-exists-queries', () => {
    it.effect('filters transactions by amount range and untagged state through Drizzle relational queries', () =>
        Effect.gen(function* () {
            const transactionViewRepository = yield* TransactionViewRepository;
            const account = yield* seed.account({ type: AccountTypeEnum.CASH });
            const tag = yield* seed.tag('Tagged');

            const small = yield* seed.manualExpense({ accountId: account.id, amount: 10 * PRECISION, operatedAt: OPERATED_AT });
            const medium = yield* seed.manualExpense({ accountId: account.id, amount: 25 * PRECISION, operatedAt: OPERATED_AT });
            const large = yield* seed.manualExpense({ accountId: account.id, amount: 80 * PRECISION, operatedAt: OPERATED_AT });

            yield* seed.transactionTag(medium.id, tag.id, TagSourceEnum.USER);

            const amountFilter = { ...DEFAULT_TRANSACTION_FILTER, amount: { from: 20, to: 30 } };
            const byAmount = yield* transactionViewRepository.getAll(20, amountFilter, LanguageEnum.EN);
            const [amountCount] = yield* transactionViewRepository.countAll(amountFilter);

            expect(byAmount.map(transaction => transaction.id)).toEqual([medium.id]);
            expect(amountCount.value).toBe(1);

            const untaggedFilter = { ...DEFAULT_TRANSACTION_FILTER, tagIds: [] };
            const untagged = yield* transactionViewRepository.getAll(20, untaggedFilter, LanguageEnum.EN);
            const [untaggedCount] = yield* transactionViewRepository.countAll(untaggedFilter);

            expect(untagged.map(transaction => transaction.id).sort((left, right) => left - right)).toEqual(
                [small.id, large.id].sort((left, right) => left - right)
            );
            expect(untaggedCount.value).toBe(2);
        }).pipe(Effect.provide(TestLayer))
    );
});
