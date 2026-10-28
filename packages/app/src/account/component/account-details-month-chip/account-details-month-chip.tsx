import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly iconClassName: string;
    readonly label: string;
    readonly amount: string;
}

export const AccountDetailsMonthChip = ({ icon, iconClassName, label, amount }: Props) => (
    <View className="flex-row items-center gap-x-xs rounded-full bg-secondary-background border border-secondary-corner px-md py-xs">
        <Icon icon={icon} size={14} className={iconClassName} />
        <Text className="text-secondary-foreground text-xs">{label}</Text>
        <Text className="text-primary text-xs font-medium">{amount}</Text>
    </View>
);
