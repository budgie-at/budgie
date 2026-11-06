import * as Effect from 'effect/Effect';
import * as Notifications from 'expo-notifications';

import { NativeCallError } from '../error/native-call.error';

export const isNotificationPermissionGranted = Effect.tryPromise({
    try: () => Notifications.getPermissionsAsync(),
    catch: cause => new NativeCallError({ cause })
}).pipe(Effect.map(({ status }) => status === Notifications.PermissionStatus.GRANTED));
