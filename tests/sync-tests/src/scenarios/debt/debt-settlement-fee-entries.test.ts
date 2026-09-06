import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { transactionDebtSettlementService } from '@app/transaction/service/transaction-debt-settlement.service';
import { transactionService } from '@app/transaction/service/transaction.service';
import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    DEBT_PAYMENT_CATEGORY_ID,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { and, eq, isNull } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type {
    DebtEventEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryEntityInterface,
    TransactionUpdateServiceInputInterface
} from '@budgie/contracts';

const PRIMARY_ENTRY_AMOUNT = 100 * PRECISION;
const FEE_ENTRY_AMOUNT = 5 * PRECISION;
const UPDATED_ENTRY_AMOUNT = 80;
const OPERATED_AT = new Date('2026-06-05T09:00:00.000Z');

const seedFeeCashAccount = () => seed.account({ title: 'Fee cash account', type: AccountTypeEnum.BANK_SYNC });

const seedLentDebtAccount = () =>
    seed.account({
        title: 'Fee debt account',
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.LENT,
        targetBalance: 300 * PRECISION
    });

const seedSyncedExpenseTransaction = (cashAccountId: number) =>
    insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Coffee shop purchase',
        externalId: 'privatbank-expense',
        externalSource: ExternalSourceEnum.PRIVATBANK,
        operatedAt: OPERATED_AT,
        comment: '',
        exchangeRate: 1,
        updatedBy: null,
        fromAccountId: cashAccountId,
        toAccountId: null
    } satisfies TransactionCreateEntityInterface);

const seedCreditEntry = (
    transactionId: number,
    cashAccountId: number,
    amount: number,
    externalId: string | null
): TransactionEntryEntityInterface =>
    insertOne(TransactionEntryEntityTable, {
        transactionId,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null,
        mccCategoryId: null,
        externalId,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: amount,
        toIban: null,
        originalTransactionId: null
    });

const seedFeeBearingEntries = (
    transactionId: number,
    cashAccountId: number
): { creditEntry: TransactionEntryEntityInterface; feeEntry: TransactionEntryEntityInterface } => {
    const creditEntry = seedCreditEntry(transactionId, cashAccountId, PRIMARY_ENTRY_AMOUNT, 'privatbank-expense');
    const feeEntry = insertOne(TransactionEntryEntityTable, {
        transactionId,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.FEE,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount: FEE_ENTRY_AMOUNT,
        categoryId: BANK_FEE_CATEGORY_ID,
        categorySource: CategorySourceEnum.FEE,
        mccCategoryId: null,
        externalId: 'privatbank-expense:fee',
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: FEE_ENTRY_AMOUNT,
        toIban: null,
        originalTransactionId: null
    });

    return { creditEntry, feeEntry };
};

const buildPlainExpenseUpdateInput = (accountId: number, amount: number): TransactionUpdateServiceInputInterface => ({
    type: TransactionTypeEnum.EXPENSE,
    title: 'Coffee shop purchase',
    operatedAt: OPERATED_AT,
    comment: '',
    fromAccountId: accountId,
    toAccountId: null,
    exchangeRate: 1,
    entries: [
        {
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null
        }
    ],
    tagIds: []
});

const fetchEntryById = (entryId: number): TransactionEntryEntityInterface | undefined =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.id, entryId)).get();

const fetchLivePrimaryEntries = (transactionId: number): TransactionEntryEntityInterface[] =>
    testDb
        .select()
        .from(TransactionEntryEntityTable)
        .all()
        .filter(
            entry => entry.transactionId === transactionId && entry.kind === TransactionEntryKindEnum.PRIMARY && entry.deletedAt === null
        );

const fetchLiveDebtEvent = (transactionId: number): DebtEventEntityInterface | undefined =>
    testDb
        .select()
        .from(DebtEventEntityTable)
        .where(and(eq(DebtEventEntityTable.transactionId, transactionId), isNull(DebtEventEntityTable.deletedAt)))
        .get();

const fetchDebtPaidAmount = (debtAccountId: number): number => {
    const progress = accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccountId).get();

    if (!isDefined(progress)) {
        throw new Error(`Debt progress for account ${debtAccountId} not found`);
    }

    return convertFromMicroUnits(progress.paidAmount);
};

describe('debt settlement fee entries', () => {
    it('attaches a fee-bearing synced expense to a debt', async () => {
        const cashAccount = seedFeeCashAccount();
        const debtAccount = seedLentDebtAccount();
        const transaction = seedSyncedExpenseTransaction(cashAccount.id);
        const { creditEntry, feeEntry } = seedFeeBearingEntries(transaction.id, cashAccount.id);

        await expect(
            transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id })
        ).resolves.toBeDefined();

        const debtEvent = fetchLiveDebtEvent(transaction.id);

        expect(debtEvent?.transactionEntryId).toBe(creditEntry.id);
        expect(debtEvent?.amount).toBe(PRIMARY_ENTRY_AMOUNT);
        expect(debtEvent?.direction).toBe(DebtEventDirectionEnum.CLOSE);
        expect(debtEvent?.source).toBe(DebtEventSourceEnum.INCOME_ATTACHMENT);

        const updatedCreditEntry = fetchEntryById(creditEntry.id);
        const updatedFeeEntry = fetchEntryById(feeEntry.id);

        expect(updatedCreditEntry?.categoryId).toBe(DEBT_PAYMENT_CATEGORY_ID);
        expect(updatedCreditEntry?.categorySource).toBe(CategorySourceEnum.DEBT_SETTLEMENT);
        expect(updatedFeeEntry?.categoryId).toBe(BANK_FEE_CATEGORY_ID);
        expect(updatedFeeEntry?.categorySource).toBe(CategorySourceEnum.FEE);
        expect(fetchDebtPaidAmount(debtAccount.id)).toBe(100);
    });

    it('rejects a transaction with two non-fee primary entries', async () => {
        const cashAccount = seedFeeCashAccount();
        const debtAccount = seedLentDebtAccount();
        const transaction = seedSyncedExpenseTransaction(cashAccount.id);

        seedCreditEntry(transaction.id, cashAccount.id, PRIMARY_ENTRY_AMOUNT, null);
        seedCreditEntry(transaction.id, cashAccount.id, FEE_ENTRY_AMOUNT, null);

        await expect(
            transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id })
        ).rejects.toThrow();
    });

    it('detach reverts the settlement category on the non-fee entry of a fee-bearing expense', async () => {
        const cashAccount = seedFeeCashAccount();
        const debtAccount = seedLentDebtAccount();
        const transaction = seedSyncedExpenseTransaction(cashAccount.id);
        const { creditEntry, feeEntry } = seedFeeBearingEntries(transaction.id, cashAccount.id);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });
        await transactionDebtSettlementService.detach(transaction.id);

        const revertedCreditEntry = fetchEntryById(creditEntry.id);
        const untouchedFeeEntry = fetchEntryById(feeEntry.id);

        expect(revertedCreditEntry?.categoryId).toBeNull();
        expect(revertedCreditEntry?.categorySource).toBe(CategorySourceEnum.USER);
        expect(untouchedFeeEntry?.categoryId).toBe(BANK_FEE_CATEGORY_ID);
        expect(untouchedFeeEntry?.categorySource).toBe(CategorySourceEnum.FEE);
        expect(fetchLiveDebtEvent(transaction.id)).toBeUndefined();
    });

    it('keeps the debt event pointing at the live entry after the transaction is edited', async () => {
        const cashAccount = seedFeeCashAccount();
        const debtAccount = seedLentDebtAccount();
        const transaction = seedSyncedExpenseTransaction(cashAccount.id);
        const originalEntry = seedCreditEntry(transaction.id, cashAccount.id, PRIMARY_ENTRY_AMOUNT, null);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });
        await transactionService.updateById(transaction.id, buildPlainExpenseUpdateInput(cashAccount.id, UPDATED_ENTRY_AMOUNT));

        const staleEntry = fetchEntryById(originalEntry.id);
        const [newPrimaryEntry] = fetchLivePrimaryEntries(transaction.id);
        const debtEvent = fetchLiveDebtEvent(transaction.id);

        expect(staleEntry).toBeUndefined();
        expect(debtEvent?.transactionEntryId).toBe(newPrimaryEntry?.id);
        expect(debtEvent?.amount).toBe(UPDATED_ENTRY_AMOUNT * PRECISION);
        expect(debtEvent?.baseAmount).toBe(UPDATED_ENTRY_AMOUNT * PRECISION);
        expect(fetchDebtPaidAmount(debtAccount.id)).toBe(UPDATED_ENTRY_AMOUNT);
    });
});
