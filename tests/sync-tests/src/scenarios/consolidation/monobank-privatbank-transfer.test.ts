import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { privatbankCategoryMatcherService } from '@app/sync/service/privatbank-category-matcher.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { mapBankTransactionToCreateInput } from '@app/sync/util/map-bank-transaction-to-create-input.util';
import { transactionImportService } from '@app/transaction/service/transaction-import.service';
import { ExternalSourceEnum, TransactionConsolidationTypeEnum, TransactionEntityTable } from '@budgie/contracts';
import { privatbankTransactionMapper } from '@budgie/sync';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import {
    buildMonobank,
    fetchCanonicalsOfType,
    fetchTransactionById,
    monobankStub,
    seed,
    setupMonobankFixture,
    testDb
} from '../../harness';

const TRANSFER_AMOUNT = 250;
const MONOBANK_API_AMOUNT = TRANSFER_AMOUNT * 100;
const TRANSFER_MCC_CODE = '4829';
const PRIVATBANK_TRANSFER_CATEGORY = 'Зарахування переказу';
const SLOW_WINDOW_OFFSET_MS = 30 * 60 * 1000;
const OPERATED_AT = new Date('2026-01-15T12:00:00.000Z');

const setupMonobankTransfer = async (monobankAccountId: string): Promise<void> => {
    setupMonobankFixture(monobankAccountId);
    monobankStub.statement([
        buildMonobank.transaction({
            id: 'mono-transfer-out',
            amount: -MONOBANK_API_AMOUNT,
            operationAmount: -MONOBANK_API_AMOUNT,
            hold: false,
            time: Math.floor(OPERATED_AT.getTime() / 1000),
            description: 'Transfer to Privatbank',
            mcc: Number(TRANSFER_MCC_CODE),
            originalMcc: Number(TRANSFER_MCC_CODE)
        })
    ]);
    await monobankSyncService.sync();
};

const importPrivatbankTransfer = async (privatbankAccountId: number, privatbankCardId: string) => {
    const categoryMap = await privatbankCategoryMatcherService.match([PRIVATBANK_TRANSFER_CATEGORY]);
    const privatbankTransaction = privatbankTransactionMapper({
        rawDate: '20.05.2026 15:00:00',
        date: new Date(OPERATED_AT.getTime() + SLOW_WINDOW_OFFSET_MS),
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
    const privatbankInput = mapBankTransactionToCreateInput(privatbankTransaction, privatbankAccountId, privatbankMccCategoryId);

    return transactionImportService.bulkUpsertImported([privatbankInput], new Map());
};

const expectTransferPairParents = (privatbankTransactionIds: number[]): void => {
    const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
    expect(canonicals).toHaveLength(1);
    const canonicalIds = canonicals.map(canonical => canonical.id);
    const monobankParentTransactionIds = testDb
        .select()
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalId, 'mono-transfer-out'))
        .all()
        .map(transaction => fetchTransactionById(transaction.id).consolidationParentTransactionId);
    const privatbankParentTransactionIds = privatbankTransactionIds.map(
        transactionId => fetchTransactionById(transactionId).consolidationParentTransactionId
    );

    expect(monobankParentTransactionIds).toEqual(canonicalIds);
    expect(privatbankParentTransactionIds).toEqual(canonicalIds);
};

describe('consolidation/monobank-privatbank-transfer', () => {
    it('auto-consolidates a Monobank outgoing transfer with an imported Privatbank incoming transfer', async () => {
        const monobankAccountId = 'mono-card';
        const privatbankCardId = 'privat-card';
        const privatbankAccount = seed.account({
            title: 'Privatbank Card',
            externalId: privatbankCardId,
            externalSource: ExternalSourceEnum.PRIVATBANK
        });

        await setupMonobankTransfer(monobankAccountId);
        const importedPrivatbankTransactions = await importPrivatbankTransfer(privatbankAccount.id, privatbankCardId);
        expect(importedPrivatbankTransactions).toHaveLength(1);

        const previewResult = await transferConsolidationService.preview();
        expect(previewResult.autoCandidateCount).toBe(1);
        expect(previewResult.manualReviewCandidateCount).toBe(0);

        const consolidateResult = await transferConsolidationService.consolidate();
        expect(consolidateResult.consolidated).toBe(1);

        expectTransferPairParents(importedPrivatbankTransactions.map(transaction => transaction.id));
    });
});
