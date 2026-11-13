import {
    AccountEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    INVESTMENTS_CATEGORY_ID,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum,
    YieldKindEnum
} from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/ledger';
import { BankInterestDetectorService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';

const OPERATED_AT = new Date('2026-06-01T08:00:00.000Z');

const seedBankWithPositions = (positionCount: number) =>
    Effect.gen(function* () {
        const integration = yield* seed.bankIntegration();
        const bank = yield* seed.account({ title: 'Mono', type: AccountTypeEnum.BANK_SYNC, externalSource: ExternalSourceEnum.MONOBANK });
        const positions = yield* Effect.forEach(
            Array.from({ length: positionCount }, (_, index) => index),
            index => seed.account({ title: `Deposit ${index}`, type: AccountTypeEnum.DEPOSIT })
        );

        yield* testDb
            .update(AccountEntityTable)
            .set({ integrationId: integration.id })
            .where(inArray(AccountEntityTable.id, [bank.id, ...positions.map(({ id }) => id)]));

        return { bank, positions };
    });

const seedIncome = (accountId: number, externalId: string, title: string) =>
    seed.manualExpense({
        accountId,
        amount: 2_000_000,
        operatedAt: OPERATED_AT,
        title,
        externalId,
        externalSource: ExternalSourceEnum.MONOBANK,
        type: TransactionTypeEnum.INCOME
    });

const readTag = (transactionId: number) =>
    testDb
        .select({
            yieldKind: TransactionEntityTable.yieldKind,
            yieldSourceAccountId: TransactionEntityTable.yieldSourceAccountId,
            categoryId: TransactionEntryEntityTable.categoryId
        })
        .from(TransactionEntityTable)
        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
        .where(eq(TransactionEntityTable.id, transactionId))
        .pipe(Effect.map(([row]) => row));

const detect = Effect.flatMap(BankInterestDetectorService, service => service.tag(null)).pipe(
    Effect.provide(BankInterestDetectorService.layer)
);

describe('sync/bank-interest-detector', () => {
    it.effect('tags bank interest with the single same-integration deposit and the Investments category', () =>
        Effect.gen(function* () {
            const { bank, positions } = yield* seedBankWithPositions(1);
            const interest = yield* seedIncome(bank.id, 'int-1', 'Нарахування відсотків за депозитом');
            const salary = yield* seedIncome(bank.id, 'salary-1', 'Salary ACME');

            yield* detect;

            expect(yield* readTag(interest.id)).toEqual({
                yieldKind: YieldKindEnum.INTEREST,
                yieldSourceAccountId: positions[0].id,
                categoryId: INVESTMENTS_CATEGORY_ID
            });
            expect(yield* readTag(salary.id)).toEqual({ yieldKind: null, yieldSourceAccountId: null, categoryId: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves the source empty when two positions share the integration', () =>
        Effect.gen(function* () {
            const { bank } = yield* seedBankWithPositions(2);
            const interest = yield* seedIncome(bank.id, 'int-2', 'Credit interest');

            yield* detect;

            expect(yield* readTag(interest.id)).toMatchObject({ yieldKind: YieldKindEnum.INTEREST, yieldSourceAccountId: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('never re-tags a row the user marked as not passive income', () =>
        Effect.gen(function* () {
            const { bank } = yield* seedBankWithPositions(1);
            const interest = yield* seedIncome(bank.id, 'int-3', 'Interest payment');

            yield* testDb
                .update(TransactionEntityTable)
                .set({ yieldKind: YieldKindEnum.NONE })
                .where(eq(TransactionEntityTable.id, interest.id));
            yield* detect;

            expect((yield* readTag(interest.id)).yieldKind).toBe(YieldKindEnum.NONE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each(['Zinsgutschrift', 'Intereses cuenta', 'Intérêts créditeurs', 'ПРОЦЕНТИ НА ЗАЛИШОК', 'Interest'])(
        'matches %s in any language',
        title =>
            Effect.gen(function* () {
                const { bank } = yield* seedBankWithPositions(1);
                const interest = yield* seedIncome(bank.id, `int-${title}`, title);

                yield* detect;

                expect((yield* readTag(interest.id)).yieldKind).toBe(YieldKindEnum.INTEREST);
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('runs after a sync through transfer consolidation', () =>
        Effect.gen(function* () {
            const { bank } = yield* seedBankWithPositions(1);
            const interest = yield* seedIncome(bank.id, 'int-4', 'Interest payment');

            yield* Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));

            expect((yield* readTag(interest.id)).yieldKind).toBe(YieldKindEnum.INTEREST);
        }).pipe(Effect.provide(TestLayer))
    );
});
