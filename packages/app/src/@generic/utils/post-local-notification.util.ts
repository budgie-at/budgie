import * as Effect from 'effect/Effect';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { NativeCallError } from '../error/native-call.error';

const toNativeCallError = (cause: unknown) => new NativeCallError({ cause });

export const postLocalNotification = Effect.fnUntraced(function* (title: string, body: string) {
    if (Platform.OS === 'android') {
        yield* Effect.tryPromise({
            try: () =>
                Notifications.setNotificationChannelAsync('budget-alerts', {
                    name: 'Budget Alerts', // oxlint-disable-line lingui/no-unlocalized-strings
                    importance: Notifications.AndroidImportance.DEFAULT
                }),
            catch: toNativeCallError
        });
    }

    yield* Effect.tryPromise({
        try: () => Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null }),
        catch: toNativeCallError
    });
});
