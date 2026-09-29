import { accountBalanceRepository, syncRepository } from '@app/@generic/drizzle/db/db';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { transactionService } from '@app/transaction/service/transaction.service';
import { BANK_FEE_CATEGORY_ID, PRECISION, TransactionEntryEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { like } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { buildMonobank, findMccByCode, monobankStub, seed, setupMonobankFixture, testDb } from '../../harness';

const atmWithdrawal = buildMonobank.transaction({
    id: 'tx-atm',
    amount: -40800,
    hold: false,
    mcc: 6011,
    originalMcc: 6011,
    commissionRate: -800
});

const fetchAtmEntries = () =>
    testDb.select().from(TransactionEntryEntityTable).where(like(TransactionEntryEntityTable.externalId, 'tx-atm%')).all();

describe('monobank/resync-folded-fee', () => {
    it('splits a folded ATM fee into its own entry and restores the MCC without moving the balance', async () => {
        const { account } = setupMonobankFixture();
        seed.bankPairExpense(
            { externalId: 'tx-atm', operatedAt: new Date(atmWithdrawal.time * 1000) },
            { accountId: account.id, amount: 408 * PRECISION }
        );
        await transactionService.updateAllBalances();
        const balanceBefore = accountBalanceRepository.getByAccountId(account.id).get()?.balance;
        monobankStub.statement([atmWithdrawal]);

        await monobankSyncService.sync();

        const entries = fetchAtmEntries();
        const mainEntry = entries.find(entry => entry.externalId === 'tx-atm');
        const feeEntry = entries.find(entry => entry.externalId === 'tx-atm:fee');

        expect(balanceBefore).toBe(-408 * PRECISION);
        expect(entries).toHaveLength(2);
        expect(mainEntry?.amount).toBe(400 * PRECISION);
        expect(mainEntry?.mccCategoryId).toBe(findMccByCode('6011').id);
        expect(feeEntry?.amount).toBe(8 * PRECISION);
        expect(feeEntry?.type).toBe(TransactionEntryTypeEnum.FEE);
        expect(feeEntry?.categoryId).toBe(BANK_FEE_CATEGORY_ID);
        expect(feeEntry?.transactionId).toBe(mainEntry?.transactionId);
        expect(accountBalanceRepository.getByAccountId(account.id).get()?.balance).toBe(balanceBefore);
    });

    it('leaves an already split ATM row untouched on resync', async () => {
        const { account } = setupMonobankFixture();
        monobankStub.statement([atmWithdrawal]);
        await monobankSyncService.sync();
        const entriesBefore = fetchAtmEntries();
        const updateSpy = vi.spyOn(transactionService, 'update');
        await syncRepository.resetForWindowedResync(account.id, new Date(2026, 0, 1));

        monobankStub.statement([atmWithdrawal]);
        await monobankSyncService.sync();

        expect(updateSpy).toHaveBeenCalled();
        expect(entriesBefore).toHaveLength(2);
        expect(fetchAtmEntries()).toStrictEqual(entriesBefore);
        expect(accountBalanceRepository.getByAccountId(account.id).get()?.balance).toBe(-408 * PRECISION);
    });
});
