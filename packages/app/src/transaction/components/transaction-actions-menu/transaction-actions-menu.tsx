import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode, createContext, use, useState } from 'react';
import { GestureResponderEvent, View } from 'react-native';

import { EmptyFn, emptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PopoverMenu, PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useDeferredMenuClose } from '../../../@generic/hook/use-deferred-menu-close.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';

import { TransactionActionsMenuSelector } from './transaction-actions-menu.selector';

type CloseMenuFn = (afterClose?: EmptyFn) => void;

const TransactionActionsMenuContext = createContext<CloseMenuFn>(emptyFn);
const TRIGGER_SIZE = 40;

export const useTransactionActionsMenu = () => use(TransactionActionsMenuContext);

interface Props {
    readonly onDelete: () => Promise<void> | void;
    readonly children?: ReactNode;
}

export const TransactionActionsMenu = ({ onDelete, children }: Props) => {
    const { t } = useLingui();
    const { isMenuOpen, closeMenu, handleCloseComplete, openMenu } = useDeferredMenuClose();
    const [anchor, setAnchor] = useState<PopoverMenuAnchor | undefined>();

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
                    title: t`Are you sure?`,
                    message: t`This action cannot be undone.`,
                    confirmText: t`Delete`,
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
                            icon={UserIconNameEnum.Trash2}
                            label={t`Delete Transaction`}
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
