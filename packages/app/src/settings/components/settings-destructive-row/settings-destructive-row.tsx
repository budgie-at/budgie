import { UserIconType } from '@budgie/contracts';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GROUPED_LIST_TITLE_CLASS_NAME } from '../../../@generic/constant/grouped-list-title-class-name.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { SettingsRowAccessoryKindEnum } from '../../enum/settings-row-accessory-kind.enum';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRowIcon } from '../settings-row-icon/settings-row-icon';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly subtitle: string;
    readonly isLoading: boolean;
    readonly onPress: () => void;
    readonly testID: string;
}

export const SettingsDestructiveRow = ({ icon, title, subtitle, isLoading, onPress, testID }: Props) => (
    <GroupedListRow
        left={<SettingsRowIcon icon={icon} variant="destructive" discVariant="ghost" />}
        title={
            <Text className={cn('text-destructive-foreground', GROUPED_LIST_TITLE_CLASS_NAME)} numberOfLines={2}>
                {title}
            </Text>
        }
        subtitle={subtitle}
        right={<SettingsRowAccessory kind={SettingsRowAccessoryKindEnum.ACTION} isLoading={isLoading} />}
        onPress={onPress}
        testID={testID}
    />
);
