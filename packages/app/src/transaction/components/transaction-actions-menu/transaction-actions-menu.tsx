import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode, createContext, use, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { EmptyFn, emptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PopoverMenu, PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';

type CloseMenuFn = (afterClose?: EmptyFn) => void;

const TransactionActionsMenuContext = createContext<CloseMenuFn>(emptyFn);

export const useTransactionActionsMenu = () => use(TransactionActionsMenuContext);

interface Props {
    readonly onDelete: () => Promise<void> | void;
    readonly children?: ReactNode;
}

export const TransactionActionsMenu = ({ onDelete, children }: Props) => {
    const { t } = useLingui();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchor, setAnchor] = useState<PopoverMenuAnchor>({ x: 0, y: 0, width: 0, height: 0 });
    const triggerRef = useRef<View>(null);
    const pendingActionRef = useRef<EmptyFn | null>(null);

    const handleToggleMenu = () => {
        if (isMenuOpen) {
            setIsMenuOpen(false);

            return;
        }

        triggerRef.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            setIsMenuOpen(true);
        });
    };

    const handleCloseMenu: CloseMenuFn = (afterClose?: EmptyFn) => {
        pendingActionRef.current = afterClose ?? null;
        setIsMenuOpen(false);
    };

    const handleCloseComplete = () => {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        action?.();
    };

    const handleDeletePress = () => {
        handleCloseMenu();

        void Alert.alert(t`Are you sure?`, t`This action cannot be undone.`, [
            {
                text: t`Delete`,
                onPress: () => void onDelete(),
                style: 'destructive'
            },
            {
                text: t`Cancel`,
                style: 'cancel'
            }
        ]);
    };

    return (
        <View>
            <View ref={triggerRef} collapsable={false}>
                <HapticPressable onPress={handleToggleMenu}>
                    <CircleIcon icon={UserIconNameEnum.EllipsisVertical} variant="ghost" size={40} iconSize={24} border={false} />
                </HapticPressable>
            </View>

            <PopoverMenu isOpen={isMenuOpen} onClose={handleCloseMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
                <TransactionActionsMenuContext.Provider value={handleCloseMenu}>
                    <View className="py-sm">
                        {children}

                        <PopoverMenuItem
                            icon={UserIconNameEnum.Trash2}
                            label={t`Delete Transaction`}
                            onPress={handleDeletePress}
                            variant="destructive"
                        />
                    </View>
                </TransactionActionsMenuContext.Provider>
            </PopoverMenu>
        </View>
    );
};
