import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';

import type { UserIconType } from '@budgie/contracts';
import type { ReactNode } from 'react';
import type { AccessibilityState } from 'react-native';

interface Props {
    readonly title: string;
    readonly subtitle: string;
    readonly icon: UserIconType;
    readonly accessory: ReactNode;
    readonly accessibilityState?: AccessibilityState;
    readonly onPress: () => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

const titleVariants = cva('text-primary text-[17px]', {
    variants: { isSelected: { true: 'font-semibold', false: 'font-normal' } }
});

export const CategorizeInboxLeadRow = ({ title, subtitle, icon, accessory, accessibilityState, onPress }: Props) => {
    const titleClassName = titleVariants({ isSelected: accessibilityState?.selected === true });

    return (
        <View className="overflow-hidden rounded-3xl bg-surface-row" style={CONTINUOUS_CORNERS}>
            <HapticPressable
                onPress={onPress}
                className="min-h-[72px] flex-row items-center gap-x-md px-3xl py-xl active:opacity-70"
                accessibilityRole="button"
                accessibilityState={accessibilityState}
                {...testID(CategorizeInboxGroupScreenSelector.Option, title)}
            >
                <CircleIcon
                    icon={icon}
                    variant="secondary"
                    size={40}
                    iconSize={20}
                    radius={20}
                    border={false}
                    className="bg-surface-disc"
                    iconClassName="text-secondary-foreground"
                />
                <View className="min-w-0 flex-1 gap-y-xxs">
                    <Text className={titleClassName} numberOfLines={2}>
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
};
