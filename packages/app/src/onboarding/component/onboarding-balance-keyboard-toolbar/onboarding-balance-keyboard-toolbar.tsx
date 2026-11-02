import { Trans } from '@lingui/react/macro';
import { View } from 'react-native';
import { DefaultKeyboardToolbarTheme, KEYBOARD_HAS_ROUNDED_CORNERS, KeyboardToolbar } from 'react-native-keyboard-controller';
import { useResolveClassNames } from 'uniwind';

export const OnboardingBalanceKeyboardToolbar = () => {
    const { color } = useResolveClassNames('text-primary');
    const { color: disabledColor } = useResolveClassNames('text-primary/40');
    const offset = { opened: KEYBOARD_HAS_ROUNDED_CORNERS ? 11 : 0 };
    const theme = {
        light: {
            ...DefaultKeyboardToolbarTheme.light,
            primary: color ?? 'transparent',
            disabled: disabledColor ?? 'transparent',
            ripple: disabledColor ?? 'transparent'
        },
        dark: {
            ...DefaultKeyboardToolbarTheme.dark,
            primary: color ?? 'transparent',
            disabled: disabledColor ?? 'transparent',
            ripple: disabledColor ?? 'transparent'
        }
    };

    return (
        <KeyboardToolbar theme={theme} offset={offset}>
            <KeyboardToolbar.Background>
                <View className="absolute inset-0 bg-surface" />
            </KeyboardToolbar.Background>
            <KeyboardToolbar.Prev />
            <KeyboardToolbar.Next />
            <KeyboardToolbar.Done>
                <Trans>Done</Trans>
            </KeyboardToolbar.Done>
        </KeyboardToolbar>
    );
};
