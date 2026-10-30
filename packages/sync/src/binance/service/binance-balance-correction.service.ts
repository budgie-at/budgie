import { Db, SyncRepository, convertToMicroUnits } from '@budgie/contracts';
import { BalanceAdjustmentService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { BinanceAccountService } from './binance-account.service';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';

export class BinanceBalanceCorrectionService extends Context.Service<BinanceBalanceCorrectionService>()(
    '@budgie/sync/BinanceBalanceCorrectionService',
    {
        make: Effect.gen(function* () {
            const syncRepository = yield* SyncRepository;
            const balanceAdjustmentService = yield* BalanceAdjustmentService;
            const binanceAccountService = yield* BinanceAccountService;

            return {
                correctAllBalances: Effect.fn('BinanceBalanceCorrectionService.correctAllBalances')(
                    function* (exchangeAccounts: SyncAccountInterface[], integrationId: number, snapshotAt: Date) {
                        const correctedAccountIds: number[] = [];
                        for (const { account, balance } of yield* binanceAccountService.findAnchorableBalances(
                            exchangeAccounts,
                            integrationId
                        )) {
                            const sync = yield* syncRepository.getByAccountId(account.id);
                            if (isDefined(sync)) {
                                yield* syncRepository.update(sync.id, {
                                    reconciledAt: snapshotAt,
                                    reconciledBalance: convertToMicroUnits(balance)
                                });
                                correctedAccountIds.push(account.id);
                            }
                        }

                        yield* balanceAdjustmentService.rebaseReconciliations(correctedAccountIds);
                    },
                    effect => Db.transaction(effect)
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(BinanceBalanceCorrectionService, BinanceBalanceCorrectionService.make).pipe(
        Layer.provide([SyncRepository.layer, BalanceAdjustmentService.layer, BinanceAccountService.layer])
    );
}
