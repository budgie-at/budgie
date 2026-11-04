import { InzhurSetupService } from '@budgie/sync';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Storage } from '@op-engineering/op-sqlite';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schedule from 'effect/Schedule';
import * as Notifications from 'expo-notifications';

import { isDefined } from '@rnw-community/shared';

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

                const { status } = yield* Effect.promise(() => Notifications.requestPermissionsAsync());

                if (status !== Notifications.PermissionStatus.GRANTED) {
                    return;
                }

                const { daysOld } = reminder;

                yield* postLocalNotification(
                    i18n._(msg`Time for a fresh Inzhur statement`),
                    i18n._(
                        msg`Your last statement is ${daysOld} days old and money has moved since. Import a new one to keep holdings accurate.`
                    )
                );
                yield* Effect.promise(() => storage.setItem(storageKey, reminder.lastStatementDate));
            });

            return {
                start: Effect.forkDetach(remind().pipe(logAndContinue, Effect.repeat(Schedule.spaced(Duration.hours(24))))).pipe(
                    Effect.asVoid
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(InzhurStatementReminderService, InzhurStatementReminderService.make).pipe(
        Layer.provide(InzhurSetupService.layer)
    );
}
