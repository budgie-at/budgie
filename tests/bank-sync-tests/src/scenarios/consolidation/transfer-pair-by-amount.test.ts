import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, seedAccountPair, seedAmountTransferPair, seedBankPair } from '../../harness';

import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

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

        const fromBalance = accountBalanceRepository.getByAccountId(fromAccount.id).get();
        const toBalance = accountBalanceRepository.getByAccountId(toAccount.id).get();

        expect(fromBalance?.balance).toBe(-250 * PRECISION);
        expect(toBalance?.balance).toBe(250 * PRECISION);
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
