import { InzhurManualPurchaseService } from '@budgie/sync';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Storage } from '@op-engineering/op-sqlite';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import * as Semaphore from 'effect/Semaphore';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { NativeCallError } from '../../@generic/error/native-call.error';
import { isNotificationPermissionGranted } from '../../@generic/utils/is-notification-permission-granted.util';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { postLocalNotification } from '../../@generic/utils/post-local-notification.util';
import { BUDGET_ALERT_CHANNEL_ID } from '../../budget/constant/budget-alert-channel-id.constant';
import { inzhurDismissedTopUpsAtom } from '../constant/inzhur-dismissed-top-ups-atom.constant';

export class InzhurPendingTopUpService extends Context.Service<InzhurPendingTopUpService>()('@budgie/app/InzhurPendingTopUpService', {
    make: Effect.gen(function* () {
        const inzhurManualPurchaseService = yield* InzhurManualPurchaseService;
        const permit = yield* Semaphore.make(1);
        const dismissedKey = '@budgie:inzhur-dismissed-top-ups';
        const notifiedKey = '@budgie:inzhur-notified-top-ups';
        const ExternalIdsSchema = Schema.String.pipe(Schema.Array, Schema.fromJsonString);
        const storage = yield* Effect.acquireRelease(
            Effect.sync(() => new Storage({ name: 'inzhur-pending-top-ups.sqlite' })),
            topUpStorage =>
                Effect.sync(() => {
                    topUpStorage.closeSync();
                })
        );

        const readIds = Effect.fnUntraced(function* (key: string) {
            const stored = yield* Effect.tryPromise({
                try: () => storage.getItem(key),
                catch: cause => NativeCallError.make({ cause })
            });

            if (!isNotEmptyString(stored)) {
                return [];
            }

            return yield* Schema.decodeEffect(ExternalIdsSchema)(stored).pipe(Effect.orElseSucceed((): readonly string[] => []));
        });

        const writeIds = Effect.fnUntraced(function* (key: string, ids: readonly string[]) {
            const stored = yield* Schema.encodeEffect(ExternalIdsSchema)(ids).pipe(Effect.orDie);

            yield* Effect.tryPromise({
                try: () => storage.setItem(key, stored),
                catch: cause => NativeCallError.make({ cause })
            });
        });

        const findDismissed = readIds(dismissedKey);
        const initialDismissed = yield* findDismissed.pipe(Effect.orElseSucceed((): readonly string[] => []));

        appAtomRegistry.set(inzhurDismissedTopUpsAtom, initialDismissed);

        const remind = Effect.fn('InzhurPendingTopUpService.remind')(
            function* () {
                const pendingTopUps = yield* inzhurManualPurchaseService.findPendingTopUps();
                const dismissed = yield* findDismissed;
                const notified = yield* readIds(notifiedKey);
                const unnotifiedTopUps = pendingTopUps.filter(
                    topUp => !dismissed.includes(topUp.externalId) && !notified.includes(topUp.externalId)
                );

                if (!isNotEmptyArray(unnotifiedTopUps)) {
                    return;
                }

                if (!(yield* isNotificationPermissionGranted)) {
                    return;
                }

                const amountFormat = new Intl.NumberFormat(i18n.locale, {
                    style: 'currency',
                    currency: 'UAH',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                });
                const dateFormat = new Intl.DateTimeFormat(i18n.locale, { month: 'short', day: 'numeric' });

                yield* Effect.forEach(
                    unnotifiedTopUps,
                    Effect.fnUntraced(function* (topUp) {
                        const amount = amountFormat.format(topUp.amount);
                        const date = dateFormat.format(topUp.operatedAt);

                        yield* postLocalNotification(
                            { id: BUDGET_ALERT_CHANNEL_ID, name: i18n._(msg`Budget alerts`) },
                            i18n._(msg`Inzhur top-up waiting`),
                            i18n._(msg`${amount} topped up ${date}. What did you buy?`)
                        );
                        yield* writeIds(notifiedKey, [...(yield* readIds(notifiedKey)), topUp.externalId]);
                    }),
                    { discard: true }
                );
            },
            effect => permit.withPermit(effect)
        );

        return {
            remind,
            dismiss: Effect.fn('InzhurPendingTopUpService.dismiss')(
                function* (topUpExternalId: string) {
                    const dismissed = yield* findDismissed;

                    if (dismissed.includes(topUpExternalId)) {
                        return;
                    }

                    const nextDismissed = [...dismissed, topUpExternalId];

                    yield* writeIds(dismissedKey, nextDismissed);
                    appAtomRegistry.set(inzhurDismissedTopUpsAtom, nextDismissed);
                },
                effect => permit.withPermit(effect)
            ),
            start: remind().pipe(logAndContinue, Effect.forkDetach, Effect.asVoid)
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurPendingTopUpService, InzhurPendingTopUpService.make).pipe(
        Layer.provide(InzhurManualPurchaseService.layer)
    );
}
