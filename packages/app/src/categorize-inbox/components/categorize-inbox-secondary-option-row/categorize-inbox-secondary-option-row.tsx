import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
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
        className="border-t-hairline border-secondary-corner flex-row items-center gap-x-xl py-lg"
        accessibilityRole="button"
        {...testID(CategorizeInboxGroupScreenSelector.Option, title)}
    >
        <CircleIcon icon={icon} variant="secondary" size={36} iconSize={18} border={false} />
        <Text className="flex-1 text-md text-primary" numberOfLines={1}>
            {title}
        </Text>
        {accessory}
    </HapticPressable>
);
