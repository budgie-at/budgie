import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly title: string;
    readonly description: string;
}

export const AccountCardContent = ({ title, description }: Props) => (
    <>
        <View className="flex-1">
            <Text className="text-primary text-md font-medium mb-xs">{title}</Text>
            <Text className="text-secondary-foreground text-sm">{description}</Text>
        </View>

        <Icon className="text-primary/40" icon={ICONS.ChevronRight} />
    </>
);
