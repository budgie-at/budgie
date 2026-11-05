import * as Effect from 'effect/Effect';
import * as Notifications from 'expo-notifications';

import { ensureNotificationChannel } from './ensure-notification-channel.util';
import { toNativeCallError } from './to-native-call-error.util';

import type { ScheduledLocalNotificationInterface } from '../interface/scheduled-local-notification.interface';

export const scheduleLocalNotification = Effect.fnUntraced(function* (notification: ScheduledLocalNotificationInterface) {
    yield* ensureNotificationChannel(notification.channel);

    yield* Effect.tryPromise({
        try: () =>
            Notifications.scheduleNotificationAsync({
                identifier: notification.identifier,
                content: { title: notification.title, body: notification.body, data: notification.data },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: notification.date,
                    channelId: notification.channel.id
                }
            }),
        catch: toNativeCallError
    });
});
