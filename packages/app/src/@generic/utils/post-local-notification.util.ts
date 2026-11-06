import * as Effect from 'effect/Effect';
import * as Notifications from 'expo-notifications';

import { ensureNotificationChannel } from './ensure-notification-channel.util';
import { toNativeCallError } from './to-native-call-error.util';

import type { LocalNotificationChannelInterface } from '../interface/local-notification-channel.interface';

export const postLocalNotification = Effect.fnUntraced(function* (
    channel: LocalNotificationChannelInterface,
    title: string,
    body: string,
    data: Record<string, unknown> = {}
) {
    yield* ensureNotificationChannel(channel);

    yield* Effect.tryPromise({
        try: () => Notifications.scheduleNotificationAsync({ content: { title, body, data }, trigger: null }),
        catch: toNativeCallError
    });
});
