import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

import {
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum
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

import { bankSyncRepository, statisticsRepository } from '@app/@generic/drizzle/db/db';
import { TransferConsolidationDrainReasonEnum } from '@app/sync/enum/transfer-consolidation-drain-reason.enum';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { transactionService } from '@app/transaction/service/transaction.service';

const PRECISION = 1_000_000;

const seedAtmExpense = (bankAccountId: number) =>
    seedBankPair.expense(
        { externalId: 'tx-atm', operatedAt: new Date(2026, 0, 15, 12, 0, 0) },
        { accountId: bankAccountId, amount: 500 * PRECISION, mccCategoryId: findMccByCode('6011').id }
    );

describe('consolidation/atm-cash-withdrawal', () => {
    it('promotes an MCC=6011 expense into a TRANSFER to the unique cash account in the same currency', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
        const expense = seedAtmExpense(bankAccount.id);

        await expectAtmCashWithdrawalConsolidation(bankAccount.id, cashAccount.id, expense.id);
    });

    it('keeps Monobank ATM commission as a visible bank-fee expense after cash withdrawal consolidation', async () => {
        const { account: bankAccount } = setupMonobankFixture();
        seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
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
        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(1);

        const [canonical] = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
        expect(canonical.fromAccountId).toBe(bankAccount.id);
        const [canonicalBankEntry] = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, canonical.id))
            .all()
            .filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
        expect(canonicalBankEntry.amount).toBe(400 * PRECISION);

        const [feeTransaction] = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalId, `atm-fee:${canonical.id}`))
            .all();
        expect(feeTransaction.type).toBe(TransactionTypeEnum.EXPENSE);

        const [feeEntry] = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, feeTransaction.id))
            .all();
        expect(feeEntry.amount).toBe(8 * PRECISION);
        expect(feeEntry.categoryId).toBe(BANK_FEE_CATEGORY_ID);

        const categoryRows = statisticsRepository
            .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, bankAccount.instrumentId, LanguageEnum.EN)
            .all();
        const feeCategoryAmount = categoryRows.find(row => row.category?.id === BANK_FEE_CATEGORY_ID)?.amount;
        expect(feeCategoryAmount).toBe(8 * PRECISION);

        const secondResult = await transferConsolidationService.consolidate();
        expect(secondResult.consolidated).toBe(0);

        const feeTransactions = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalId, `atm-fee:${canonical.id}`))
            .all();
        expect(feeTransactions).toHaveLength(1);

        await transactionService.unconsolidateById(canonical.id);

        const leftoverFeeTransactions = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalId, `atm-fee:${canonical.id}`))
            .all();
        expect(leftoverFeeTransactions).toHaveLength(0);

        const [sourceTransaction] = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalId, 'tx-atm-with-fee'))
            .all();
        expect(sourceTransaction.consolidationParentTransactionId).toBeNull();

        const restoredSourceEntries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, sourceTransaction.id))
            .all();
        expect(restoredSourceEntries).toHaveLength(2);
    });

    it('enqueues consolidation after an empty Monobank sync so historical ATM splits can be repaired', async () => {
        const staleForwardSyncDate = new Date(2026, 0, 1);
        const { bankSync } = setupMonobankFixture();
        seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
        monobankStub.statement([
            buildMonobank.transaction({
                id: 'tx-historical-atm-with-fee',
                amount: -40800,
                commissionRate: -800,
                hold: false,
                mcc: 6011,
                operationAmount: -40800
            })
        ]);

        await monobankSyncService.sync();
        vi.mocked(transferConsolidationDrainerService.enqueue).mockClear();
        await bankSyncRepository.update(bankSync.id, {
            forwardSyncedAt: staleForwardSyncDate,
            forwardSyncFromAt: staleForwardSyncDate
        });

        monobankStub.statement([]);
        await monobankSyncService.sync();

        expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledTimes(1);
        expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledWith(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC);
    });

    it('enqueues consolidation when Monobank sync has no stale batch pending', async () => {
        setupMonobankFixture();
        seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
        monobankStub.statement([
            buildMonobank.transaction({
                id: 'tx-fresh-atm-with-fee',
                amount: -40800,
                commissionRate: -800,
                hold: false,
                mcc: 6011,
                operationAmount: -40800
            })
        ]);

        await monobankSyncService.sync();
        vi.mocked(transferConsolidationDrainerService.enqueue).mockClear();

        monobankStub.statement([]);
        await monobankSyncService.sync();

        expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledTimes(1);
        expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledWith(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC);
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
