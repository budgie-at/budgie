import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly title: string;
    readonly onGoBack: EmptyFn;
    readonly className?: string;
    readonly description: string;
}
export const CreateAccountHeader = ({ className, title, description, onGoBack }: Props) => (
    <View className={cn('px-5xl flex-row items-center gap-x-xl pb-7xl border-b border-b-secondary-corner', className)}>
        <HapticPressable onPress={onGoBack} className="p-md">
            <Icon className="text-secondary-foreground" size={24} icon={ICONS.ChevronLeft} />
        </HapticPressable>

        <View className="gap-y-xs">
            <Text className="text-primary font-semibold text-3xl">{title}</Text>
            <Text className="text-secondary-foreground text-xs">{description}</Text>
        </View>
    </View>
);
