import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import type { UserIconType } from '@budgie/contracts';
import type { AccessibilityActionEvent } from 'react-native';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly value: string;
    readonly testID?: string;
    readonly onPress?: () => void;
    readonly onClear?: () => void;
}

const CLEAR_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

export const GroupedListValueRow = ({ icon, title, value, testID, onPress, onClear }: Props) => {
    const { t } = useLingui();
    const accessibilityActions = isDefined(onClear) ? [{ name: 'clear', label: t`Clear ${title}` }] : [];
    const onAccessibilityAction = (event: AccessibilityActionEvent) => {
        if (event.nativeEvent.actionName === 'clear') {
            onClear?.();
        }
    };
    const pressableProps = { accessibilityActions, onAccessibilityAction };
    const accessory = isDefined(onClear) ? (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={t`Clear ${title}`}
            hitSlop={CLEAR_HIT_SLOP}
            className="active:opacity-70"
            onPress={onClear}
        >
            <Icon icon={UserIconNameEnum.CircleX} size={18} className="text-secondary-foreground" />
        </HapticPressable>
    ) : (
        <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
    );

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={icon} />}
            title={title}
            testID={testID}
            onPress={onPress}
            pressableProps={pressableProps}
            right={
                <View className="max-w-[60%] flex-row items-center gap-x-sm">
                    <Text className="shrink text-[17px] text-secondary-foreground" numberOfLines={1}>
                        {value}
                    </Text>
                    {accessory}
                </View>
            }
        />
    );
};
