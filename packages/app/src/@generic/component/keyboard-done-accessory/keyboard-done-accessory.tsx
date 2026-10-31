import { Trans } from '@lingui/react/macro';
import { InputAccessoryView, Keyboard, Pressable, Text, View } from 'react-native';

interface Props {
    readonly nativeID: string;
}

export const KeyboardDoneAccessory = ({ nativeID }: Props) => {
    const handleDone = () => {
        Keyboard.dismiss();
    };

    return (
        <InputAccessoryView nativeID={nativeID}>
            <View className="flex-row justify-end border-t border-secondary-corner bg-secondary-background px-xl">
                <Pressable
                    className="min-h-[44px] min-w-[44px] justify-center px-md active:opacity-60"
                    onPress={handleDone}
                    accessibilityRole="button"
                >
                    <Text className="text-md font-semibold text-primary">
                        <Trans>Done</Trans>
                    </Text>
                </Pressable>
            </View>
        </InputAccessoryView>
    );
};
