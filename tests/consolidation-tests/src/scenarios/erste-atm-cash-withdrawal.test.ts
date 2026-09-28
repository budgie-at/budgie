import { AccountTypeEnum, ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { expectConsolidationParent, fetchLedgerEntry, fetchSingleCanonicalId } from '../harness/consolidation-revert-audit';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

import type { TransactionEntityInterface } from '@budgie/contracts';

const ERSTE_OPERATED_AT = new Date('2023-11-26T14:51:00');
const ATM_WITHDRAWAL_AMOUNT = 200 * PRECISION;

describe('consolidation/erste-atm-cash-withdrawal', () => {
    it('moves an Erste AUTOMAT withdrawal to the cash account and leaves cash back and deposits unpaired', async () => {
        const bankAccount = testSeedService.account({ title: 'Erste EUR', type: AccountTypeEnum.BANK_SYNC });
        const cashAccount = testSeedService.account({ title: 'Cash EUR', type: AccountTypeEnum.CASH });
        const seedErsteTransaction = (title: string, transaction: TransactionEntityInterface): TransactionEntityInterface =>
            testSeedService.updateTransaction(transaction.id, { title, externalSource: ExternalSourceEnum.ERSTE });
        const atmWithdrawal = seedErsteTransaction(
            'AUTOMAT 12210014 K1 26.11. 14:51',
            testSeedService.bankPairExpense(
                { externalId: 'erste-atm', operatedAt: ERSTE_OPERATED_AT },
                { accountId: bankAccount.id, amount: ATM_WITHDRAWAL_AMOUNT, mccCategoryId: testQueryService.findMccByCode('6011').id }
            )
        );
        const unpairedTransactions = [
            seedErsteTransaction(
                'POS 0,10 Cash 30,00',
                testSeedService.bankPairExpense(
                    { externalId: 'erste-cash-back', operatedAt: ERSTE_OPERATED_AT },
                    { accountId: bankAccount.id, amount: 30_100_000 }
                )
            ),
            seedErsteTransaction(
                'Bareinzahlung',
                testSeedService.bankPairIncome(
                    { externalId: 'erste-cash-deposit', operatedAt: ERSTE_OPERATED_AT },
                    { accountId: bankAccount.id, amount: 50_000_000 }
                )
            ),
            seedErsteTransaction(
                'SB-Münzeinz. K1 S05303 17.08/11:06',
                testSeedService.bankPairIncome(
                    { externalId: 'erste-coin-deposit', operatedAt: ERSTE_OPERATED_AT },
                    { accountId: bankAccount.id, amount: 97_330_000 }
                )
            )
        ];

        const result = await runConsolidation();
        const canonicalId = fetchSingleCanonicalId(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);

        expect(result.consolidated).toBe(1);
        expectConsolidationParent(atmWithdrawal.id, canonicalId);
        expect(fetchLedgerEntry(canonicalId, cashAccount.id).amount).toBe(ATM_WITHDRAWAL_AMOUNT);
        expect(
            unpairedTransactions.map(transaction => testQueryService.fetchTransactionById(transaction.id).consolidationParentTransactionId)
        ).toEqual([null, null, null]);
    });
});
