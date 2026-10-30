import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';

import type { UserIconType } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly variant: 'positive' | 'neutral';
    readonly title: string;
    readonly subtitle: ReactNode;
    readonly icon: UserIconType;
    readonly accessory: ReactNode;
    readonly onPress: () => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

const cardVariants = cva('overflow-hidden rounded-3xl bg-surface-row', {
    variants: { variant: { positive: 'border border-positive-action/30', neutral: '' } }
});

const discVariants = cva('', {
    variants: { variant: { positive: 'bg-positive-action/15', neutral: 'bg-secondary-foreground/15' } }
});

const iconVariants = cva('', {
    variants: { variant: { positive: 'text-positive-action', neutral: 'text-secondary-foreground' } }
});

export const CategorizeInboxLeadOption = ({ variant, title, subtitle, icon, accessory, onPress }: Props) => (
    <View className={cardVariants({ variant })} style={CONTINUOUS_CORNERS}>
        <HapticPressable
            onPress={onPress}
            className="min-h-[72px] flex-row items-center gap-x-xl px-3xl py-xl active:opacity-70"
            accessibilityRole="button"
            {...testID(CategorizeInboxGroupScreenSelector.Option, title)}
        >
            <CircleIcon
                icon={icon}
                variant="secondary"
                size={40}
                iconSize={20}
                radius={20}
                border={false}
                className={discVariants({ variant })}
                iconClassName={iconVariants({ variant })}
            />
            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text className="text-primary text-[17px] font-semibold" numberOfLines={2}>
                    {title}
                </Text>
                <Text className="text-secondary-foreground text-[13px]" numberOfLines={2}>
                    {subtitle}
                </Text>
            </View>
            {accessory}
        </HapticPressable>
    </View>
);
