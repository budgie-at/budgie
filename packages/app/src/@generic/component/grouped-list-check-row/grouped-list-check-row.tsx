import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { Icon } from '../icon/icon';

interface Props {
    readonly title: string;
    readonly isSelected: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const GroupedListCheckRow = ({ title, isSelected, onPress, testID }: Props) => {
    const pressableProps = { accessibilityState: { selected: isSelected } };

    return (
        <GroupedListRow
            title={<Text className="text-primary text-[17px]">{title}</Text>}
            onPress={onPress}
            testID={testID}
            pressableProps={pressableProps}
            right={
                <View className="size-5">
                    {isSelected ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : null}
                </View>
            }
        />
    );
};
