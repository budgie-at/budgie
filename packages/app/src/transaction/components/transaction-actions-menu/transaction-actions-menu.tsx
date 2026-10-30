import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { GestureResponderEvent, View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { PopoverMenu, PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { TransactionActionsMenuContext } from '../../context/transaction-actions-menu.context';
import { useTransactionListContextMenuClose } from '../../hook/use-transaction-list-context-menu-close.hook';

import { TransactionActionsMenuSelector } from './transaction-actions-menu.selector';

import type { TransactionActionsMenuPropsInterface } from '../../interface/transaction-actions-menu-props.interface';

const TRIGGER_SIZE = 44;

export const TransactionActionsMenu = ({ onDelete, onRevert, isConsolidated = false, children }: TransactionActionsMenuPropsInterface) => {
    const { t } = useLingui();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchor, setAnchor] = useState<PopoverMenuAnchor | undefined>();
    const actionLabel = isConsolidated ? t`Revert` : t`Delete Transaction`;
    const actionIcon = isConsolidated ? UserIconNameEnum.Undo2 : UserIconNameEnum.Trash2;
    const actionTestID = isConsolidated ? TransactionActionsMenuSelector.RevertButton : TransactionActionsMenuSelector.DeleteButton;

    const handleClose = () => {
        setIsMenuOpen(false);
    };

    const { closeMenu, handleCloseComplete } = useTransactionListContextMenuClose({ isOpen: isMenuOpen, onClose: handleClose });

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

        setIsMenuOpen(true);
    };

    const handleActionPress = () => {
        closeMenu(() => {
            if (isConsolidated) {
                onRevert?.();
            } else {
                void onDelete?.();
            }
        });
    };

    const showAction = isConsolidated ? isDefined(onRevert) : isDefined(onDelete);

    return (
        <View>
            <View collapsable={false} testID={TransactionActionsMenuSelector.TriggerButton}>
                <HapticPressable
                    accessibilityRole="button"
                    accessibilityLabel={t`More actions`}
                    className="min-h-[44px] min-w-[44px] items-center justify-center active:scale-100 active:opacity-70"
                    onPress={emptyFn}
                    onPressIn={handleToggleMenu}
                    hitSlop={16}
                >
                    <CircleIcon icon={UserIconNameEnum.Ellipsis} variant="ghost" size={44} iconSize={24} border={false} />
                </HapticPressable>
            </View>

            <PopoverMenu isOpen={isMenuOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
                <TransactionActionsMenuContext.Provider value={closeMenu}>
                    <View className="py-sm">
                        {children}

                        {showAction ? (
                            <PopoverMenuItem
                                icon={actionIcon}
                                label={actionLabel}
                                onPress={handleActionPress}
                                variant="destructive"
                                testID={actionTestID}
                            />
                        ) : null}
                    </View>
                </TransactionActionsMenuContext.Provider>
            </PopoverMenu>
        </View>
    );
};
