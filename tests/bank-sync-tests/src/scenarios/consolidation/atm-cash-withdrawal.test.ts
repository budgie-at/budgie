import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

import {
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionEntityTable
} from '@budgie/contracts';

import {
    buildMonobank,
    expectAtmCashWithdrawalConsolidation,
    fetchCanonicalsOfType,
    fetchExpenseEntries,
    fetchTransactionById,
    findMccByCode,
    monobankStub,
    seed,
    seedBankPair,
    setupMonobankFixture,
    testDb
} from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import { accountBalanceRepository, bankSyncRepository, statisticsRepository } from '@app/@generic/drizzle/db/db';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { transactionService } from '@app/transaction/service/transaction.service';

import type { TransactionEntryCreateEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

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

const fetchGeneratedAtmFeeTransactions = (canonicalTransactionId: number) =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalId, `atm-fee:${canonicalTransactionId}`))
        .all();

const expectBankFeeEntry = (feeEntry: TransactionEntryEntityInterface, feeAmount: number) => {
    expect(feeEntry.amount).toBe(feeAmount * PRECISION);
    expect(feeEntry.categoryId).toBe(BANK_FEE_CATEGORY_ID);
};

const expectAccountBalances = (bankAccountId: number, cashAccountId: number, expectedBankBalance: number, expectedCashBalance: number) => {
    const bankBalance = accountBalanceRepository.getByAccountId(bankAccountId).get();
    const cashBalance = accountBalanceRepository.getByAccountId(cashAccountId).get();

    expect(bankBalance?.balance).toBe(expectedBankBalance * PRECISION);
    expect(cashBalance?.balance).toBe(expectedCashBalance * PRECISION);
};

describe('consolidation/atm-cash-withdrawal', () => {
    it('promotes an MCC=6011 expense into a TRANSFER to the unique cash account in the same currency', async () => {
        const { bankAccount, cashAccount, expense } = seedAtmCashWithdrawalFixture();

        await expectAtmCashWithdrawalConsolidation(bankAccount.id, cashAccount.id, expense.id);
    });

    it('keeps Monobank ATM commission as a fee entry after cash withdrawal consolidation', async () => {
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
        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(1);

        const [canonical] = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
        expect(canonical.fromAccountId).toBe(bankAccount.id);
        const canonicalEntries = await fetchExpenseEntries(canonical.id);
        const [canonicalBankEntry] = canonicalEntries.filter(
            entry => entry.type === TransactionEntryTypeEnum.CREDIT && entry.originalTransactionId === null
        );
        const [canonicalCashEntry] = canonicalEntries.filter(
            entry => entry.type === TransactionEntryTypeEnum.DEBIT && entry.originalTransactionId === null
        );
        const [feeEntry] = canonicalEntries.filter(entry => String(entry.type) === 'FEE');

        expect(canonicalBankEntry.amount).toBe(400 * PRECISION);
        expect(canonicalCashEntry.amount).toBe(400 * PRECISION);

        const feeTransactions = fetchGeneratedAtmFeeTransactions(canonical.id);
        expect(feeTransactions).toHaveLength(0);
        expectBankFeeEntry(feeEntry, 8);

        const categoryRows = statisticsRepository
            .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, bankAccount.instrumentId, LanguageEnum.EN)
            .all();
        const feeCategoryAmount = categoryRows.find(row => row.category?.id === BANK_FEE_CATEGORY_ID)?.amount;
        expectAccountBalances(bankAccount.id, cashAccount.id, -408, 400);
        expect(feeCategoryAmount).toBe(8 * PRECISION);

        const secondResult = await transferConsolidationService.consolidate();
        expect(secondResult.consolidated).toBe(0);

        const secondFeeTransactions = fetchGeneratedAtmFeeTransactions(canonical.id);
        expect(secondFeeTransactions).toHaveLength(0);

        await transactionService.unconsolidateById(canonical.id);

        const leftoverFeeTransactions = fetchGeneratedAtmFeeTransactions(canonical.id);
        expect(leftoverFeeTransactions).toHaveLength(0);

        const [sourceTransaction] = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalId, 'tx-atm-with-fee'))
            .all();
        expect(sourceTransaction.consolidationParentTransactionId).toBeNull();

        const restoredSourceEntries = await fetchExpenseEntries(sourceTransaction.id);
        expect(restoredSourceEntries).toHaveLength(2);
    });

    it('keeps previously synced Monobank ATM commission marked only by fee category source after consolidation', async () => {
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
        const canonicalEntries = await fetchExpenseEntries(canonical.id);
        const [feeEntry] = canonicalEntries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE);

        expectBankFeeEntry(feeEntry, 8);
        expectAccountBalances(bankAccount.id, cashAccount.id, -508, 500);
    });

    it('does not enqueue global consolidation after an empty stale Monobank sync', async () => {
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

        expect(transferConsolidationDrainerService.enqueue).not.toHaveBeenCalled();
    });

    it('does not enqueue global consolidation when Monobank sync has no stale batch pending', async () => {
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

        expect(transferConsolidationDrainerService.enqueue).not.toHaveBeenCalled();
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

        const restoredEntries = await fetchExpenseEntries(expense.id);
        expect(restoredEntries).toHaveLength(1);
        expect(restoredEntries[0].originalTransactionId).toBeNull();

        const leftoverEntries = await fetchExpenseEntries(canonical.id);
        expect(leftoverEntries).toHaveLength(0);
    });
});
