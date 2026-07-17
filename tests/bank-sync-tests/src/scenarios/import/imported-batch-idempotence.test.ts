import { transactionImportService } from '@app/transaction/service/transaction-import.service';
import { CategorySourceEnum, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchTransactionById, seed } from '../../harness';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

const buildImportInput = (
    accountId: number,
    externalId: string,
    title: string,
    operatedAt = new Date(2026, 0, 15, 12, 0, 0)
): TransactionCreateInputInterface => ({
    amount: 10,
    title,
    comment: '',
    type: TransactionTypeEnum.EXPENSE,
    exchangeRate: 1,
    operatedAt,
    externalId,
    externalSource: ExternalSourceEnum.ERSTE,
    updatedBy: null,
    fromAccountId: accountId,
    toAccountId: null,
    tagIds: [],
    entries: [
        {
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: 10_000_000,
            categoryId: null,
            categorySource: CategorySourceEnum.USER,
            mccCategoryId: null,
            externalId,
            exchangeRate: 1,
            toIban: null
        }
    ]
});

describe('import/imported-batch-idempotence', () => {
    it('collapses exact duplicate external IDs inside one import batch', async () => {
        const account = seed.account({ externalSource: ExternalSourceEnum.ERSTE });
        const input = buildImportInput(account.id, 'erste-duplicate-id', 'ERSTE exact duplicate');

        const importedTransactions = await transactionImportService.bulkUpsertImported([input, input], new Map());

        expect(importedTransactions).toHaveLength(1);
        expect(importedTransactions[0].externalId).toBe('erste-duplicate-id');
    });

    it('keeps same-ID collisions by assigning deterministic suffixed external IDs', async () => {
        const account = seed.account({ externalSource: ExternalSourceEnum.ERSTE });
        const firstInput = buildImportInput(account.id, 'erste-collision-id', 'FITINN MDID:MREF11065472');
        const secondInput = buildImportInput(account.id, 'erste-collision-id', 'FITINN MDID:MREF11123384');

        const importedTransactions = await transactionImportService.bulkUpsertImported([firstInput, secondInput], new Map());
        const firstTransaction = fetchTransactionById(importedTransactions[0].id);
        const secondTransaction = fetchTransactionById(importedTransactions[1].id);
        const existingTransactionIdMap = new Map([
            ['erste-collision-id', firstTransaction.id],
            ['erste-collision-id:2', secondTransaction.id]
        ]);
        const reimportedTransactions = await transactionImportService.bulkUpsertImported(
            [firstInput, secondInput],
            existingTransactionIdMap
        );

        expect(importedTransactions).toHaveLength(2);
        expect(firstTransaction.externalId).toBe('erste-collision-id');
        expect(secondTransaction.externalId).toBe('erste-collision-id:2');
        expect(reimportedTransactions.map(transaction => transaction.id)).toEqual([firstTransaction.id, secondTransaction.id]);
    });

    it('maps legacy aliases after assigning deterministic collision suffixes', async () => {
        const account = seed.account({ externalSource: ExternalSourceEnum.ERSTE });
        const legacyFirstInput = buildImportInput(account.id, 'erste-legacy-id-1', 'FITINN MDID:MREF11065472');
        const legacySecondInput = buildImportInput(account.id, 'erste-legacy-id-2', 'FITINN MDID:MREF11123384');
        const [legacyFirstTransaction, legacySecondTransaction] = await transactionImportService.bulkUpsertImported(
            [legacyFirstInput, legacySecondInput],
            new Map()
        );
        const existingTransactionIdMap = new Map([
            ['erste-legacy-id-1', legacyFirstTransaction.id],
            ['erste-legacy-id-2', legacySecondTransaction.id]
        ]);
        const firstInput = {
            ...buildImportInput(account.id, 'erste-collision-alias-id', 'FITINN MDID:MREF11065472'),
            externalIdAliases: ['erste-legacy-id-1']
        };
        const secondInput = {
            ...buildImportInput(account.id, 'erste-collision-alias-id', 'FITINN MDID:MREF11123384'),
            externalIdAliases: ['erste-legacy-id-2']
        };

        const importedTransactions = await transactionImportService.bulkUpsertImported([firstInput, secondInput], existingTransactionIdMap);
        const firstTransaction = fetchTransactionById(importedTransactions[0].id);
        const secondTransaction = fetchTransactionById(importedTransactions[1].id);

        expect(importedTransactions.map(transaction => transaction.id)).toEqual([legacyFirstTransaction.id, legacySecondTransaction.id]);
        expect(firstTransaction.externalId).toBe('erste-collision-alias-id');
        expect(secondTransaction.externalId).toBe('erste-collision-alias-id:2');
    });
});
