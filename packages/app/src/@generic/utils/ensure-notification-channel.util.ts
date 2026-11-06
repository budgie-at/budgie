import * as Effect from 'effect/Effect';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { toNativeCallError } from './to-native-call-error.util';

import type { LocalNotificationChannelInterface } from '../interface/local-notification-channel.interface';

export const ensureNotificationChannel = Effect.fnUntraced(function* (channel: LocalNotificationChannelInterface) {
    if (Platform.OS !== 'android') {
        return;
    }

    yield* Effect.tryPromise({
        try: () =>
            Notifications.setNotificationChannelAsync(channel.id, {
                name: channel.name,
                importance: Notifications.AndroidImportance.DEFAULT
            }),
        catch: toNativeCallError
    });
});
