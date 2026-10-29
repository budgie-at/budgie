import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';

import type { UserIconType } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly subtitle?: string;
    readonly accessory?: ReactNode;
    readonly isLead?: boolean;
    readonly onPress: () => void;
}

export const CategorizeInboxOptionRow = ({ icon, title, subtitle, accessory, isLead = false, onPress }: Props) => {
    const iconVariant = isLead ? 'positive' : 'secondary';
    const subtitleNode = isNotEmptyString(subtitle) ? <Text className="text-secondary-foreground text-xs">{subtitle}</Text> : null;

    return (
        <HapticPressable
            onPress={onPress}
            className="border-t-hairline border-secondary-corner flex-row items-center gap-x-xl py-lg"
            accessibilityRole="button"
            {...testID(CategorizeInboxGroupScreenSelector.Option, title)}
        >
            <CircleIcon icon={icon} variant={iconVariant} size={36} iconSize={18} border={false} />
            <View className="flex-1 gap-y-xxs">
                <Text className="text-primary text-md font-semibold" numberOfLines={2}>
                    {title}
                </Text>
                {subtitleNode}
            </View>
            {accessory}
        </HapticPressable>
    );
};
