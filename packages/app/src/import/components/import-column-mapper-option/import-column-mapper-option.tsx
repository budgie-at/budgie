import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly header: string;
    readonly isSelected: boolean;
    readonly onSelect: () => void;
    readonly testID?: string;
}

export const ImportColumnMapperOption = ({ header, isSelected, onSelect, testID }: Props) => (
    <GroupedListRow
        title={
            <Text className="text-primary text-[17px]" numberOfLines={1} ellipsizeMode="tail">
                {header}
            </Text>
        }
        onPress={onSelect}
        testID={testID}
        right={
            <View className="size-5">{isSelected ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : null}</View>
        }
    />
);
