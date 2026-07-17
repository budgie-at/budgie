import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { PRIVATBANK_DUPLICATE_CANDIDATE_SQL } from '@app/sync/constant/privatbank-duplicate-candidate-sql.constant';
import { bankSyncRepairService } from '@app/sync/service/bank-sync-repair.service';
import {
    ExternalSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { sql } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { seed, testDb } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import type { BankSyncDuplicateCandidateRowInterface } from '@app/sync/interface/bank-sync-duplicate-candidate-row.interface';
import type {
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface
} from '@budgie/contracts';

const PRIVATBANK_DUPLICATE_TITLE = "Зарплата, СУПЕРМАШ. Коментар: Zarobitna plata-Za kviten' 2026";
const PRIVATBANK_DUPLICATE_AMOUNT = 1_780_860_000;
const PRIVATBANK_DUPLICATE_OPERATED_AT = new Date('2026-05-07T08:46:37.000Z');

const fetchPrivatbankDuplicateCandidates = async (): Promise<BankSyncDuplicateCandidateRowInterface[]> =>
    testDb.all<BankSyncDuplicateCandidateRowInterface>(sql.raw(PRIVATBANK_DUPLICATE_CANDIDATE_SQL));

const expectTransferPairDuplicate = async (
    keptTransaction: TransactionEntityInterface,
    duplicateTransaction: TransactionEntityInterface
): Promise<void> => {
    const candidates = await fetchPrivatbankDuplicateCandidates();

    expect(candidates).toEqual([
        expect.objectContaining({
            duplicateTransactionId: duplicateTransaction.id,
            keptTransactionId: keptTransaction.id,
            reason: 'transfer_pair_duplicate'
        })
    ]);
};

const seedPrivatbankIncome = ({
    accountId,
    externalId,
    consolidationParentTransactionId
}: {
    readonly accountId: number;
    readonly externalId: string;
    readonly consolidationParentTransactionId?: number | null;
}): TransactionEntityInterface => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.INCOME,
        title: PRIVATBANK_DUPLICATE_TITLE,
        externalId,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        operatedAt: PRIVATBANK_DUPLICATE_OPERATED_AT,
        exchangeRate: 1,
        fromAccountId: null,
        toAccountId: accountId,
        comment: '',
        updatedBy: null,
        consolidationParentTransactionId: consolidationParentTransactionId ?? null,
        consolidationType: null
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.DEBIT,
        amount: PRIVATBANK_DUPLICATE_AMOUNT,
        externalId,
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction;
};

const seedCanonicalTransfer = (accountId: number): TransactionEntityInterface =>
    insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.TRANSFER,
        title: 'Canonical transfer',
        externalId: null,
        externalSource: null,
        operatedAt: PRIVATBANK_DUPLICATE_OPERATED_AT,
        exchangeRate: 1,
        fromAccountId: accountId,
        toAccountId: accountId,
        comment: '',
        updatedBy: null,
        consolidationParentTransactionId: null,
        consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR
    } satisfies TransactionCreateEntityInterface);

const seedMovedEntry = (canonicalTransactionId: number, sourceTransactionId: number, accountId: number, externalId: string): void => {
    insertOne(TransactionEntryEntityTable, {
        transactionId: canonicalTransactionId,
        accountId,
        type: TransactionEntryTypeEnum.DEBIT,
        amount: PRIVATBANK_DUPLICATE_AMOUNT,
        externalId,
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId: null,
        originalTransactionId: sourceTransactionId
    } satisfies TransactionEntryCreateEntityInterface);
};

const seedPrivatbankDebtPayment = (accountId: number, debtAccountId: number): TransactionEntityInterface => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.DEBT,
        title: 'Єгоров І.',
        externalId: 'privatbank-debt-kept',
        externalSource: ExternalSourceEnum.PRIVATBANK,
        operatedAt: new Date('2026-05-06T12:52:02.000Z'),
        exchangeRate: 1,
        fromAccountId: accountId,
        toAccountId: debtAccountId,
        comment: '',
        updatedBy: null,
        consolidationParentTransactionId: null,
        consolidationType: null
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: 28_000_000_000,
        externalId: 'privatbank-debt-kept',
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: debtAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        amount: 660_533_145,
        externalId: null,
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction;
};

const seedPrivatbankExpense = (accountId: number, mccCategoryId: number | null = null): TransactionEntityInterface => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Єгоров І.',
        externalId: 'privatbank-debt-duplicate',
        externalSource: ExternalSourceEnum.PRIVATBANK,
        operatedAt: new Date('2026-05-06T12:52:02.000Z'),
        exchangeRate: 1,
        fromAccountId: accountId,
        toAccountId: null,
        comment: '',
        updatedBy: null,
        consolidationParentTransactionId: null,
        consolidationType: null
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: 28_000_000_000,
        externalId: 'privatbank-debt-duplicate',
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction;
};

const seedPrivatbankTransferWithMatchingExpenseLeg = (accountId: number, targetAccountId: number): TransactionEntityInterface => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.TRANSFER,
        title: 'Єгоров І.',
        externalId: 'privatbank-transfer-same-leg',
        externalSource: ExternalSourceEnum.PRIVATBANK,
        operatedAt: new Date('2026-05-06T12:52:02.000Z'),
        exchangeRate: 1,
        fromAccountId: accountId,
        toAccountId: targetAccountId,
        comment: '',
        updatedBy: null,
        consolidationParentTransactionId: null,
        consolidationType: null
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: 28_000_000_000,
        externalId: 'privatbank-transfer-same-leg-credit',
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: targetAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        amount: 28_000_000_000,
        externalId: 'privatbank-transfer-same-leg-debit',
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction;
};

const seedPrivatbankTransferSource = ({
    accountId,
    amount,
    canonicalTransactionId,
    entryType,
    externalId,
    operatedAt,
    title,
    type
}: {
    readonly accountId: number;
    readonly amount: number;
    readonly canonicalTransactionId: number;
    readonly entryType: TransactionEntryTypeEnum;
    readonly externalId: string;
    readonly operatedAt: Date;
    readonly title: string;
    readonly type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
}): TransactionEntityInterface => {
    const transaction = insertOne(TransactionEntityTable, {
        type,
        title,
        externalId,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        operatedAt,
        exchangeRate: 1,
        fromAccountId: entryType === TransactionEntryTypeEnum.CREDIT ? accountId : null,
        toAccountId: entryType === TransactionEntryTypeEnum.DEBIT ? accountId : null,
        comment: '',
        updatedBy: null,
        consolidationParentTransactionId: canonicalTransactionId,
        consolidationType: null
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: canonicalTransactionId,
        accountId,
        type: entryType,
        amount,
        externalId,
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId: null,
        originalTransactionId: transaction.id
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction;
};

const seedPrivatbankCanonicalTransferPair = ({
    amount,
    consolidationType = TransactionConsolidationTypeEnum.TRANSFER_PAIR,
    creditAmount = amount,
    debitAmount = amount,
    fromAccountId,
    operatedAt,
    sourceExternalIdPrefix,
    title,
    toAccountId
}: {
    readonly amount: number;
    readonly consolidationType?: TransactionConsolidationTypeEnum;
    readonly creditAmount?: number;
    readonly debitAmount?: number;
    readonly fromAccountId: number;
    readonly operatedAt: Date;
    readonly sourceExternalIdPrefix: string;
    readonly title: string;
    readonly toAccountId: number;
}): TransactionEntityInterface => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.TRANSFER,
        title,
        externalId: null,
        externalSource: null,
        operatedAt,
        exchangeRate: 1,
        fromAccountId,
        toAccountId,
        comment: '',
        updatedBy: null,
        consolidationParentTransactionId: null,
        consolidationType
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: fromAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: creditAmount,
        externalId: null,
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: toAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        amount: debitAmount,
        externalId: null,
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    seedPrivatbankTransferSource({
        accountId: fromAccountId,
        amount: creditAmount,
        canonicalTransactionId: transaction.id,
        entryType: TransactionEntryTypeEnum.CREDIT,
        externalId: `${sourceExternalIdPrefix}-expense`,
        operatedAt,
        title,
        type: TransactionTypeEnum.EXPENSE
    });

    seedPrivatbankTransferSource({
        accountId: toAccountId,
        amount: debitAmount,
        canonicalTransactionId: transaction.id,
        entryType: TransactionEntryTypeEnum.DEBIT,
        externalId: `${sourceExternalIdPrefix}-income`,
        operatedAt,
        title,
        type: TransactionTypeEnum.INCOME
    });

    return transaction;
};

describe('privatbank/duplicate-repair', () => {
    it('detects visible duplicates imported with the exact same operated timestamp', async () => {
        const account = seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
        const keptTransaction = seedPrivatbankIncome({ accountId: account.id, externalId: 'privatbank-income-kept' });
        const duplicateTransaction = seedPrivatbankIncome({ accountId: account.id, externalId: 'privatbank-income-duplicate' });

        const candidates = await fetchPrivatbankDuplicateCandidates();

        expect(candidates).toEqual([
            expect.objectContaining({
                duplicateTransactionId: duplicateTransaction.id,
                keptTransactionId: keptTransaction.id,
                reason: 'visible_duplicate'
            })
        ]);
    });

    it('detects exact duplicates when the kept source transaction has already been consolidated', async () => {
        const account = seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
        const canonicalTransaction = seedCanonicalTransfer(account.id);
        const keptTransaction = seedPrivatbankIncome({
            accountId: account.id,
            externalId: 'privatbank-consolidated-kept',
            consolidationParentTransactionId: canonicalTransaction.id
        });
        const duplicateTransaction = seedPrivatbankIncome({ accountId: account.id, externalId: 'privatbank-consolidated-duplicate' });

        seedMovedEntry(canonicalTransaction.id, keptTransaction.id, account.id, 'privatbank-consolidated-kept');

        const candidates = await fetchPrivatbankDuplicateCandidates();

        expect(candidates).toEqual([
            expect.objectContaining({
                duplicateTransactionId: duplicateTransaction.id,
                keptTransactionId: keptTransaction.id,
                reason: 'hidden_source_duplicate'
            })
        ]);
    });

    it('rebuilds balances after duplicate soft deletes leave the write transaction', async () => {
        const account = seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });

        seedPrivatbankIncome({ accountId: account.id, externalId: 'privatbank-income-kept' });
        seedPrivatbankIncome({ accountId: account.id, externalId: 'privatbank-income-duplicate' });

        const updateAllBalancesSpy = vi.spyOn(accountBalanceIncrementalService, 'updateAllBalances').mockResolvedValue(undefined);

        try {
            const result = await bankSyncRepairService.removeDuplicates();

            expect(result.repairedTransactionCount).toBe(1);
            expect(updateAllBalancesSpy).toHaveBeenCalledTimes(1);
            expect(updateAllBalancesSpy).toHaveBeenCalledWith(true);
        } finally {
            updateAllBalancesSpy.mockRestore();
        }
    });

    it('detects a duplicate when the kept transaction was converted to a debt payment', async () => {
        const account = seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
        const debtAccount = seed.account({ title: 'Віладжіо' });
        const expenseMccCategory = seed.mccCategory({ mcc: '0779' });
        const keptTransaction = seedPrivatbankDebtPayment(account.id, debtAccount.id);
        const duplicateTransaction = seedPrivatbankExpense(account.id, expenseMccCategory.id);

        const candidates = await fetchPrivatbankDuplicateCandidates();

        expect(candidates).toEqual([
            expect.objectContaining({
                duplicateTransactionId: duplicateTransaction.id,
                keptTransactionId: keptTransaction.id,
                reason: 'visible_duplicate'
            })
        ]);
    });

    it('ignores cross-type rows outside the debt-payment conversion case', async () => {
        const account = seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
        const targetAccount = seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-0356' });

        seedPrivatbankExpense(account.id);
        seedPrivatbankTransferWithMatchingExpenseLeg(account.id, targetAccount.id);

        const candidates = await fetchPrivatbankDuplicateCandidates();

        expect(candidates).toEqual([]);
    });

    it('detects duplicate PrivatBank transfer-pair canonicals with a one-hour shifted timestamp', async () => {
        const fromAccount = seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
        const toAccount = seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-0356' });
        const keptTransaction = seedPrivatbankCanonicalTransferPair({
            amount: 10_000_000_000,
            fromAccountId: fromAccount.id,
            operatedAt: new Date('2026-01-24T10:44:38.000Z'),
            sourceExternalIdPrefix: 'privatbank-transfer-kept',
            title: 'На свою картку *0356',
            toAccountId: toAccount.id
        });
        const duplicateTransaction = seedPrivatbankCanonicalTransferPair({
            amount: 10_000_000_000,
            fromAccountId: fromAccount.id,
            operatedAt: new Date('2026-01-24T11:44:38.000Z'),
            sourceExternalIdPrefix: 'privatbank-transfer-duplicate',
            title: 'На свою картку *0356',
            toAccountId: toAccount.id
        });

        await expectTransferPairDuplicate(keptTransaction, duplicateTransaction);
    });

    it('detects duplicate PrivatBank same-bank fee transfer canonicals', async () => {
        const fromAccount = seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-0356' });
        const toAccount = seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-5524' });
        const keptTransaction = seedPrivatbankCanonicalTransferPair({
            amount: 10_000_000_000,
            consolidationType: TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER,
            creditAmount: 10_300_000_000,
            fromAccountId: fromAccount.id,
            operatedAt: new Date('2026-05-14T09:30:38.000Z'),
            sourceExternalIdPrefix: 'privatbank-fee-transfer-kept',
            title: 'На свою картку *5524',
            toAccountId: toAccount.id
        });
        const duplicateTransaction = seedPrivatbankCanonicalTransferPair({
            amount: 10_000_000_000,
            consolidationType: TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER,
            creditAmount: 10_300_000_000,
            fromAccountId: fromAccount.id,
            operatedAt: new Date('2026-05-14T09:30:38.000Z'),
            sourceExternalIdPrefix: 'privatbank-fee-transfer-duplicate',
            title: 'На свою картку *5524',
            toAccountId: toAccount.id
        });

        await expectTransferPairDuplicate(keptTransaction, duplicateTransaction);
    });
});
