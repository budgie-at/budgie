import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PillButton } from '../pill-button/pill-button';

interface Props {
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly testID: string;
}

const MIN_BOTTOM_SPACING = 16;

export const DestinationSheetFooter = ({ label, isDisabled, onPress, testID }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const style = { paddingBottom: Math.max(bottom, MIN_BOTTOM_SPACING) };

    return (
        <View className="border-t-hairline border-surface-separator bg-primary-reverse px-5xl pt-lg" style={style}>
            <PillButton label={label} onPress={onPress} isDisabled={isDisabled} testID={testID} />
        </View>
    );
};
