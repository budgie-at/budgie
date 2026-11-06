import { InzhurManualPurchaseService } from '@budgie/sync';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Storage } from '@op-engineering/op-sqlite';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { isNotificationPermissionGranted } from '../../@generic/utils/is-notification-permission-granted.util';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { postLocalNotification } from '../../@generic/utils/post-local-notification.util';
import { inzhurDismissedTopUpsAtom } from '../constant/inzhur-dismissed-top-ups-atom.constant';

export class InzhurPendingTopUpService extends Context.Service<InzhurPendingTopUpService>()('@budgie/app/InzhurPendingTopUpService', {
    make: Effect.gen(function* () {
        const inzhurManualPurchaseService = yield* InzhurManualPurchaseService;
        const dismissedKey = '@budgie:inzhur-dismissed-top-ups';
        const notifiedKey = '@budgie:inzhur-notified-top-ups';
        const TransactionIdsSchema = Schema.fromJsonString(Schema.Array(Schema.Number));
        const storage = yield* Effect.acquireRelease(
            Effect.sync(() => new Storage({ name: 'inzhur-pending-top-ups.sqlite' })),
            topUpStorage =>
                Effect.sync(() => {
                    topUpStorage.closeSync();
                })
        );

        const readIds = Effect.fnUntraced(function* (key: string) {
            const stored = yield* Effect.promise(() => storage.getItem(key));

            if (!isNotEmptyString(stored)) {
                return [];
            }

            return yield* Schema.decodeUnknownEffect(TransactionIdsSchema)(stored).pipe(
                Effect.catch(() => Effect.succeed<readonly number[]>([]))
            );
        });

        const writeIds = Effect.fnUntraced(function* (key: string, ids: readonly number[]) {
            const stored = yield* Schema.encodeEffect(TransactionIdsSchema)(ids).pipe(Effect.orDie);

            yield* Effect.promise(() => storage.setItem(key, stored));
        });

        const findDismissed = () => readIds(dismissedKey);

        appAtomRegistry.set(inzhurDismissedTopUpsAtom, yield* findDismissed());

        const remind = Effect.fn('InzhurPendingTopUpService.remind')(function* () {
            const pendingTopUps = yield* inzhurManualPurchaseService.findPendingTopUps();
            const dismissed = yield* findDismissed();
            const notified = yield* readIds(notifiedKey);
            const unnotifiedTopUps = pendingTopUps.filter(
                topUp => !dismissed.includes(topUp.transactionId) && !notified.includes(topUp.transactionId)
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
                        i18n._(msg`Inzhur top-up waiting`),
                        i18n._(msg`${amount} topped up ${date}. What did you buy?`)
                    );
                    yield* writeIds(notifiedKey, [...(yield* readIds(notifiedKey)), topUp.transactionId]);
                }),
                { discard: true }
            );
        });

        return {
            findDismissed,
            dismiss: Effect.fn('InzhurPendingTopUpService.dismiss')(function* (topUpTransactionId: number) {
                const dismissed = yield* findDismissed();

                if (dismissed.includes(topUpTransactionId)) {
                    return;
                }

                const nextDismissed = [...dismissed, topUpTransactionId];

                yield* writeIds(dismissedKey, nextDismissed);
                appAtomRegistry.set(inzhurDismissedTopUpsAtom, nextDismissed);
            }),
            start: Effect.forkDetach(logAndContinue(remind())).pipe(Effect.asVoid)
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurPendingTopUpService, InzhurPendingTopUpService.make).pipe(
        Layer.provide(InzhurManualPurchaseService.layer)
    );
}
