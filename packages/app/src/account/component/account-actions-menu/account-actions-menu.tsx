import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useArchiveAccount } from '../../hooks/use-archive-account.hook';

import { useAccountActionsMenu } from './use-account-actions-menu.hook';
import { useDepositCloseAction } from './use-deposit-close-action.hook';

interface Props {
    readonly accountId: number;
    readonly accountType: AccountTypeEnum;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const AccountActionsMenu = ({ accountId, accountType, balance, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const closeAction = useDepositCloseAction(accountId, balance, instrumentSymbol);
    const archiveAction = useArchiveAccount(accountId, () => void dismissAllOrReplace('/'));
    const menu = useAccountActionsMenu(accountId, closeAction.handleCloseDeposit, () => void archiveAction.handleArchive());
    const isActionLoading = closeAction.isLoading || archiveAction.isLoading;

    const typeSpecificItem =
        accountType === AccountTypeEnum.DEPOSIT ? (
            <PopoverMenuItem
                icon={UserIconNameEnum.LogOut}
                label={t`Close Deposit`}
                onPress={menu.handleCloseDepositPress}
                variant="destructive"
                testID={AccountDetailsSelector.CloseDepositButton}
            />
        ) : (
            <PopoverMenuItem
                icon={UserIconNameEnum.Archive}
                label={t`Archive`}
                onPress={menu.handleArchivePress}
                testID={AccountDetailsSelector.ArchiveMenuButton}
            />
        );

    return (
        <View>
            <View collapsable={false} testID={AccountDetailsSelector.ActionsButton}>
                <HapticPressable
                    className="ml-auto h-10 w-10 items-center justify-center"
                    onPress={menu.handleToggleMenu}
                    hitSlop={16}
                    disabled={isActionLoading}
                    accessibilityRole="button"
                    accessibilityLabel={t`Account actions`}
                    nativeID={AccountDetailsSelector.ActionsButton}
                >
                    <Icon icon={UserIconNameEnum.EllipsisVertical} className="text-primary" size={24} />
                </HapticPressable>
            </View>

            <PopoverMenu isOpen={menu.isMenuOpen} onClose={menu.closeMenu} onCloseComplete={menu.handleCloseComplete} anchor={menu.anchor}>
                <View className="py-sm">
                    <PopoverMenuItem
                        icon={UserIconNameEnum.Pencil}
                        label={t`Edit account`}
                        onPress={menu.handleEditPress}
                        testID={AccountDetailsSelector.EditButton}
                    />
                    {typeSpecificItem}
                </View>
            </PopoverMenu>
        </View>
    );
};
