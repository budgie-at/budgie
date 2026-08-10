import { ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { expectRevertRestoresSources } from '../harness/consolidation-revert-audit';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

const TRANSFER_AMOUNT = 10_000 * PRECISION;
const TRANSFER_FEE_DELTA_AMOUNT = 300 * PRECISION;
const TRANSFER_WITH_FEE_AMOUNT = TRANSFER_AMOUNT + TRANSFER_FEE_DELTA_AMOUNT;
const TOO_LARGE_FEE_AMOUNT = TRANSFER_AMOUNT + 600 * PRECISION;
const HINTED_FEE_OPERATED_AT = new Date('2026-05-14T11:30:00');
const SOURCE_CARD_SUFFIX = '0356';
const TARGET_CARD_SUFFIX = '5524';
const PRIVATBANK_FAKE_IBAN_PREFIX = 'UA1111111';

const seedPrivatbankAccount = (suffix: string, externalSource: ExternalSourceEnum | null = ExternalSourceEnum.PRIVATBANK) =>
    testSeedService.bankSyncAccount(`Privatbank •${suffix}`, externalSource, `${PRIVATBANK_FAKE_IBAN_PREFIX}${suffix}`);

const seedPrivatbankFeeTransfer = (
    incomeTitle: string = `Зі своєї картки *${SOURCE_CARD_SUFFIX}`,
    expenseAmount: number = TRANSFER_WITH_FEE_AMOUNT,
    incomeOperatedAt: Date = HINTED_FEE_OPERATED_AT,
    externalSource: ExternalSourceEnum | null = ExternalSourceEnum.PRIVATBANK
) => {
    const operatedAt = HINTED_FEE_OPERATED_AT;
    const transferMcc = testQueryService.findMccByCode('4829');
    const sourceAccount = seedPrivatbankAccount(SOURCE_CARD_SUFFIX, externalSource);
    const targetAccount = seedPrivatbankAccount(TARGET_CARD_SUFFIX, externalSource);
    const expense = testSeedService.bankPairExpense(
        { externalId: 'privatbank-card-transfer-expense', operatedAt },
        { accountId: sourceAccount.id, amount: expenseAmount, mccCategoryId: transferMcc.id }
    );
    const income = testSeedService.bankPairIncome(
        { externalId: 'privatbank-card-transfer-income', operatedAt: incomeOperatedAt },
        { accountId: targetAccount.id, amount: TRANSFER_AMOUNT, mccCategoryId: transferMcc.id }
    );

    testSeedService.updateTransaction(expense.id, { title: `На свою картку *${TARGET_CARD_SUFFIX}` });
    testSeedService.updateTransaction(income.id, { title: incomeTitle });

    return { expense, income, sourceAccount, targetAccount };
};

const expectNoConsolidation = (expenseTransactionId: number, incomeTransactionId: number): void => {
    expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER)).toHaveLength(0);
    expect(testQueryService.fetchTransactionById(expenseTransactionId).consolidationParentTransactionId).toBeNull();
    expect(testQueryService.fetchTransactionById(incomeTransactionId).consolidationParentTransactionId).toBeNull();
};

const expectSameBankHintedFeeConsolidation = (
    expenseTransactionId: number,
    incomeTransactionId: number,
    sourceAccountId: number,
    targetAccountId: number
): void => {
    const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER);

    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].fromAccountId).toBe(sourceAccountId);
    expect(canonicals[0].toAccountId).toBe(targetAccountId);
    expect(canonicals[0].exchangeRate).toBe(1);
    expect(
        [expenseTransactionId, incomeTransactionId].map(id => testQueryService.fetchTransactionById(id).consolidationParentTransactionId)
    ).toEqual([canonicals[0].id, canonicals[0].id]);
};

const expectPrivatbankFeeTransferConsolidated = async (
    externalSource: ExternalSourceEnum | null = ExternalSourceEnum.PRIVATBANK
): Promise<void> => {
    const { expense, income, sourceAccount, targetAccount } = seedPrivatbankFeeTransfer(
        `Зі своєї картки *${SOURCE_CARD_SUFFIX}`,
        TRANSFER_WITH_FEE_AMOUNT,
        HINTED_FEE_OPERATED_AT,
        externalSource
    );

    const result = await runConsolidation();
    expect(result.consolidated).toBe(1);
    expectSameBankHintedFeeConsolidation(expense.id, income.id, sourceAccount.id, targetAccount.id);
};

describe('consolidation/same-bank-hinted-fee-transfer', () => {
    it('auto-consolidates a same-bank own-card transfer when titles point at both account suffixes and the amount delta is fee-sized', async () => {
        await expectPrivatbankFeeTransferConsolidated();
    });

    it('auto-consolidates legacy same-bank own-card transfers when account source is missing but IBAN bank prefix matches', async () => {
        await expectPrivatbankFeeTransferConsolidated(null);
    });

    it('restores both hinted fee transfer sides and account balances when the canonical is reverted', async () => {
        const { expense, income, sourceAccount, targetAccount } = seedPrivatbankFeeTransfer();

        await expectRevertRestoresSources({
            accountIds: [sourceAccount.id, targetAccount.id],
            consolidationType: TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER,
            sourceTransactionIds: [expense.id, income.id]
        });
    });

    it('leaves a hinted transfer unconsolidated when the reciprocal account hint does not match', async () => {
        const { expense, income } = seedPrivatbankFeeTransfer('Зі своєї картки *9999');

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expectNoConsolidation(expense.id, income.id);
    });

    it('leaves a hinted transfer unconsolidated when the amount delta is larger than the fee window', async () => {
        const { expense, income } = seedPrivatbankFeeTransfer(`Зі своєї картки *${SOURCE_CARD_SUFFIX}`, TOO_LARGE_FEE_AMOUNT);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expectNoConsolidation(expense.id, income.id);
    });

    it('leaves a hinted transfer unconsolidated when the matching transactions are not close in time', async () => {
        const { expense, income } = seedPrivatbankFeeTransfer(
            `Зі своєї картки *${SOURCE_CARD_SUFFIX}`,
            TRANSFER_WITH_FEE_AMOUNT,
            new Date(HINTED_FEE_OPERATED_AT.getTime() + 3 * 60 * 1000)
        );

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expectNoConsolidation(expense.id, income.id);
    });
});
