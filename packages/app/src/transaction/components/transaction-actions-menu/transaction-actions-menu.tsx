import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { GestureResponderEvent, View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PopoverMenu, PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { TransactionActionsMenuContext } from '../../context/transaction-actions-menu.context';

import { TransactionActionsMenuSelector } from './transaction-actions-menu.selector';

import type { TransactionActionsMenuPropsInterface } from '../../interface/transaction-actions-menu-props.interface';
import type { EmptyFn } from '@rnw-community/shared';

const TRIGGER_SIZE = 40;

export const TransactionActionsMenu = ({ onDelete, onRevert, isConsolidated = false, children }: TransactionActionsMenuPropsInterface) => {
    const { t } = useLingui();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchor, setAnchor] = useState<PopoverMenuAnchor | undefined>();
    const pendingActionRef = useRef<EmptyFn | null>(null);
    const actionLabel = isConsolidated ? t`Revert` : t`Delete Transaction`;
    const actionIcon = isConsolidated ? UserIconNameEnum.Undo2 : UserIconNameEnum.Trash2;
    const actionTestID = isConsolidated ? TransactionActionsMenuSelector.RevertButton : TransactionActionsMenuSelector.DeleteButton;

    const openMenu = () => {
        setIsMenuOpen(true);
    };

    const closeMenu = (afterClose?: EmptyFn) => {
        if (!isMenuOpen) {
            return;
        }

        pendingActionRef.current = afterClose ?? null;
        setIsMenuOpen(false);
    };

    const handleCloseComplete = () => {
        if (isDefined(pendingActionRef.current)) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }
    };

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

    const handleActionPress = () => {
        if (isConsolidated) {
            closeMenu(() => {
                onRevert?.();
            });

            return;
        }

        closeMenu(() => {
            void onDelete();
        });
    };

    const showAction = !isConsolidated || isDefined(onRevert);

    return (
        <View>
            <View collapsable={false} testID={TransactionActionsMenuSelector.TriggerButton}>
                <HapticPressable className="mr-lg" onPress={emptyFn} onPressIn={handleToggleMenu} hitSlop={16}>
                    <CircleIcon icon={UserIconNameEnum.EllipsisVertical} variant="ghost" size={40} iconSize={24} border={false} />
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
