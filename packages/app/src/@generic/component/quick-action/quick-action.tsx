import { Text, View } from 'react-native';

import { IconName } from '../../constant/icons.constant';
import { Card } from '../card/card';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly icon: IconName;
    readonly title: string;
    readonly description: string;
    readonly onPress: () => void;
}

export const QuickAction = ({ icon, title, description, onPress }: Props) => (
    <HapticPressable onPress={onPress}>
        <Card className="flex-row items-center gap-3" size="sm">
            <View className="rounded-xl bg-primary p-2">
                <Icon className="text-primary-reverse" icon={icon} size={20} />
            </View>
            <View className="flex-1">
                <Text className="text-sm font-medium text-primary">{title}</Text>
                <Text className="text-xs text-secondary-foreground">{description}</Text>
            </View>
            <Icon className="text-secondary-foreground" icon="ChevronRight" size={16} />
        </Card>
    </HapticPressable>
);

