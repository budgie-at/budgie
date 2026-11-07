import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsLargeTextSize } from '../../hook/use-is-large-text-size.hook';
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
    const isStacked = useIsLargeTextSize();
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
    const contentClassName = isStacked ? 'gap-y-xxs' : 'flex-row items-center gap-x-sm gap-y-xxs';
    const valueClassName = isStacked
        ? 'text-[17px] text-secondary-foreground'
        : 'ml-auto max-w-[50%] shrink text-[17px] text-secondary-foreground';
    const valueLineCount = isStacked ? 2 : 1;

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={icon} />}
            title={
                <View className={contentClassName}>
                    <Text className="text-[17px] text-primary" numberOfLines={2} maxFontSizeMultiplier={2}>
                        {title}
                    </Text>
                    <Text className={valueClassName} numberOfLines={valueLineCount}>
                        {value}
                    </Text>
                </View>
            }
            testID={testID}
            onPress={onPress}
            pressableProps={pressableProps}
            right={accessory}
        />
    );
};
