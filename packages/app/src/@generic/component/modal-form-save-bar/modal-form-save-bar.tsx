import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PillButton } from '../pill-button/pill-button';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly isLoading: boolean;
    readonly isDisabled: boolean;
    readonly testID: string;
}

export const ModalFormSaveBar = ({ label, onPress, isLoading, isDisabled, testID }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const keyboardOffset = { closed: 0, opened: bottom };

    return (
        <KeyboardStickyView offset={keyboardOffset}>
            <View className="bg-surface px-5xl py-lg">
                <PillButton label={label} onPress={onPress} isLoading={isLoading} isDisabled={isDisabled} testID={testID} />
            </View>
        </KeyboardStickyView>
    );
};
