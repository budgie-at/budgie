import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';

interface Props {
    readonly title: string;
    readonly testID: string;
    readonly onDelete: () => unknown;
}

export const BudgetDeleteRow = ({ title, testID, onDelete }: Props) => {
    const handlePress = () => void onDelete();

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
            />
        </GroupedListSection>
    );
};
