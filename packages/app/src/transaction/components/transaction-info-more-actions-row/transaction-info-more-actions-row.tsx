import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { ActionsMenuContext } from '../../../@generic/context/actions-menu.context';
import { usePopoverMenuAnchor } from '../../../@generic/hook/use-popover-menu-anchor.hook';
import { TransactionInfoActionLabel } from '../transaction-info-action-label/transaction-info-action-label';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';

interface Props {
    readonly items: readonly TransactionActionsMenuItemInterface[];
}

export const TransactionInfoMoreActionsRow = ({ items }: Props) => {
    const { t } = useLingui();
    const { anchor, frameRef, closeMenu, handleCloseComplete, handleToggleMenu, isMenuOpen } = usePopoverMenuAnchor();
    const { height } = useWindowDimensions();
    const { top } = useSafeAreaInsets();
    const menuContentStyle = { maxHeight: Math.max(44, (anchor?.y ?? height) - top - 16) };
    const label = t`More Actions…`;

    return (
        <View ref={frameRef} collapsable={false}>
            <HapticPressable
                className="active:scale-100 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={handleToggleMenu}
                testID={TransactionInfoPageSelector.ConvertButton}
            >
                <TransactionInfoActionLabel icon={UserIconNameEnum.CircleEllipsis} label={label}>
                    <Icon icon={UserIconNameEnum.ChevronRight} size={20} className="text-secondary-foreground" />
                </TransactionInfoActionLabel>
            </HapticPressable>

            <PopoverMenu isOpen={isMenuOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor} placement="top">
                <ActionsMenuContext value={closeMenu}>
                    <ScrollView className="min-w-[280px] py-sm" style={menuContentStyle} bounces={false}>
                        {items.map(item => (
                            <ActionsMenuItem
                                key={item.key}
                                icon={item.icon}
                                label={item.label}
                                subtitle={item.consequence}
                                onPress={item.onPress}
                                testID={item.testID}
                            />
                        ))}
                    </ScrollView>
                </ActionsMenuContext>
            </PopoverMenu>
        </View>
    );
};
