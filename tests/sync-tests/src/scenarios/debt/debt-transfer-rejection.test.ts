import { transactionTransferService } from '@app/transaction/service/transaction-transfer.service';
import { transactionService } from '@app/transaction/service/transaction.service';
import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { buildTransferInput, seed, testDb } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import type { AccountEntityInterface, TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const TRANSFERRED_AMOUNT = 250 * PRECISION;
const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');
const DEBT_TRANSFER_ERROR = 'Debt accounts cannot take part in transfers';

const createDebtAccount = (): AccountEntityInterface =>
    seed.account({
        title: 'Transfer debt account',
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.LENT,
        targetBalance: 500 * PRECISION
    });

const createExpense = (cashAccountId: number) => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Lent to Alex',
        externalId: null,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: OPERATED_AT,
        comment: '',
        exchangeRate: 1,
        updatedBy: null,
        fromAccountId: cashAccountId,
        toAccountId: null
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount: TRANSFERRED_AMOUNT,
        categoryId: null,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: TRANSFERRED_AMOUNT,
        toIban: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction;
};

describe('transfers involving a debt account', () => {
    it('rejects converting an expense into a transfer to a debt account', async () => {
        const cashAccount = seed.account({ title: 'Transfer cash account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = createDebtAccount();
        const transaction = createExpense(cashAccount.id);

        await expect(
            transactionTransferService.convertExpenseToTransfer({ id: transaction.id, accountId: debtAccount.id, customExchangeRate: 0 })
        ).rejects.toThrow(DEBT_TRANSFER_ERROR);

        const stored = testDb
            .select()
            .from(TransactionEntityTable)
            .all()
            .find(row => row.id === transaction.id);

        expect(stored?.type).toBe(TransactionTypeEnum.EXPENSE);
    });

    it('rejects creating a transfer into a debt account and writes no rows', async () => {
        const cashAccount = seed.account({ title: 'Transfer cash account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = createDebtAccount();

        await expect(
            transactionService.createInternalTransfer(buildTransferInput(cashAccount.id, debtAccount.id, 250, OPERATED_AT))
        ).rejects.toThrow(DEBT_TRANSFER_ERROR);

        expect(testDb.select().from(TransactionEntityTable).all()).toHaveLength(0);
        expect(testDb.select().from(TransactionEntryEntityTable).all()).toHaveLength(0);
    });
});
