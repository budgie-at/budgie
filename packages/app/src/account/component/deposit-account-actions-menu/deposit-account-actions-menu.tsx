import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';

import { DepositAccountActionsMenuSelector } from './deposit-account-actions-menu.selector';
import { useDepositAccountActionsMenu } from './use-deposit-account-actions-menu.hook';
import { useDepositCloseAction } from './use-deposit-close-action.hook';

interface Props {
    readonly accountId: number;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const DepositAccountActionsMenu = ({ accountId, balance, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const closeAction = useDepositCloseAction(accountId, balance, instrumentSymbol);
    const menu = useDepositAccountActionsMenu(accountId, closeAction.handleCloseDeposit);

    return (
        <View>
            <View collapsable={false} testID={DepositAccountActionsMenuSelector.TriggerButton}>
                <HapticPressable
                    className="ml-auto h-10 w-10 items-center justify-center"
                    onPress={menu.handleToggleMenu}
                    hitSlop={16}
                    disabled={closeAction.isLoading}
                    accessibilityRole="button"
                    nativeID={DepositAccountActionsMenuSelector.TriggerButton}
                >
                    <CircleIcon icon={UserIconNameEnum.EllipsisVertical} variant="ghost" size={40} iconSize={24} border={false} />
                </HapticPressable>
            </View>

            <PopoverMenu isOpen={menu.isMenuOpen} onClose={menu.closeMenu} onCloseComplete={menu.handleCloseComplete} anchor={menu.anchor}>
                <View className="py-sm">
                    <PopoverMenuItem
                        icon={UserIconNameEnum.Pencil}
                        label={t`Edit`}
                        onPress={menu.handleEditPress}
                        testID={DepositAccountActionsMenuSelector.EditButton}
                    />
                    <PopoverMenuItem
                        icon={UserIconNameEnum.LogOut}
                        label={t`Close Deposit`}
                        onPress={menu.handleCloseDepositPress}
                        variant="destructive"
                        testID={DepositAccountActionsMenuSelector.CloseDepositButton}
                    />
                </View>
            </PopoverMenu>
        </View>
    );
};
