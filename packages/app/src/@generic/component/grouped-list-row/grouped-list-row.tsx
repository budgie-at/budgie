import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useDeletableRowDelete } from '../../context/deletable-row.context';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import type { ReactNode } from 'react';
import type { AccessibilityActionEvent } from 'react-native';

interface Props {
    readonly title: string;
    readonly subtitle?: ReactNode;
    readonly left?: ReactNode;
    readonly right?: ReactNode;
    readonly titleClassName?: string;
    readonly titleTestID?: string;
    readonly testID?: string;
    readonly onPress?: () => void;
}

export const GroupedListRow = (props: Props) => {
    const { title, subtitle, left, right, titleClassName, titleTestID, testID, onPress } = props;
    const { t } = useLingui();
    const deleteRow = useDeletableRowDelete();
    const isPressable = isDefined(onPress);
    const Container = isPressable ? HapticPressable : View;

    const chevron = isPressable ? <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" /> : null;
    const accessory = right ?? chevron;
    const separatorClassName = isDefined(left) ? 'left-[64px]' : 'left-[16px]';
    const subtitleNode = isNotEmptyString(subtitle) ? (
        <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={3}>
            {subtitle}
        </Text>
    ) : (
        subtitle
    );

    const deleteAccessibility = isDefined(deleteRow) && {
        accessibilityActions: [{ name: 'delete', label: t`Delete` }],
        onAccessibilityAction: (event: AccessibilityActionEvent) => {
            if (event.nativeEvent.actionName === 'delete') {
                deleteRow();
            }
        }
    };

    return (
        <Container
            onPress={onPress}
            className="min-h-[50px] flex-row items-center gap-x-xl px-3xl py-lg active:opacity-70"
            {...(isPressable && { accessibilityRole: 'button' as const })}
            {...deleteAccessibility}
            testID={testID}
        >
            <View className={cn('absolute top-0 right-0 h-hairline bg-surface-separator', separatorClassName)} pointerEvents="none" />
            {left}
            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text className={cn('text-primary text-[17px]', titleClassName)} numberOfLines={2} testID={titleTestID}>
                    {title}
                </Text>
                {subtitleNode}
            </View>
            {accessory}
        </Container>
    );
};
