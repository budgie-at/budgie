import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString, isString } from '@rnw-community/shared';

import { GROUPED_LIST_SUBTITLE_CLASSNAME } from '../../constant/grouped-list-subtitle-class-name.constant';
import { GROUPED_LIST_TITLE_CLASS_NAME } from '../../constant/grouped-list-title-class-name.constant';
import { useIsAccessibilityTextSize } from '../../hook/use-is-accessibility-text-size.hook';
import { cn } from '../../utils/cn.util';
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
        | 'style'
        | 'accessible'
        | 'accessibilityRole'
        | 'onLongPress'
        | 'disabled'
        | 'pressFeedback'
        | 'accessibilityLabel'
        | 'accessibilityHint'
        | 'accessibilityState'
        | 'accessibilityActions'
        | 'onAccessibilityAction'
    >;
}

const DEFAULT_TEXT_LAYOUT = {
    rowClassName: 'items-center',
    leftClassName: '',
    contentClassName: '',
    textClassName: 'min-w-0 flex-1',
    accessoryClassName: 'max-w-[40%] shrink',
    titleLines: 2,
    subtitleLines: 3
} as const;

const ACCESSIBILITY_TEXT_LAYOUT = {
    rowClassName: 'items-start',
    leftClassName: 'pt-[4px]',
    contentClassName: 'flex-wrap gap-y-xs',
    textClassName: 'min-w-[210px] grow basis-[210px]',
    accessoryClassName: 'max-w-full',
    titleLines: 3,
    subtitleLines: 4
} as const;

export const GroupedListRow = (props: Props) => {
    const { title, subtitle, left, right, titleTestID, testID, onPress, pressableProps } = props;
    const isPressable = isDefined(onPress);
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const layout = isAccessibilityTextSize ? ACCESSIBILITY_TEXT_LAYOUT : DEFAULT_TEXT_LAYOUT;
    const Container = isPressable ? HapticPressable : View;

    const chevron = isPressable ? <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" /> : null;
    const accessory = right ?? chevron;
    const accessoryNode = isDefined(accessory) ? <View className={layout.accessoryClassName}>{accessory}</View> : null;
    const separatorClassName = isDefined(left) ? 'left-[64px]' : 'left-[16px]';
    const subtitleNode = isNotEmptyString(subtitle) ? (
        <Text
            className={cn('text-secondary-foreground', GROUPED_LIST_SUBTITLE_CLASSNAME)}
            numberOfLines={layout.subtitleLines}
            maxFontSizeMultiplier={2}
        >
            {subtitle}
        </Text>
    ) : (
        subtitle
    );

    return (
        <Container
            onPress={onPress}
            {...(isPressable && { accessibilityRole: 'button' as const })}
            {...pressableProps}
            className={cn('min-h-[50px] flex-row gap-x-xl px-3xl py-lg active:opacity-70', layout.rowClassName)}
            {...(isPressable && { pressedScale: 1 })}
            testID={testID}
        >
            <View className={cn('absolute top-0 right-0 h-hairline bg-surface-separator', separatorClassName)} pointerEvents="none" />
            <View className={layout.leftClassName}>{left}</View>
            <View className={cn('min-w-0 flex-1 flex-row items-center gap-x-xl', layout.contentClassName)}>
                <View className={cn('gap-y-xxs', layout.textClassName)}>
                    {isString(title) ? (
                        <Text
                            className={cn('text-primary', GROUPED_LIST_TITLE_CLASS_NAME)}
                            numberOfLines={layout.titleLines}
                            maxFontSizeMultiplier={2}
                            testID={titleTestID}
                        >
                            {title}
                        </Text>
                    ) : (
                        title
                    )}
                    {subtitleNode}
                </View>
                {accessoryNode}
            </View>
        </Container>
    );
};
