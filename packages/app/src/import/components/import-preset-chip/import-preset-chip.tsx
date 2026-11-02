import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly title: string;
    readonly testID?: string;
    readonly isSelected: boolean;
    readonly onSelect: () => void;
}

export const ImportPresetChip = ({ title, isSelected, onSelect, testID }: Props) => (
    <GroupedListRow
        title={title}
        onPress={onSelect}
        testID={testID}
        right={
            <View className="size-5">{isSelected ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : null}</View>
        }
    />
);
