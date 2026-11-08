import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';

interface Props {
    readonly title: string;
    readonly testID: string;
    readonly onDelete: () => unknown;
    readonly isDisabled?: boolean;
}

export const BudgetDeleteRow = ({ title, testID, onDelete, isDisabled = false }: Props) => {
    const handlePress = () => void onDelete();
    const pressableProps = { disabled: isDisabled, accessibilityState: { disabled: isDisabled } };

    return (
        <GroupedListSection>
            <GroupedListRow
                title={
                    <Text className="text-destructive-strong text-[17px]" numberOfLines={2}>
                        {title}
                    </Text>
                }
                testID={testID}
                onPress={handlePress}
                pressableProps={pressableProps}
            />
        </GroupedListSection>
    );
};
