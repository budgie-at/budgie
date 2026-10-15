import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly iconClassName: string;
    readonly title: string;
    readonly description: string;
    readonly onPress: EmptyFn;
    readonly testID: string;
}

export const OnboardingSourceRow = ({ icon, iconClassName, title, description, onPress, testID }: Props) => (
    <HapticPressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        className="flex-row items-start gap-x-xl rounded-3xl bg-background px-2xl py-xl active:scale-xs"
    >
        <Icon icon={icon} size={18} className={iconClassName} />

        <View className="flex-1">
            <Text className="text-primary text-md font-medium">{title}</Text>
            <Text className="text-secondary-foreground text-xs">{description}</Text>
        </View>
    </HapticPressable>
);
