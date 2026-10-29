import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';

import type { UserIconType } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly accessory: ReactNode;
    readonly onPress: () => void;
}

export const CategorizeInboxSecondaryOptionRow = ({ icon, title, accessory, onPress }: Props) => (
    <HapticPressable
        onPress={onPress}
        className="min-h-11 flex-row items-center gap-x-md py-sm"
        accessibilityRole="button"
        {...testID(CategorizeInboxGroupScreenSelector.Option, title)}
    >
        <Icon icon={icon} size={16} className="text-secondary-foreground" />
        <Text className="flex-1 text-sm text-primary" numberOfLines={1}>
            {title}
        </Text>
        {accessory}
    </HapticPressable>
);
