import {
    AccountBalanceRepository,
    SyncRepository,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { EntryBaseValuationService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { SyncEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class BalanceAdjustmentService extends Context.Service<BalanceAdjustmentService>()('@budgie/ledger/BalanceAdjustmentService', {
    make: Effect.gen(function* () {
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const syncRepository = yield* SyncRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const millisecondsBeforeOldestEntry = 1_000;

        const create = Effect.fn('BalanceAdjustmentService.create')(function* (accountId: number, delta: number, operatedAt: Date) {
            const isIncome = isPositiveNumber(delta);
            const amount = Math.abs(delta);
            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({ accountId, amount, operatedAt });

            const transaction = yield* transactionRepository.create({
                type: TransactionTypeEnum.ADJUSTMENT,
                title: '',
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt,
                exchangeRate: valuation.baseExchangeRate ?? 1,
                fromAccountId: isIncome ? null : accountId,
                toAccountId: isIncome ? accountId : null,
                updatedBy: null
            });

            yield* transactionEntryRepository.create({
                accountId,
                transactionId: transaction.id,
                categoryId: null,
                mccCategoryId: null,
                amount,
                type: isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                exchangeRate: valuation.baseExchangeRate ?? 1,
                baseInstrumentId: valuation.baseInstrumentId,
                baseExchangeRate: valuation.baseExchangeRate,
                baseAmount: valuation.baseAmount
            });

            return transaction.id;
        });

        const getCountedAmount = (
            adjustment: TransactionWithEntriesEntityInterface | null | undefined,
            accountId: number,
            reconciledAt: Date
        ): number =>
            isDefined(adjustment) && !isDefined(adjustment.deletedAt) && adjustment.operatedAt <= reconciledAt
                ? adjustment.entries
                      .filter(entry => entry.accountId === accountId)
                      .reduce((sum, entry) => sum + (entry.type === TransactionEntryTypeEnum.DEBIT ? entry.amount : -entry.amount), 0)
                : 0;

        const rebase = Effect.fnUntraced(function* (sync: SyncEntityInterface) {
            const { accountId, reconciledAt, reconciledBalance, reconciliationTransactionId } = sync;
            if (!isDefined(reconciledAt) || !isDefined(reconciledBalance)) {
                return;
            }

            const adjustment = isDefined(reconciliationTransactionId)
                ? yield* transactionRepository.getByIdWithEntries(reconciliationTransactionId)
                : null;
            const countedAmount = getCountedAmount(adjustment, accountId, reconciledAt);
            const targetAmount =
                reconciledBalance - (yield* accountBalanceRepository.getLedgerBalanceUntil(accountId, reconciledAt)) + countedAmount;

            if (targetAmount === countedAmount && (targetAmount !== 0 || !isDefined(adjustment))) {
                return;
            }

            if (isDefined(adjustment)) {
                yield* transactionRepository.deleteById(adjustment.id);
            }

            const oldestAt = yield* transactionRepository.getTransactionTimeByAccountId(accountId, 'earliest');
            const operatedAt = new Date(
                Math.min(reconciledAt.getTime(), (oldestAt ?? reconciledAt).getTime() - millisecondsBeforeOldestEntry)
            );
            const nextTransactionId = targetAmount === 0 ? null : yield* create(accountId, targetAmount, operatedAt);

            yield* syncRepository.update(sync.id, { reconciliationTransactionId: nextTransactionId });
        });

        return {
            create,
            rebaseReconciliations: Effect.fn('BalanceAdjustmentService.rebaseReconciliations')(function* (accountIds: number[]) {
                yield* Effect.forEach(yield* syncRepository.findReconciledByAccountIds(accountIds), rebase, { discard: true });
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BalanceAdjustmentService, BalanceAdjustmentService.make).pipe(
        Layer.provide([
            AccountBalanceRepository.layer,
            SyncRepository.layer,
            TransactionRepository.layer,
            TransactionEntryRepository.layer,
            EntryBaseValuationService.layer
        ])
    );
}
