import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import {
    fetchCanonicalsOfType,
    fetchTransactionById,
    findMccByCode,
    seedAccountPair,
    seedAmountTransferPair,
    seedBankPair
} from '../../harness';

import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

const SLOW_WINDOW_OFFSET_MS = 30 * 60 * 1000;

describe('consolidation/transfer-pair-by-amount', () => {
    it('falls back to amount + transfer-MCC matching when neither side has an IBAN', async () => {
        const { expense, income } = seedAmountTransferPair(250 * PRECISION);

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(1);

        const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);

        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonicals[0].id);
    });

    it('keeps moved source entries out of account balance calculations', async () => {
        const { fromAccount, toAccount } = seedAmountTransferPair(250 * PRECISION);

        await transferConsolidationService.consolidate();

        const fromBalance = await accountBalanceRepository.getByAccountId(fromAccount.id).get();
        const toBalance = await accountBalanceRepository.getByAccountId(toAccount.id).get();

        expect(fromBalance?.balance).toBe(-250 * PRECISION);
        expect(toBalance?.balance).toBe(250 * PRECISION);
    });

    it('auto-consolidates amount + transfer-MCC matches outside the fast window', async () => {
        const { fromAccount, toAccount } = seedAccountPair();
        const transferMcc = findMccByCode('4829');
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
        const slowOperatedAt = new Date(operatedAt.getTime() + SLOW_WINDOW_OFFSET_MS);

        seedBankPair.expense(
            { externalId: 'tx-expense', operatedAt },
            { accountId: fromAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
        );
        seedBankPair.income(
            { externalId: 'tx-income', operatedAt: slowOperatedAt },
            { accountId: toAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
        );

        const previewResult = await transferConsolidationService.preview();
        expect(previewResult.autoCandidateCount).toBe(1);
        expect(previewResult.manualReviewCandidateCount).toBe(0);

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(1);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });

    it('does NOT consolidate when amounts match but neither IBAN nor transfer-MCC is present', async () => {
        const { fromAccount, toAccount } = seedAccountPair();
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
        seedBankPair.expense({ externalId: 'tx-expense', operatedAt }, { accountId: fromAccount.id, amount: 250 * PRECISION });
        seedBankPair.income({ externalId: 'tx-income', operatedAt }, { accountId: toAccount.id, amount: 250 * PRECISION });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
    });
});
