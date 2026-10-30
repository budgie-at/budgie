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
    readonly onPress: () => void;
}

export const CategorizeInboxOptionRow = ({ icon, title, subtitle, accessory, onPress }: Props) => {
    const subtitleNode = isNotEmptyString(subtitle) ? (
        <Text className="text-secondary-foreground text-[13px]" numberOfLines={1}>
            {subtitle}
        </Text>
    ) : null;

    return (
        <HapticPressable
            onPress={onPress}
            className="min-h-[60px] flex-row items-center gap-x-xl px-3xl py-xl active:opacity-70"
            accessibilityRole="button"
            {...testID(CategorizeInboxGroupScreenSelector.Option, title)}
        >
            <View className="absolute top-0 right-0 left-[64px] h-hairline bg-surface-separator" pointerEvents="none" />
            <CircleIcon
                icon={icon}
                variant="secondary"
                size={36}
                iconSize={18}
                radius={18}
                border={false}
                className="bg-secondary-foreground/15"
            />
            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text className="text-primary text-[17px]" numberOfLines={2}>
                    {title}
                </Text>
                {subtitleNode}
            </View>
            {accessory}
        </HapticPressable>
    );
};
