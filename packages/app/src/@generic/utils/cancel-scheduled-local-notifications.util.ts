import * as Effect from 'effect/Effect';
import * as Notifications from 'expo-notifications';

import { toNativeCallError } from './to-native-call-error.util';

export const cancelScheduledLocalNotifications = Effect.fnUntraced(function* (kind: string) {
    const scheduled = yield* Effect.tryPromise({
        try: () => Notifications.getAllScheduledNotificationsAsync(),
        catch: toNativeCallError
    });
    const matching = scheduled.filter(request => request.content.data?.['kind'] === kind);

    yield* Effect.forEach(
        matching,
        request =>
            Effect.tryPromise({
                try: () => Notifications.cancelScheduledNotificationAsync(request.identifier),
                catch: toNativeCallError
            }),
        { discard: true }
    );
});
