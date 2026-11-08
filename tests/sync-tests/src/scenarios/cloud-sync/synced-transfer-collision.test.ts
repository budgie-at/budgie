import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import {
    Db,
    ExternalSourceEnum,
    TransactionEntryTypeEnum,
    TransactionEntryKindEnum,
    TransactionTypeEnum,
    deriveBankTransactionSyncId
} from '@budgie/contracts';
import { TransferCreationService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, testDb, OPERATED_AT } from '../../harness';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

describe('cloud-sync bank transfer identity', () => {
    it.effect('allocates a fresh identity when a tombstone already claims the deterministic bank transfer id', () =>
        Effect.gen(function* () {
            const source = yield* seed.account({ title: 'Bank' });
            const target = yield* seed.account({ title: 'Cash' });
            yield* testDb.$client.unsafe("UPDATE accounts SET external_id = 'bank-account' WHERE id = ?", [source.id]);
            const claimed = deriveBankTransactionSyncId(ExternalSourceEnum.MONOBANK, 'bank-account', 'bank-transfer');
            const tombstone = yield* seed.manualExpense({
                accountId: source.id,
                amount: 1_000_000,
                operatedAt: OPERATED_AT,
                title: 'Deleted bank transaction'
            });
            yield* testDb.$client.unsafe('UPDATE transactions SET sync_id = ?, deleted_at = 1 WHERE id = ?', [claimed, tombstone.id]);
            const input: TransactionCreateInputInterface = {
                type: TransactionTypeEnum.TRANSFER,
                title: 'Bank transfer',
                comment: '',
                operatedAt: OPERATED_AT,
                externalId: 'bank-transfer',
                externalSource: ExternalSourceEnum.MONOBANK,
                updatedBy: null,
                fromAccountId: source.id,
                toAccountId: target.id,
                amount: 1,
                exchangeRate: 1,
                tagIds: [],
                entries: [
                    {
                        accountId: source.id,
                        categoryId: null,
                        mccCategoryId: null,
                        type: TransactionEntryTypeEnum.CREDIT,
                        amount: 1,
                        kind: TransactionEntryKindEnum.PRIMARY
                    },
                    {
                        accountId: target.id,
                        categoryId: null,
                        mccCategoryId: null,
                        type: TransactionEntryTypeEnum.DEBIT,
                        amount: 1,
                        kind: TransactionEntryKindEnum.PRIMARY
                    }
                ]
            };
            const [transaction] = yield* Effect.flatMap(TransferCreationService, service => service.createSyncedTransfers([input])).pipe(
                Effect.provide(TransferCreationService.layer),
                Effect.provideService(Db, testDb)
            );
            expect(transaction.syncId).toBeTruthy();
            expect(transaction.syncId).not.toBe(claimed);
            expect(yield* testDb.$client.unsafe('SELECT sync_id FROM transactions WHERE sync_id = ?', [claimed])).toEqual([
                { sync_id: claimed }
            ]);
            yield* assertStoredBalancesMatchLedger(testDb);
        })
    );
});
