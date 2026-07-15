import {
    ExternalSourceEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

const EXPENSE_AMOUNT = 30_317.41 * PRECISION;
const INCOME_AMOUNT = 29_999 * PRECISION;
const COMPETING_INCOME_AMOUNT = 29_998 * PRECISION;

const seedAccount = (title: string, externalSource: ExternalSourceEnum | null, iban: string) =>
    testSeedService.bankSyncAccount(title, externalSource, iban);

const seedInterbankFeeTransfer = (
    sourceAccountExternalSource: ExternalSourceEnum | null = ExternalSourceEnum.MONOBANK,
    targetAccountExternalSource: ExternalSourceEnum | null = ExternalSourceEnum.PRIVATBANK
) => {
    const operatedAt = new Date(2026, 4, 20, 18, 39, 0);
    const transferMcc = testQueryService.findMccByCode('4829');
    const sourceAccount = seedAccount('Monobank Black •3126', sourceAccountExternalSource, 'UA-MONOBANK-3126');
    const targetAccount = seedAccount('Privatbank •0356', targetAccountExternalSource, 'UA-PRIVATBANK-0356');
    const expense = testSeedService.bankPairExpense(
        { externalId: 'interbank-fee-expense', operatedAt },
        {
            accountId: sourceAccount.id,
            amount: EXPENSE_AMOUNT,
            mccCategoryId: transferMcc.id
        }
    );
    const income = testSeedService.bankPairIncome(
        { externalId: 'interbank-fee-income', operatedAt: new Date(operatedAt.getTime() + 61 * 60 * 1000) },
        {
            accountId: targetAccount.id,
            amount: INCOME_AMOUNT,
            mccCategoryId: transferMcc.id
        }
    );

    testSeedService.updateTransaction(expense.id, { title: 'приват сина 3', externalSource: ExternalSourceEnum.MONOBANK });
    testSeedService.updateTransaction(income.id, { title: 'від IHOR YEHOROV', externalSource: ExternalSourceEnum.PRIVATBANK });

    return { expense, income, sourceAccount, targetAccount, transferMcc };
};

const expectTransferPairConsolidated = (
    expenseTransactionId: number,
    incomeTransactionId: number,
    sourceAccountId: number,
    targetAccountId: number
): void => {
    const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

    expect(canonicals).toHaveLength(1);
    expect(canonicals).toMatchObject([
        {
            exchangeRate: 1,
            fromAccountId: sourceAccountId,
            toAccountId: targetAccountId,
            type: TransactionTypeEnum.TRANSFER
        }
    ]);

    const entries = testQueryService.fetchEntriesByTransactionId(canonicals[0].id);
    const sourceEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
    const targetEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

    expect(sourceEntry?.amount).toBe(EXPENSE_AMOUNT);
    expect(targetEntry?.amount).toBe(INCOME_AMOUNT);
    expect(testQueryService.fetchTransactionById(expenseTransactionId).consolidationParentTransactionId).toBe(canonicals[0].id);
    expect(testQueryService.fetchTransactionById(incomeTransactionId).consolidationParentTransactionId).toBe(canonicals[0].id);
};

const expectSeededInterbankFeeTransferConsolidates = async (
    sourceAccountExternalSource: ExternalSourceEnum | null,
    targetAccountExternalSource: ExternalSourceEnum | null
): Promise<void> => {
    const { expense, income, sourceAccount, targetAccount } = seedInterbankFeeTransfer(
        sourceAccountExternalSource,
        targetAccountExternalSource
    );

    const result = await runConsolidation();
    expect(result.consolidated).toBe(1);
    expectTransferPairConsolidated(expense.id, income.id, sourceAccount.id, targetAccount.id);
};

describe('consolidation/interbank-hinted-fee-transfer', () => {
    it('auto-consolidates a first interbank transfer when transfer MCC, time, and fee delta make the pair unambiguous', async () => {
        await expectSeededInterbankFeeTransferConsolidates(ExternalSourceEnum.MONOBANK, ExternalSourceEnum.PRIVATBANK);
    });

    it('uses transaction bank sources when imported accounts do not carry bank sources', async () => {
        await expectSeededInterbankFeeTransferConsolidates(null, null);
    });

    it('leaves an interbank transfer unconsolidated when another fee-sized income competes for the same expense', async () => {
        const { expense, income, sourceAccount, transferMcc } = seedInterbankFeeTransfer();
        const competingAccount = seedAccount('Privatbank •5524', ExternalSourceEnum.PRIVATBANK, 'UA-PRIVATBANK-5524');
        const competingIncome = testSeedService.bankPairIncome(
            { externalId: 'interbank-fee-competing-income', operatedAt: new Date(2026, 4, 20, 19, 40, 0) },
            {
                accountId: competingAccount.id,
                amount: COMPETING_INCOME_AMOUNT,
                mccCategoryId: transferMcc.id
            }
        );

        testSeedService.updateTransaction(competingIncome.id, {
            title: 'від IHOR YEHOROV',
            externalSource: ExternalSourceEnum.PRIVATBANK
        });

        const result = await runConsolidation();

        expect(result.found).toBe(0);
        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(income.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(competingIncome.id).consolidationParentTransactionId).toBeNull();
        expect(sourceAccount.id).toBe(expense.fromAccountId);
    });
});
