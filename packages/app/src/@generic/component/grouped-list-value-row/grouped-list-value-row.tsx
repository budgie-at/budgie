import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { GroupedListIcon } from '../grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { Icon } from '../icon/icon';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly value: string;
    readonly testID?: string;
    readonly onPress?: () => void;
}

export const GroupedListValueRow = ({ icon, title, value, testID, onPress }: Props) => (
    <GroupedListRow
        left={<GroupedListIcon icon={icon} />}
        title={title}
        testID={testID}
        onPress={onPress}
        right={
            <View className="max-w-[60%] flex-row items-center gap-x-xs">
                <Text className="shrink text-[17px] text-secondary-foreground" numberOfLines={1}>
                    {value}
                </Text>
                <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
            </View>
        }
    />
);
