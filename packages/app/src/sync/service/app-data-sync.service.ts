import { logAndContinue } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { RecurringRefreshService } from '@budgie/recurring';
import { BinanceSyncService, EnableBankingSyncService, MonobankSyncService } from '@budgie/sync';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';

import { Workload } from '../../@generic/service/workload.service';
import { ExchangeRateBackgroundService } from '../../exchange-rate/service/exchange-rate-background.service';
import { RecurringRefreshModeEnum } from '../../recurring/enum/recurring-refresh-mode.enum';
import { RecurringReminderService } from '../../recurring/service/recurring-reminder.service';
import { SiriCatalogService } from '../../siri/service/siri-catalog.service';
import { WalletCaptureImportService } from '../../wallet-capture/service/wallet-capture-import.service';
import { WalletCaptureNativeService } from '../../wallet-capture/service/wallet-capture-native.service';

export class AppDataSyncService extends Context.Service<AppDataSyncService>()('@budgie/app/AppDataSyncService', {
    make: Effect.gen(function* () {
        const workload = yield* Workload;
        const recurringRefreshService = yield* RecurringRefreshService;
        const recurringReminderService = yield* RecurringReminderService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const exchangeRateBackgroundService = yield* ExchangeRateBackgroundService;
        const monobankSyncService = yield* MonobankSyncService;
        const binanceSyncService = yield* BinanceSyncService;
        const enableBankingSyncService = yield* EnableBankingSyncService;
        const walletCaptureNativeService = yield* WalletCaptureNativeService;
        const walletCaptureImportService = yield* WalletCaptureImportService;
        const siriCatalogService = yield* SiriCatalogService;

        const syncSources = Effect.fnUntraced(function* () {
            yield* logAndContinue(accountBalanceIncrementalService.updateAllBalances(false));
            yield* logAndContinue(walletCaptureImportService.drain());
            yield* logAndContinue(exchangeRateBackgroundService.sync);
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
        });

        return {
            sync: Effect.fn('AppDataSyncService.sync')(
                function* () {
                    const isComplete = yield* syncSources();

                    yield* logAndContinue(siriCatalogService.publish());

                    return isComplete;
                },
                Effect.tap(() =>
                    logAndContinue(
                        DateTime.nowAsDate.pipe(
                            Effect.flatMap(now =>
                                workload.schedule(
                                    `recurring-refresh-${RecurringRefreshModeEnum.FULL}`,
                                    recurringRefreshService.refresh(now).pipe(Effect.andThen(recurringReminderService.reschedule(now))),
                                    { replace: true }
                                )
                            )
                        )
                    )
                )
            ),
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
            WalletCaptureNativeService.layer,
            RecurringRefreshService.layer,
            RecurringReminderService.layer,
            SiriCatalogService.layer
        ])
    );
}
