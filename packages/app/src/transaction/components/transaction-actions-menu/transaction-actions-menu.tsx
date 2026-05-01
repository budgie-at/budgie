import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { GestureResponderEvent, View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PopoverMenu, PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useDeferredMenuClose } from '../../../@generic/hook/use-deferred-menu-close.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { TransactionActionsMenuContext } from '../../context/transaction-actions-menu.context';

import { TransactionActionsMenuSelector } from './transaction-actions-menu.selector';

import type { TransactionActionsMenuPropsInterface } from '../../interface/transaction-actions-menu-props.interface';

const TRIGGER_SIZE = 40;

export const TransactionActionsMenu = ({ onDelete, isConsolidated = false, children }: TransactionActionsMenuPropsInterface) => {
    const { t } = useLingui();
    const { isMenuOpen, closeMenu, handleCloseComplete, openMenu } = useDeferredMenuClose();
    const [anchor, setAnchor] = useState<PopoverMenuAnchor | undefined>();
    const deleteLabel = isConsolidated ? t`Unconsolidate Transaction` : t`Delete Transaction`;
    const confirmTitle = isConsolidated ? t`Unconsolidate transaction?` : t`Are you sure?`;
    const confirmMessage = isConsolidated
        ? t`Original imported transactions will be restored and the consolidated transaction will be removed.`
        : t`This action cannot be undone.`;
    const confirmText = isConsolidated ? t`Unconsolidate` : t`Delete`;
    const deleteIcon = isConsolidated ? UserIconNameEnum.GitPullRequestClosed : UserIconNameEnum.Trash2;

    const handleToggleMenu = (event: GestureResponderEvent) => {
        if (isMenuOpen) {
            closeMenu();

            return;
        }

        const { pageX, pageY } = event.nativeEvent;
        const hasValidAnchor = Number.isFinite(pageX) && Number.isFinite(pageY) && pageX > 0 && pageY > 0;

        if (hasValidAnchor) {
            const x = pageX - TRIGGER_SIZE / 2;
            const y = pageY - TRIGGER_SIZE / 2;

            setAnchor({ x, y, width: TRIGGER_SIZE, height: TRIGGER_SIZE });
        } else {
            setAnchor(void 0);
        }

        openMenu();
    };

    const handleDeletePress = () => {
        closeMenu(
            () =>
                void confirmAlert({
                    title: confirmTitle,
                    message: confirmMessage,
                    confirmText,
                    cancelText: t`Cancel`,
                    isDestructive: true
                }).then(confirmed => confirmed && onDelete())
        );
    };

    return (
        <View>
            <View collapsable={false}>
                <HapticPressable
                    className="mr-lg"
                    onPress={emptyFn}
                    onPressIn={handleToggleMenu}
                    testID={TransactionActionsMenuSelector.TriggerButton}
                    hitSlop={16}
                >
                    <CircleIcon icon={UserIconNameEnum.EllipsisVertical} variant="ghost" size={40} iconSize={24} border={false} />
                </HapticPressable>
            </View>

            <PopoverMenu isOpen={isMenuOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
                <TransactionActionsMenuContext.Provider value={closeMenu}>
                    <View className="py-sm">
                        {children}

                        <PopoverMenuItem
                            icon={deleteIcon}
                            label={deleteLabel}
                            onPress={handleDeletePress}
                            variant="destructive"
                            testID={TransactionActionsMenuSelector.DeleteButton}
                        />
                    </View>
                </TransactionActionsMenuContext.Provider>
            </PopoverMenu>
        </View>
    );
};
