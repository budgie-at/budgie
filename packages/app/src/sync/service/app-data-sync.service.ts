import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { BinanceSyncService, EnableBankingSyncService, MonobankSyncService } from '@budgie/sync';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';

import { Workload } from '../../@generic/service/workload.service';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { ExchangeRateBackgroundService } from '../../exchange-rate/service/exchange-rate-background.service';
import { WalletCaptureImportService } from '../../wallet-capture/service/wallet-capture-import.service';
import { WalletCaptureNativeService } from '../../wallet-capture/service/wallet-capture-native.service';

export class AppDataSyncService extends Context.Service<AppDataSyncService>()('@budgie/app/AppDataSyncService', {
    make: Effect.gen(function* () {
        const workload = yield* Workload;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const exchangeRateBackgroundService = yield* ExchangeRateBackgroundService;
        const monobankSyncService = yield* MonobankSyncService;
        const binanceSyncService = yield* BinanceSyncService;
        const enableBankingSyncService = yield* EnableBankingSyncService;
        const walletCaptureNativeService = yield* WalletCaptureNativeService;
        const walletCaptureImportService = yield* WalletCaptureImportService;

        return {
            sync: Effect.fn('AppDataSyncService.sync')(function* () {
                yield* logAndContinue(accountBalanceIncrementalService.updateAllBalances(false));
                yield* logAndContinue(walletCaptureNativeService.refreshAccounts());
                yield* logAndContinue(walletCaptureImportService.drain());
                yield* logAndContinue(exchangeRateBackgroundService.sync());
                if (yield* workload.hasQueuedUserWork) {
                    return false;
                }

                yield* logAndContinue(monobankSyncService.sync());
                if (yield* workload.hasQueuedUserWork) {
                    return false;
                }

                yield* logAndContinue(binanceSyncService.sync());
                if (yield* workload.hasQueuedUserWork) {
                    return false;
                }

                yield* logAndContinue(enableBankingSyncService.sync());

                return true;
            }),
            drainWalletCapturesOnInvocation: Stream.runForEach(walletCaptureNativeService.captureInvocations, () =>
                logAndContinue(walletCaptureImportService.drain())
            )
        };
    })
}) {
    static readonly layer = Layer.effect(AppDataSyncService, AppDataSyncService.make).pipe(
        Layer.provide([
            Workload.layer,
            AccountBalanceIncrementalService.layer,
            ExchangeRateBackgroundService.layer,
            MonobankSyncService.layer,
            BinanceSyncService.layer,
            EnableBankingSyncService.layer,
            WalletCaptureImportService.layer,
            WalletCaptureNativeService.layer
        ])
    );
}
