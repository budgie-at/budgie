import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { privatbankTransactionMapper } from '@budgie/bank-sync';
import { ExternalSourceEnum, TransactionConsolidationTypeEnum, TransactionEntityTable } from '@budgie/contracts';

import {
    buildMonobank,
    fetchCanonicalsOfType,
    fetchTransactionById,
    setupMonobankFixture,
    seed,
    monobankStub,
    testDb
} from '../../harness';

import { transactionImportService } from '@app/transaction/service/transaction-import.service';
import { mapBankTransactionToCreateInput } from '@app/sync/util/map-bank-transaction-to-create-input.util';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { privatbankCategoryMatcherMatch } from '@app/sync/service/privatbank-category-matcher.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

const TRANSFER_AMOUNT = 250;
const MONOBANK_API_AMOUNT = TRANSFER_AMOUNT * 100;
const TRANSFER_MCC_CODE = '4829';
const PRIVATBANK_TRANSFER_CATEGORY = 'Зарахування переказу';
const SLOW_WINDOW_OFFSET_MS = 30 * 60 * 1000;

describe('consolidation/monobank-privatbank-transfer', () => {
    it('auto-consolidates a Monobank outgoing transfer with an imported Privatbank incoming transfer', async () => {
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
        const monobankAccountId = 'mono-card';
        const privatbankCardId = 'privat-card';
        setupMonobankFixture(monobankAccountId);
        const privatbankAccount = seed.account({
            title: 'Privatbank Card',
            externalId: privatbankCardId,
            externalSource: ExternalSourceEnum.PRIVATBANK
        });

        monobankStub.statement([
            buildMonobank.transaction({
                id: 'mono-transfer-out',
                amount: -MONOBANK_API_AMOUNT,
                operationAmount: -MONOBANK_API_AMOUNT,
                hold: false,
                time: Math.floor(operatedAt.getTime() / 1000),
                description: 'Transfer to Privatbank',
                mcc: Number(TRANSFER_MCC_CODE),
                originalMcc: Number(TRANSFER_MCC_CODE)
            })
        ]);
        await monobankSyncService.sync();

        const categoryMap = await privatbankCategoryMatcherMatch([PRIVATBANK_TRANSFER_CATEGORY]);
        const privatbankTransaction = privatbankTransactionMapper({
            rawDate: '20.05.2026 15:00:00',
            date: new Date(operatedAt.getTime() + SLOW_WINDOW_OFFSET_MS),
            category: PRIVATBANK_TRANSFER_CATEGORY,
            card: privatbankCardId,
            description: 'Transfer from Monobank',
            cardAmount: TRANSFER_AMOUNT,
            cardCurrency: 'UAH',
            operationAmount: TRANSFER_AMOUNT,
            operationCurrency: 'UAH',
            endBalance: TRANSFER_AMOUNT,
            balanceCurrency: 'UAH'
        });
        const privatbankMccCategoryId = categoryMap.get(PRIVATBANK_TRANSFER_CATEGORY) ?? null;
        const privatbankInput = mapBankTransactionToCreateInput(
            privatbankTransaction,
            privatbankAccount.id,
            privatbankMccCategoryId,
            ExternalSourceEnum.PRIVATBANK
        );
        const importedPrivatbankTransactions = await transactionImportService.bulkUpsertImported([privatbankInput], new Map());
        expect(importedPrivatbankTransactions).toHaveLength(1);

        const previewResult = await transferConsolidationService.preview();
        expect(previewResult.autoCandidateCount).toBe(1);
        expect(previewResult.manualReviewCandidateCount).toBe(0);

        const consolidateResult = await transferConsolidationService.consolidate();
        expect(consolidateResult.consolidated).toBe(1);

        const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);
        const canonicalIds = canonicals.map(canonical => canonical.id);

        const monobankParentTransactionIds = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalId, 'mono-transfer-out'))
            .all()
            .map(transaction => fetchTransactionById(transaction.id).consolidationParentTransactionId);
        const privatbankParentTransactionIds = importedPrivatbankTransactions.map(
            transaction => fetchTransactionById(transaction.id).consolidationParentTransactionId
        );

        expect(monobankParentTransactionIds).toEqual(canonicalIds);
        expect(privatbankParentTransactionIds).toEqual(canonicalIds);
    });
});
