import * as Effect from 'effect/Effect';
import { Alert } from 'react-native';

interface ConfirmAlertOptions {
    readonly title: string;
    readonly message?: string;
    readonly confirmText: string;
    readonly cancelText: string;
    readonly isDestructive?: boolean;
}

export const confirmAlert = (options: ConfirmAlertOptions): Effect.Effect<boolean> =>
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
