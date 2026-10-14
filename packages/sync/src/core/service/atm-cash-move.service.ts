import { UnconsolidationService } from '@budgie/consolidation';
import { Db, TransactionConsolidationRepository, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { TransferConsolidationService } from './transfer-consolidation.service';

export class AtmCashMoveService extends Context.Service<AtmCashMoveService>()('@budgie/sync/AtmCashMoveService', {
    make: Effect.gen(function* () {
        const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transferConsolidationService = yield* TransferConsolidationService;
        const unconsolidationService = yield* UnconsolidationService;

        const filterByConsolidation = Effect.fnUntraced(function* (transactionIds: readonly number[], isConsolidated: boolean) {
            const transactions = yield* transactionConsolidationRepository.findConsolidationParentsByIds(transactionIds);

            return transactions
                .filter(transaction => isDefined(transaction.consolidationParentTransactionId) === isConsolidated)
                .map(transaction => transaction.id);
        });

        return {
            moveToCash: Effect.fn('AtmCashMoveService.moveToCash')(function* (transactionIds: readonly number[]) {
                const unconsolidatedTransactionIds = yield* filterByConsolidation(transactionIds, false);

                yield* transferConsolidationService.moveAtmCashWithdrawalsToCash(unconsolidatedTransactionIds);

                return yield* filterByConsolidation(unconsolidatedTransactionIds, true);
            }),
            undoMoveToCash: Effect.fn('AtmCashMoveService.undoMoveToCash')(
                function* (transactionIds: readonly number[]) {
                    const transactions = yield* transactionConsolidationRepository.findConsolidationParentsByIds(transactionIds);
                    const transferIds = new Set(
                        transactions
                            .filter(
                                transaction => transaction.consolidationParentType === TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL
                            )
                            .map(transaction => transaction.consolidationParentTransactionId)
                            .filter(isDefined)
                    );

                    yield* Effect.forEach(transferIds, transferId => unconsolidationService.unconsolidateById(transferId), {
                        discard: true
                    });
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(AtmCashMoveService, AtmCashMoveService.make).pipe(
        Layer.provide([
            TransactionConsolidationRepository.layer,
            AccountBalanceIncrementalService.layer,
            TransferConsolidationService.layer,
            UnconsolidationService.layer
        ])
    );
}
