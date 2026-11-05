import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Notifications from 'expo-notifications';

import { isDefined } from '@rnw-community/shared';

import { NativeCallError } from '../../@generic/error/native-call.error';
import { useAppState } from '../../@generic/hook/use-app-state.hook';
import { appAtomRuntime } from '../../@generic/runtime/app.runtime';

const notificationPermissionAtom = appAtomRuntime.atom(
    Effect.tryPromise({
        try: () => Notifications.getPermissionsAsync(),
        catch: cause => new NativeCallError({ cause })
    }).pipe(Effect.tapError(Effect.logError))
);

export const useNotificationPermission = () => {
    const result = useAtomValue(notificationPermissionAtom);
    const refresh = useAtomRefresh(notificationPermissionAtom);
    const permission = AsyncResult.getOrElse(result, () => null);

    useAppState(isActive => {
        if (isActive && !result.waiting) {
            refresh();
        }
    });

    return {
        isDenied: isDefined(permission) && permission.status === Notifications.PermissionStatus.DENIED,
        refresh
    };
};
