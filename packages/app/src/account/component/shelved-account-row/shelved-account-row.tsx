import { AccountEntityInterface, isEmojiIcon } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { ActionsMenuContext } from '../../../@generic/context/actions-menu.context';
import { usePopoverMenuAnchor } from '../../../@generic/hook/use-popover-menu-anchor.hook';
import { cn } from '../../../@generic/utils/cn.util';

import type { ShelvedAccountAccessibilityActionInterface } from '../../interface/shelved-account-accessibility-action.interface';
import type { ReactNode } from 'react';
import type { AccessibilityActionEvent } from 'react-native';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'icon' | 'title'>;
    readonly subtitle: ReactNode;
    readonly trailing: ReactNode;
    readonly accessibilityLabel: string;
    readonly accessibilityActions: ShelvedAccountAccessibilityActionInterface[];
    readonly testID: string;
    readonly onPress?: () => void;
    readonly children: ReactNode;
}

export const ShelvedAccountRow = ({
    account,
    subtitle,
    trailing,
    accessibilityLabel,
    accessibilityActions,
    testID,
    onPress,
    children
}: Props) => {
    const { anchor, frameRef, closeMenu, handleCloseComplete, handleToggleMenu, isMenuOpen } = usePopoverMenuAnchor();

    const iconSize = isEmojiIcon(account.icon) ? 22 : 18;
    const handlePress = onPress ?? handleToggleMenu;
    const handleAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) =>
        void accessibilityActions.find(action => action.name === nativeEvent.actionName)?.onPress();
    const pressableProps = {
        onLongPress: handleToggleMenu,
        accessibilityLabel,
        accessibilityActions: accessibilityActions.map(({ name, label }) => ({ name, label })),
        onAccessibilityAction: handleAccessibilityAction
    };

    return (
        <View ref={frameRef} className={cn(isMenuOpen && 'bg-surface-fill')}>
            <GroupedListRow
                testID={testID}
                left={
                    <View
                        className="min-h-[42px] justify-center"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        <CircleIcon
                            icon={account.icon}
                            variant="secondary"
                            size={36}
                            iconSize={iconSize}
                            radius={18}
                            border={false}
                            className={TONAL_DISC_BACKGROUND.secondary}
                        />
                    </View>
                }
                title={
                    <Text className="text-primary text-[17px]" numberOfLines={2}>
                        {account.title}
                    </Text>
                }
                subtitle={subtitle}
                right={trailing}
                pressableProps={pressableProps}
                onPress={handlePress}
            />
            <PopoverMenu isOpen={isMenuOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor} align="start">
                <ActionsMenuContext value={closeMenu}>
                    <View className="py-sm">{children}</View>
                </ActionsMenuContext>
            </PopoverMenu>
        </View>
    );
};
