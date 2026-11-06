import { UserIconType } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GROUPED_LIST_TITLE_CLASS_NAME } from '../../../@generic/constant/grouped-list-title-class-name.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { SettingsRowIcon } from '../settings-row-icon/settings-row-icon';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly subtitle: string;
    readonly testID: string;
}

export const SettingsDisabledRow = ({ icon, title, subtitle, testID }: Props) => (
    <GroupedListRow
        left={
            <View className="opacity-50">
                <SettingsRowIcon icon={icon} variant="ghost" />
            </View>
        }
        title={
            <Text className={cn('text-secondary-foreground', GROUPED_LIST_TITLE_CLASS_NAME)} numberOfLines={2}>
                {title}
            </Text>
        }
        subtitle={subtitle}
        pressableProps={{ accessible: true, accessibilityLabel: `${title}, ${subtitle}`, accessibilityState: { disabled: true } }}
        testID={testID}
    />
);
