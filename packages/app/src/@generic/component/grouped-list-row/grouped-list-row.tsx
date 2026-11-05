import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString, isString } from '@rnw-community/shared';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import type { ComponentProps, ReactElement, ReactNode } from 'react';
import type { GestureResponderEvent } from 'react-native';

interface Props {
    readonly title: string | ReactElement;
    readonly subtitle?: ReactNode;
    readonly left?: ReactNode;
    readonly right?: ReactNode;
    readonly titleTestID?: string;
    readonly testID?: string;
    readonly onPress?: (event: GestureResponderEvent) => void;
    readonly pressableProps?: Pick<
        ComponentProps<typeof HapticPressable>,
        | 'onLongPress'
        | 'disabled'
        | 'accessibilityLabel'
        | 'accessibilityHint'
        | 'accessibilityState'
        | 'accessibilityActions'
        | 'onAccessibilityAction'
    >;
}

export const GroupedListRow = (props: Props) => {
    const { title, subtitle, left, right, titleTestID, testID, onPress, pressableProps } = props;
    const isPressable = isDefined(onPress);
    const Container = isPressable ? HapticPressable : View;

    const chevron = isPressable ? <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" /> : null;
    const accessory = right ?? chevron;
    const subtitleNode = isNotEmptyString(subtitle) ? (
        <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={3}>
            {subtitle}
        </Text>
    ) : (
        subtitle
    );

    return (
        <Container
            onPress={onPress}
            {...pressableProps}
            className="min-h-[50px] flex-row items-center gap-x-xl px-3xl py-lg active:opacity-70"
            {...(isPressable && { accessibilityRole: 'button' as const })}
            testID={testID}
        >
            {left}
            <View className="min-w-0 flex-1 gap-y-xxs">
                {isString(title) ? (
                    <Text className="text-primary text-[17px]" numberOfLines={2} testID={titleTestID}>
                        {title}
                    </Text>
                ) : (
                    title
                )}
                {subtitleNode}
            </View>
            {accessory}
        </Container>
    );
};
