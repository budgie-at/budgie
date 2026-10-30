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
    readonly variant?: 'regular' | 'best' | 'suggested';
    readonly onPress: () => void;
}

export const CategorizeInboxOptionRow = ({ icon, title, subtitle, accessory, variant = 'regular', onPress }: Props) => {
    const isBest = variant === 'best';
    const isRegular = variant === 'regular';
    const iconVariant = isBest ? 'positive' : 'secondary';
    const surfaceClassName = isBest ? 'bg-positive-fill/12' : 'bg-secondary-background';
    const rowClassName = isRegular
        ? 'border-t-hairline border-secondary-corner flex-row items-center gap-x-xl py-lg'
        : `${surfaceClassName} flex-row items-center gap-x-xl rounded-2xl px-xl py-xl`;
    const subtitleClassName = isBest ? 'text-positive-foreground text-xs font-medium' : 'text-secondary-foreground text-xs';
    const titleClassName = isRegular ? 'text-primary text-md' : 'text-primary text-md font-semibold';
    const subtitleNode = isNotEmptyString(subtitle) ? <Text className={subtitleClassName}>{subtitle}</Text> : null;

    return (
        <HapticPressable
            onPress={onPress}
            className={rowClassName}
            accessibilityRole="button"
            {...testID(CategorizeInboxGroupScreenSelector.Option, title)}
        >
            <CircleIcon icon={icon} variant={iconVariant} size={36} iconSize={18} border={false} />
            <View className="flex-1 gap-y-xxs">
                <Text className={titleClassName} numberOfLines={2}>
                    {title}
                </Text>
                {subtitleNode}
            </View>
            {accessory}
        </HapticPressable>
    );
};
