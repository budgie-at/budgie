import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly delay: number;
    readonly animationDuration: number;
}

export const RecurringCalendarEmptyStateHint = ({ icon, label, delay, animationDuration }: Props) => (
    <Animated.View entering={FadeInUp.delay(delay).duration(animationDuration)} className="items-center gap-y-sm">
        <Icon icon={icon} size={18} className="text-secondary-foreground/50" />
        <Text className="text-xxs text-secondary-foreground/50">{label}</Text>
    </Animated.View>
);
