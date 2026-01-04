import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
}

export const RuleIconSlot = ({ icon }: Props) => (
    <View className="w-10 h-10 bg-secondary-background rounded-full items-center justify-center">
        <Icon icon={icon} className="text-primary" size={18} />
    </View>
);
