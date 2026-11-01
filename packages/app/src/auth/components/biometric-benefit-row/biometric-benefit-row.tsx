import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly text: string;
}

export const BiometricBenefitRow = ({ icon, text }: Props) => (
    <View className="flex-row items-center gap-x-xl">
        <Icon icon={icon} size={18} strokeWidth={1.75} className="text-secondary-foreground" />
        <Text className="text-sm text-primary flex-1">{text}</Text>
    </View>
);
