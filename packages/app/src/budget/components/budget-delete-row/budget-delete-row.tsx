import { Text } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly title: string;
    readonly testID: string;
    readonly onDelete: () => unknown;
}

export const BudgetDeleteRow = ({ title, testID, onDelete }: Props) => {
    const handlePress = () => void onDelete();

    return (
        <GroupedListSection>
            <HapticPressable
                accessibilityRole="button"
                className="min-h-[50px] items-center justify-center px-3xl py-lg active:opacity-70"
                testID={testID}
                onPress={handlePress}
            >
                <Text className="text-destructive-strong text-[17px]" numberOfLines={2}>
                    {title}
                </Text>
            </HapticPressable>
        </GroupedListSection>
    );
};
