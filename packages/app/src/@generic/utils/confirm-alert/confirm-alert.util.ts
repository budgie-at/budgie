import { Alert } from 'react-native';

interface ConfirmAlertOptions {
    readonly title: string;
    readonly message?: string;
    readonly confirmText: string;
    readonly cancelText: string;
    readonly isDestructive?: boolean;
}

export const confirmAlert = (options: ConfirmAlertOptions): Promise<boolean> =>
    new Promise(resolve => {
        Alert.alert(options.title, options.message, [
            { text: options.cancelText, style: 'cancel', onPress: () => void resolve(false) },
            {
                text: options.confirmText,
                style: options.isDestructive ? 'destructive' : 'default',
                onPress: () => void resolve(true)
            }
        ]);
    });
