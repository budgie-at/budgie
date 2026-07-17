import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { accountBalanceRepository, accountRepository, testQueryService, testSeedService } from '../harness/test-context';

const SLOW_WINDOW_OFFSET_MS = 30 * 60 * 1000;

describe('consolidation/transfer-pair-by-amount', () => {
    it('consolidates amount and transfer-MCC matches through consolidation services', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        const { expense, income } = testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        const result = await runConsolidation();
        expect(result.found).toBe(1);
        expect(result.consolidated).toBe(1);

        const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(testQueryService.fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonicals[0].id);
    });

    it('keeps moved source entries out of account balance calculations', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        const { fromAccount, toAccount } = testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        await runConsolidation();

        const fromBalance = accountBalanceRepository.getByAccountId(fromAccount.id).get();
        const toBalance = accountBalanceRepository.getByAccountId(toAccount.id).get();

        expect(fromBalance?.balance).toBe(-250 * PRECISION);
        expect(toBalance?.balance).toBe(250 * PRECISION);
    });

    it('auto-consolidates amount and transfer-MCC matches outside the fast window', async () => {
        const { fromAccount, toAccount } = testSeedService.accountPair();
        const transferMcc = testQueryService.findMccByCode('4829');
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
        const slowOperatedAt = new Date(operatedAt.getTime() + SLOW_WINDOW_OFFSET_MS);

        testSeedService.bankPairExpense(
            { externalId: 'slow-expense', operatedAt },
            { accountId: fromAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
        );
        testSeedService.bankPairIncome(
            { externalId: 'slow-income', operatedAt: slowOperatedAt },
            { accountId: toAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
        );

        const result = await runConsolidation();
        expect(result.found).toBe(1);
        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });

    it('leaves matching amounts unconsolidated without IBAN or transfer MCC evidence', async () => {
        const { fromAccount, toAccount } = testSeedService.accountPair();
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);

        testSeedService.bankPairExpense(
            { externalId: 'missing-evidence-expense', operatedAt },
            { accountId: fromAccount.id, amount: 250 * PRECISION }
        );
        testSeedService.bankPairIncome(
            { externalId: 'missing-evidence-income', operatedAt },
            { accountId: toAccount.id, amount: 250 * PRECISION }
        );

        const result = await runConsolidation();
        expect(result.consolidated).toBe(0);
    });

    it('leaves amount transfers from inactive source accounts unconsolidated', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        const { fromAccount } = testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        await accountRepository.updateById(fromAccount.id, { isActive: false });

        const result = await runConsolidation();
        expect(result.consolidated).toBe(0);
    });

    it('leaves amount transfers to inactive target accounts unconsolidated', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        const { toAccount } = testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        await accountRepository.updateById(toAccount.id, { isActive: false });

        const result = await runConsolidation();
        expect(result.consolidated).toBe(0);
    });
});
