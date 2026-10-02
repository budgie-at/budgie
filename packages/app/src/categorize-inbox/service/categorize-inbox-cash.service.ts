import { UnconsolidationService } from '@budgie/consolidation';
import { Db, TransactionRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TransferConsolidationService } from '../../sync/service/transfer-consolidation.service';

export class CategorizeInboxCashService extends Context.Service<CategorizeInboxCashService>()('@budgie/app/CategorizeInboxCashService', {
    make: Effect.gen(function* () {
        const transactionRepository = yield* TransactionRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transferConsolidationService = yield* TransferConsolidationService;
        const unconsolidationService = yield* UnconsolidationService;

        const filterByConsolidation = Effect.fnUntraced(function* (transactionIds: number[], isConsolidated: boolean) {
            const transactions = yield* transactionRepository.findByIds(transactionIds);

            return transactions
                .filter(transaction => isDefined(transaction.consolidationParentTransactionId) === isConsolidated)
                .map(transaction => transaction.id);
        });

        const moveToCash = Effect.fn('CategorizeInboxCashService.moveToCash')(function* (transactionIds: number[]) {
            const unconsolidatedTransactionIds = yield* filterByConsolidation(transactionIds, false);

            yield* transferConsolidationService.moveAtmCashWithdrawalsToCash(unconsolidatedTransactionIds);

            return yield* filterByConsolidation(unconsolidatedTransactionIds, true);
        });

        const undoMoveToCash = Effect.fn('CategorizeInboxCashService.undoMoveToCash')(
            function* (transactionIds: number[]) {
                const transactions = yield* transactionRepository.findByIds(transactionIds);
                const transferIds = new Set(
                    transactions.map(transaction => transaction.consolidationParentTransactionId).filter(isDefined)
                );

                yield* Effect.forEach(transferIds, transferId => unconsolidationService.unconsolidateById(transferId), { discard: true });
                yield* accountBalanceIncrementalService.updateAllBalances(true);
            },
            effect => Db.transaction(effect)
        );

        return { moveToCash, undoMoveToCash };
    })
}) {
    static readonly layer = Layer.effect(CategorizeInboxCashService, CategorizeInboxCashService.make).pipe(
        Layer.provide([
            TransactionRepository.layer,
            AccountBalanceIncrementalService.layer,
            TransferConsolidationService.layer,
            UnconsolidationService.layer
        ])
    );
}
