import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly title: string;
    readonly value: string;
}

export const BudgetStartsOnRowContent = ({ title, value }: Props) => (
    <View className="min-h-[44px] flex-row items-center justify-between gap-x-md border-b-hairline border-secondary-corner py-md">
        <Text className="text-md text-primary">{title}</Text>
        <View className="shrink flex-row items-center gap-x-xs">
            <Text className="shrink text-md text-secondary-foreground" numberOfLines={1}>
                {value}
            </Text>
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </View>
    </View>
);
