import { AccountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { TransactionService } from '@app/transaction/service/transaction.service';
import {
    AccountBalanceRepository,
    BANK_FEE_CATEGORY_ID,
    PRECISION,
    SyncRepository,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { describe, expect, it, vi } from '@effect/vitest';
import { like } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, findMccByCode, monobankStub, seed, setupMonobankFixture, testDb, TestLayer } from '../../harness';

const atmWithdrawal = buildMonobank.transaction({
    id: 'tx-atm',
    amount: -40800,
    hold: false,
    mcc: 6011,
    originalMcc: 6011,
    commissionRate: -800
});

const fetchAtmEntries = () =>
    Effect.gen(function* () {
        return yield* testDb.select().from(TransactionEntryEntityTable).where(like(TransactionEntryEntityTable.externalId, 'tx-atm%'));
    });

describe('monobank/resync-folded-fee', () => {
    it.effect('splits a folded ATM fee into its own entry and restores the MCC without moving the balance', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { account } = yield* setupMonobankFixture();
            yield* seed.bankPairExpense(
                { externalId: 'tx-atm', operatedAt: new Date(atmWithdrawal.time * 1000) },
                { accountId: account.id, amount: 408 * PRECISION }
            );
            yield* accountBalanceIncrementalService.updateAllBalances(true);
            const balanceBefore = (yield* accountBalanceRepository.getByAccountId(account.id)).at(0)?.balance;
            monobankStub.statement([atmWithdrawal]);

            yield* monobankSyncService.sync();

            const entries = yield* fetchAtmEntries();
            const mainEntry = entries.find(entry => entry.externalId === 'tx-atm');
            const feeEntry = entries.find(entry => entry.externalId === 'tx-atm:fee');

            expect(balanceBefore).toBe(-408 * PRECISION);
            expect(entries).toHaveLength(2);
            expect(mainEntry?.amount).toBe(400 * PRECISION);
            expect(mainEntry?.mccCategoryId).toBe((yield* findMccByCode('6011')).id);
            expect(feeEntry?.amount).toBe(8 * PRECISION);
            expect(feeEntry?.type).toBe(TransactionEntryTypeEnum.FEE);
            expect(feeEntry?.categoryId).toBe(BANK_FEE_CATEGORY_ID);
            expect(feeEntry?.transactionId).toBe(mainEntry?.transactionId);
            expect((yield* accountBalanceRepository.getByAccountId(account.id)).at(0)?.balance).toBe(balanceBefore);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves an already split ATM row untouched on resync', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const transactionService = yield* TransactionService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const syncRepository = yield* SyncRepository;
            const { account } = yield* setupMonobankFixture();
            monobankStub.statement([atmWithdrawal]);
            yield* monobankSyncService.sync();
            const entriesBefore = yield* fetchAtmEntries();
            const updateSpy = vi.spyOn(transactionService, 'bulkUpdateImported');
            yield* syncRepository.resetForWindowedResync(account.id, new Date(2026, 0, 1));

            monobankStub.statement([atmWithdrawal]);
            yield* monobankSyncService.sync();

            expect(updateSpy).toHaveBeenCalled();
            expect(entriesBefore).toHaveLength(2);
            expect(yield* fetchAtmEntries()).toStrictEqual(entriesBefore);
            expect((yield* accountBalanceRepository.getByAccountId(account.id)).at(0)?.balance).toBe(-408 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});
