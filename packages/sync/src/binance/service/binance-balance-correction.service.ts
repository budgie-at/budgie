import { Db, SyncModeEnum, SyncRepository, SyncStatusEnum, convertToMicroUnits } from '@budgie/contracts';
import { BalanceAdjustmentService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { BINANCE_ACCOUNT_DEFINITION } from '../constant/binance-account-definition.constant';

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
                            const reconciliation = { reconciledAt: snapshotAt, reconciledBalance: convertToMicroUnits(balance) };
                            const sync = yield* syncRepository.getByAccountId(account.id);
                            if (isDefined(sync)) {
                                yield* syncRepository.update(sync.id, reconciliation);
                            } else {
                                yield* syncRepository.create({
                                    accountId: account.id,
                                    provider: BINANCE_ACCOUNT_DEFINITION.provider,
                                    enabled: false,
                                    mode: SyncModeEnum.FORWARD,
                                    status: SyncStatusEnum.IDLE,
                                    ...reconciliation
                                });
                            }
                            correctedAccountIds.push(account.id);
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
