import { ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectRevertRestoresSources } from '../harness/consolidation-revert-audit';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const TRANSFER_AMOUNT = 10_000 * PRECISION;
const TRANSFER_FEE_DELTA_AMOUNT = 300 * PRECISION;
const TRANSFER_WITH_FEE_AMOUNT = TRANSFER_AMOUNT + TRANSFER_FEE_DELTA_AMOUNT;
const TOO_LARGE_FEE_AMOUNT = TRANSFER_AMOUNT + 600 * PRECISION;
const HINTED_FEE_OPERATED_AT = new Date('2026-05-14T11:30:00');
const SOURCE_CARD_SUFFIX = '0356';
const TARGET_CARD_SUFFIX = '5524';
const PRIVATBANK_FAKE_IBAN_PREFIX = 'UA1111111';

const seedPrivatbankAccount = (suffix: string, externalSource: ExternalSourceEnum | null = ExternalSourceEnum.PRIVATBANK) =>
    Effect.gen(function* () {
        return yield* testSeedService.bankSyncAccount(`Privatbank •${suffix}`, externalSource, `${PRIVATBANK_FAKE_IBAN_PREFIX}${suffix}`);
    });

const seedPrivatbankFeeTransfer = (
    incomeTitle: string = `Зі своєї картки *${SOURCE_CARD_SUFFIX}`,
    expenseAmount: number = TRANSFER_WITH_FEE_AMOUNT,
    incomeOperatedAt: Date = HINTED_FEE_OPERATED_AT,
    externalSource: ExternalSourceEnum | null = ExternalSourceEnum.PRIVATBANK
) =>
    Effect.gen(function* () {
        const operatedAt = HINTED_FEE_OPERATED_AT;
        const transferMcc = yield* testQueryService.findMccByCode('4829');
        const sourceAccount = yield* seedPrivatbankAccount(SOURCE_CARD_SUFFIX, externalSource);
        const targetAccount = yield* seedPrivatbankAccount(TARGET_CARD_SUFFIX, externalSource);
        const expense = yield* testSeedService.bankPairExpense(
            { externalId: 'privatbank-card-transfer-expense', operatedAt },
            { accountId: sourceAccount.id, amount: expenseAmount, mccCategoryId: transferMcc.id }
        );
        const income = yield* testSeedService.bankPairIncome(
            { externalId: 'privatbank-card-transfer-income', operatedAt: incomeOperatedAt },
            { accountId: targetAccount.id, amount: TRANSFER_AMOUNT, mccCategoryId: transferMcc.id }
        );

        yield* testSeedService.updateTransaction(expense.id, { title: `На свою картку *${TARGET_CARD_SUFFIX}` });
        yield* testSeedService.updateTransaction(income.id, { title: incomeTitle });

        return { expense, income, sourceAccount, targetAccount };
    });

const expectNoConsolidation = (expenseTransactionId: number, incomeTransactionId: number) =>
    Effect.gen(function* () {
        expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER)).toHaveLength(
            0
        );
        expect((yield* testQueryService.fetchTransactionById(expenseTransactionId)).consolidationParentTransactionId).toBeNull();
        expect((yield* testQueryService.fetchTransactionById(incomeTransactionId)).consolidationParentTransactionId).toBeNull();
    });

const expectSameBankHintedFeeConsolidation = (
    expenseTransactionId: number,
    incomeTransactionId: number,
    sourceAccountId: number,
    targetAccountId: number
) =>
    Effect.gen(function* () {
        const canonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER);

        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].fromAccountId).toBe(sourceAccountId);
        expect(canonicals[0].toAccountId).toBe(targetAccountId);
        expect(canonicals[0].exchangeRate).toBe(1);
        expect(
            (yield* Effect.forEach([expenseTransactionId, incomeTransactionId], id => testQueryService.fetchTransactionById(id))).map(
                transaction => transaction.consolidationParentTransactionId
            )
        ).toEqual([canonicals[0].id, canonicals[0].id]);
    });

const expectPrivatbankFeeTransferConsolidated = Effect.fnUntraced(function* (
    externalSource: ExternalSourceEnum | null = ExternalSourceEnum.PRIVATBANK
) {
    const { expense, income, sourceAccount, targetAccount } = yield* seedPrivatbankFeeTransfer(
        `Зі своєї картки *${SOURCE_CARD_SUFFIX}`,
        TRANSFER_WITH_FEE_AMOUNT,
        HINTED_FEE_OPERATED_AT,
        externalSource
    );

    const result = yield* runConsolidation();
    expect(result.consolidated).toBe(1);
    yield* expectSameBankHintedFeeConsolidation(expense.id, income.id, sourceAccount.id, targetAccount.id);
});

layer(TestLayer)('consolidation/same-bank-hinted-fee-transfer', it => {
    it.effect(
        'auto-consolidates a same-bank own-card transfer when titles point at both account suffixes and the amount delta is fee-sized',
        () =>
            Effect.gen(function* () {
                yield* expectPrivatbankFeeTransferConsolidated();
            })
    );

    it.effect('auto-consolidates legacy same-bank own-card transfers when account source is missing but IBAN bank prefix matches', () =>
        Effect.gen(function* () {
            yield* expectPrivatbankFeeTransferConsolidated(null);
        })
    );

    it.effect('restores both hinted fee transfer sides and account balances when the canonical is reverted', () =>
        Effect.gen(function* () {
            const { expense, income, sourceAccount, targetAccount } = yield* seedPrivatbankFeeTransfer();

            yield* expectRevertRestoresSources({
                accountIds: [sourceAccount.id, targetAccount.id],
                consolidationType: TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER,
                sourceTransactionIds: [expense.id, income.id]
            });
        })
    );

    it.effect('leaves a hinted transfer unconsolidated when the reciprocal account hint does not match', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedPrivatbankFeeTransfer('Зі своєї картки *9999');

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(0);
            yield* expectNoConsolidation(expense.id, income.id);
        })
    );

    it.effect('leaves a hinted transfer unconsolidated when the amount delta is larger than the fee window', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedPrivatbankFeeTransfer(`Зі своєї картки *${SOURCE_CARD_SUFFIX}`, TOO_LARGE_FEE_AMOUNT);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(0);
            yield* expectNoConsolidation(expense.id, income.id);
        })
    );

    it.effect('leaves a hinted transfer unconsolidated when the matching transactions are not close in time', () =>
        Effect.gen(function* () {
            const { expense, income } = yield* seedPrivatbankFeeTransfer(
                `Зі своєї картки *${SOURCE_CARD_SUFFIX}`,
                TRANSFER_WITH_FEE_AMOUNT,
                new Date(HINTED_FEE_OPERATED_AT.getTime() + 3 * 60 * 1000)
            );

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(0);
            yield* expectNoConsolidation(expense.id, income.id);
        })
    );
});
