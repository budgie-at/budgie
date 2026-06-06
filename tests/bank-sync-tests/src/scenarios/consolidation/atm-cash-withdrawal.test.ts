import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import {
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum
} from '@budgie/contracts';

import {
    buildMonobank,
    expectAtmCashWithdrawalConsolidation,
    fetchCanonicalsOfType,
    fetchTransactionById,
    findMccByCode,
    monobankStub,
    seed,
    seedBankPair,
    setupMonobankFixture,
    testDb
} from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { transactionService } from '@app/transaction/service/transaction.service';

import type { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const PRECISION = 1_000_000;

const seedAtmExpense = (bankAccountId: number) =>
    seedBankPair.expense(
        { externalId: 'tx-atm', operatedAt: new Date(2026, 0, 15, 12, 0, 0) },
        { accountId: bankAccountId, amount: 500 * PRECISION, mccCategoryId: findMccByCode('6011').id }
    );

const seedAtmCashWithdrawalFixture = () => {
    const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
    const expense = seedAtmExpense(bankAccount.id);

    return { bankAccount, cashAccount, expense };
};

describe('consolidation/atm-cash-withdrawal', () => {
    it('promotes an MCC=6011 expense into a TRANSFER to the unique cash account in the same currency', async () => {
        const { bankAccount, cashAccount, expense } = seedAtmCashWithdrawalFixture();

        await expectAtmCashWithdrawalConsolidation(bankAccount.id, cashAccount.id, expense.id);
    });

    it('promotes a Monobank ATM withdrawal with commission into a cash transfer and keeps the commission as a fee expense', async () => {
        const { account: bankAccount } = setupMonobankFixture();
        const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
        monobankStub.statement([
            buildMonobank.transaction({
                id: 'tx-atm-with-fee',
                amount: -40800,
                commissionRate: -800,
                hold: false,
                mcc: 6011,
                operationAmount: -40800
            })
        ]);

        await monobankSyncService.sync();

        const mcc = findMccByCode('6011');
        const syncedEntries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-atm-with-fee'))
            .all();
        expect(syncedEntries).toHaveLength(1);
        expect(syncedEntries[0].amount).toBe(400 * PRECISION);
        expect(syncedEntries[0].mccCategoryId).toBe(mcc.id);

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(1);

        const [canonical] = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
        expect(canonical.fromAccountId).toBe(bankAccount.id);
        expect(canonical.toAccountId).toBe(cashAccount.id);

        const canonicalEntries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, canonical.id))
            .all();
        const canonicalBankEntry = canonicalEntries.find(
            entry => entry.type === TransactionEntryTypeEnum.CREDIT && !isDefined(entry.originalTransactionId)
        );
        const canonicalCashEntry = canonicalEntries.find(
            entry => entry.type === TransactionEntryTypeEnum.DEBIT && !isDefined(entry.originalTransactionId)
        );
        const feeEntry = canonicalEntries.find(
            entry => entry.type === TransactionEntryTypeEnum.FEE && !isDefined(entry.originalTransactionId)
        );

        expect(canonicalBankEntry?.amount).toBe(400 * PRECISION);
        expect(canonicalCashEntry?.amount).toBe(400 * PRECISION);
        expect(feeEntry?.amount).toBe(8 * PRECISION);
        expect(feeEntry?.categoryId).toBe(BANK_FEE_CATEGORY_ID);
        expect(feeEntry?.categorySource).toBe(CategorySourceEnum.FEE);

        const bankBalance = accountBalanceRepository.getByAccountId(bankAccount.id).get();
        const cashBalance = accountBalanceRepository.getByAccountId(cashAccount.id).get();
        expect(bankBalance?.balance).toBe(-408 * PRECISION);
        expect(cashBalance?.balance).toBe(400 * PRECISION);
    });

    it('consolidates a previously synced Monobank ATM commission marked only by fee category source', async () => {
        const { bankAccount, cashAccount, expense } = seedAtmCashWithdrawalFixture();

        insertOne(TransactionEntryEntityTable, {
            transactionId: expense.id,
            accountId: bankAccount.id,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: 8 * PRECISION,
            externalId: 'tx-atm:fee',
            exchangeRate: 1,
            toIban: null,
            categoryId: BANK_FEE_CATEGORY_ID,
            categorySource: CategorySourceEnum.FEE,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        await expectAtmCashWithdrawalConsolidation(bankAccount.id, cashAccount.id, expense.id);

        const [canonical] = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
        const canonicalEntries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, canonical.id))
            .all();
        const feeEntry = canonicalEntries.find(
            entry => entry.type === TransactionEntryTypeEnum.FEE && !isDefined(entry.originalTransactionId)
        );

        expect(feeEntry?.amount).toBe(8 * PRECISION);
        expect(feeEntry?.categoryId).toBe(BANK_FEE_CATEGORY_ID);
    });

    it('does NOT auto-consolidate when more than one cash account shares the currency', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        seed.account({ title: 'Cash 1', type: AccountTypeEnum.CASH, instrumentId: 1 });
        seed.account({ title: 'Cash 2', type: AccountTypeEnum.CASH, instrumentId: 1 });
        seedAtmExpense(bankAccount.id);

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
    });

    it('reverts an ATM cash withdrawal canonical and restores the source expense', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
        const expense = seedAtmExpense(bankAccount.id);

        await transferConsolidationService.consolidate();

        const canonical = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)[0];
        expect(canonical).toBeDefined();

        await transactionService.unconsolidateById(canonical.id);

        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(0);
        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBeNull();

        const restoredEntries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, expense.id))
            .all();
        expect(restoredEntries).toHaveLength(1);
        expect(restoredEntries[0].originalTransactionId).toBeNull();

        const leftoverEntries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, canonical.id))
            .all();
        expect(leftoverEntries).toHaveLength(0);
    });
});
