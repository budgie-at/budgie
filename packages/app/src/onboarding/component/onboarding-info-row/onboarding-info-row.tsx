import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly text: string;
}

export const OnboardingInfoRow = ({ icon, text }: Props) => (
    <View className="flex-row items-start gap-x-md">
        <Icon icon={icon} size={16} className="text-secondary-foreground mt-xxs" />
        <Text className="text-primary text-sm flex-1">{text}</Text>
    </View>
);
