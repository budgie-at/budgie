import {
    AccountBalanceRepository,
    AccountTypeEnum,
    LanguageEnum,
    TransactionViewRepository,
    SyncModeEnum,
    SyncRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, BalanceAdjustmentService, TransactionService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { buildAdjustmentUpdateInput } from '../../../../../packages/app/src/transaction/utils/build-adjustment-update-input.util';
import { getAdjustmentBalanceChange } from '../../../../../packages/app/src/transaction/utils/get-adjustment-balance-change.util';
import { getAdjustmentDetails } from '../../../../../packages/app/src/transaction/utils/get-adjustment-details.util';
import { fetchAccountBalance, seed, TestLayer } from '../../harness';

const SNAPSHOT_AT = new Date('2026-10-01T12:00:00Z');

const readAdjustment = (id: number) =>
    Effect.flatMap(TransactionViewRepository, repository => repository.getById(id, LanguageEnum.EN)).pipe(
        Effect.filterOrElse(isDefined, () => Effect.die('Fixture adjustment missing'))
    );

describe('account/adjustment-edit-persistence', () => {
    it.effect('rebases a reconciliation amount edit but preserves a note-only save on its canonical adjustment', () =>
        Effect.gen(function* () {
            const balances = yield* AccountBalanceIncrementalService;
            const syncRepository = yield* SyncRepository;
            const transactions = yield* TransactionRepository;
            const transactionService = yield* TransactionService;
            const account = yield* seed.account({ type: AccountTypeEnum.BANK_SYNC });
            const sync = yield* seed.sync({ accountId: account.id, mode: SyncModeEnum.FORWARD });
            yield* syncRepository.update(sync.id, { reconciledAt: SNAPSHOT_AT, reconciledBalance: convertToMicroUnits(100) });
            yield* balances.updateBalancesByAccountIds([account.id]);
            const originalId = (yield* syncRepository.getByAccountId(account.id))?.reconciliationTransactionId ?? 0;
            const original = yield* transactions.getByIdWithEntries(originalId);
            yield* transactionService.updateById(originalId, {
                type: TransactionTypeEnum.ADJUSTMENT,
                comment: 'Amount edit note',
                operatedAt: original?.operatedAt ?? SNAPSHOT_AT,
                fromAccountId: account.id,
                toAccountId: null,
                tagIds: [],
                entries: [
                    { accountId: account.id, type: TransactionEntryTypeEnum.CREDIT, amount: 250, categoryId: null, mccCategoryId: null }
                ]
            });
            const canonicalId = (yield* syncRepository.getByAccountId(account.id))?.reconciliationTransactionId ?? 0;
            const canonical = yield* transactions.getByIdWithEntries(canonicalId);
            expect(canonicalId).not.toBe(originalId);
            expect(canonical?.comment).toBe('');
            expect(canonical?.entries).toMatchObject([{ type: TransactionEntryTypeEnum.DEBIT, amount: convertToMicroUnits(100) }]);
            expect(yield* fetchAccountBalance(account.id)).toBe(convertToMicroUnits(100));
            const editable = yield* readAdjustment(canonicalId);
            const details = getAdjustmentDetails(editable, (yield* syncRepository.getByAccountId(account.id)) ?? null);
            if (!isDefined(details)) {
                return yield* Effect.die('Fixture adjustment details missing');
            }
            expect(details.isReconciliation).toBe(true);
            expect(getAdjustmentBalanceChange(details, 250, false)).toBe(0);
            yield* transactionService.updateById(
                canonicalId,
                buildAdjustmentUpdateInput({ ...editable, comment: 'Preserved reconciliation note' }, details, 250, false)
            );
            expect((yield* syncRepository.getByAccountId(account.id))?.reconciliationTransactionId).toBe(canonicalId);
            expect((yield* transactions.getByIdWithEntries(canonicalId))?.comment).toBe('Preserved reconciliation note');
            expect(yield* fetchAccountBalance(account.id)).toBe(convertToMicroUnits(100));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('saves an authoritative adjustment and note while preserving the synced balance', () =>
        Effect.gen(function* () {
            const adjustmentService = yield* BalanceAdjustmentService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const transactions = yield* TransactionRepository;
            const transactionService = yield* TransactionService;
            const account = yield* seed.account({ type: AccountTypeEnum.CRYPTO_SYNC });
            const adjustmentId = yield* adjustmentService.create(account.id, convertToMicroUnits(1), SNAPSHOT_AT);
            yield* accountBalanceRepository.bulkUpsert([{ accountId: account.id, amount: convertToMicroUnits(10) }]);
            const editable = yield* readAdjustment(adjustmentId);
            const details = getAdjustmentDetails(editable, null);
            if (!isDefined(details)) {
                return yield* Effect.die('Fixture adjustment details missing');
            }
            expect(details.isReconciliation).toBe(false);
            expect(getAdjustmentBalanceChange(details, 2, true)).toBe(0);
            yield* transactionService.updateById(
                adjustmentId,
                buildAdjustmentUpdateInput({ ...editable, comment: 'Authoritative account note' }, details, 2, true)
            );
            expect((yield* transactions.getByIdWithEntries(adjustmentId))?.entries).toMatchObject([
                { type: TransactionEntryTypeEnum.DEBIT, amount: convertToMicroUnits(2) }
            ]);
            expect((yield* transactions.getByIdWithEntries(adjustmentId))?.comment).toBe('Authoritative account note');
            expect(yield* fetchAccountBalance(account.id)).toBe(convertToMicroUnits(10));
        }).pipe(Effect.provide(TestLayer))
    );
});
