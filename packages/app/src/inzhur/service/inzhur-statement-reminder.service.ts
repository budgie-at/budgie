import { InzhurSetupService } from '@budgie/sync';
import { i18n } from '@lingui/core';
import { msg, plural } from '@lingui/core/macro';
import { Storage } from '@op-engineering/op-sqlite';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Notifications from 'expo-notifications';

import { isDefined } from '@rnw-community/shared';

import { NativeCallError } from '../../@generic/error/native-call.error';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { postLocalNotification } from '../../@generic/utils/post-local-notification.util';

export class InzhurStatementReminderService extends Context.Service<InzhurStatementReminderService>()(
    '@budgie/app/InzhurStatementReminderService',
    {
        make: Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;
            const storageKey = '@budgie:inzhur-statement-reminder';
            const storage = yield* Effect.acquireRelease(
                Effect.sync(() => new Storage({ name: 'inzhur-statement-reminder.sqlite' })),
                reminderStorage =>
                    Effect.sync(() => {
                        reminderStorage.closeSync();
                    })
            );

            const remind = Effect.fn('InzhurStatementReminderService.remind')(function* () {
                const reminder = yield* inzhurSetupService.findStatementReminder(new Date());

                if (!isDefined(reminder)) {
                    return;
                }

                const remindedStatementDate = yield* Effect.promise(() => storage.getItem(storageKey));

                if (remindedStatementDate === reminder.lastStatementDate) {
                    return;
                }

                const { status } = yield* Effect.tryPromise({
                    try: () => Notifications.getPermissionsAsync(),
                    catch: cause => new NativeCallError({ cause })
                });

                if (status !== Notifications.PermissionStatus.GRANTED) {
                    return;
                }

                const { daysOld } = reminder;

                yield* postLocalNotification(
                    i18n._(msg`Time for a fresh Inzhur statement`),
                    plural(daysOld, {
                        one: 'Your last statement is # day old and money has moved since. Import a new one to keep holdings accurate.',
                        other: 'Your last statement is # days old and money has moved since. Import a new one to keep holdings accurate.'
                    })
                );
                yield* Effect.promise(() => storage.setItem(storageKey, reminder.lastStatementDate));
            });

            return {
                start: Effect.forkDetach(logAndContinue(remind())).pipe(Effect.asVoid)
            };
        })
    }
) {
    static readonly layer = Layer.effect(InzhurStatementReminderService, InzhurStatementReminderService.make).pipe(
        Layer.provide(InzhurSetupService.layer)
    );
}
