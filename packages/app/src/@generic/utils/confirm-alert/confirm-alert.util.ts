import * as Effect from 'effect/Effect';
import { Alert } from 'react-native';

import type { ConfirmAlertOptionsInterface } from '../../interface/confirm-alert-options.interface';

export const confirmAlert = (options: ConfirmAlertOptionsInterface): Effect.Effect<boolean> =>
    Effect.callback(resume => {
        Alert.alert(options.title, options.message, [
            { text: options.cancelText, style: 'cancel', onPress: () => void resume(Effect.succeed(false)) },
            {
                text: options.confirmText,
                style: options.isDestructive ? 'destructive' : 'default',
                onPress: () => void resume(Effect.succeed(true))
            }
        ]);
    });
