import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { TransactionActionsMenuContext } from '../../context/transaction-actions-menu.context';
import { useTransactionListContextMenuClose } from '../../hook/use-transaction-list-context-menu-close.hook';
import { TransactionConvertMenuItem } from '../transaction-convert-menu-item/transaction-convert-menu-item';
import { TransactionInfoActionLabel } from '../transaction-info-action-label/transaction-info-action-label';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';

interface Props {
    readonly items: readonly TransactionActionsMenuItemInterface[];
}

export const TransactionInfoMoreActionsRow = ({ items }: Props) => {
    const { t } = useLingui();
    const rowRef = useRef<View>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [anchor, setAnchor] = useState<PopoverMenuAnchor | undefined>();
    const { closeMenu, handleCloseComplete } = useTransactionListContextMenuClose({ isOpen, onClose: () => void setIsOpen(false) });
    const label = t`More Actions…`;
    const handleOpen = () =>
        rowRef.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            setIsOpen(true);
        });

    return (
        <View ref={rowRef} collapsable={false}>
            <HapticPressable
                className="active:scale-100 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={handleOpen}
                testID={TransactionInfoPageSelector.ConvertButton}
            >
                <TransactionInfoActionLabel icon={UserIconNameEnum.CircleEllipsis} label={label}>
                    <Icon icon={UserIconNameEnum.ChevronRight} size={20} className="text-secondary-foreground" />
                </TransactionInfoActionLabel>
            </HapticPressable>

            <PopoverMenu isOpen={isOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor} placement="top">
                <TransactionActionsMenuContext.Provider value={closeMenu}>
                    <View className="min-w-[280px] py-sm">
                        {items.map(item => (
                            <TransactionConvertMenuItem
                                key={item.key}
                                icon={item.icon}
                                label={item.label}
                                subtitle={item.consequence}
                                onConvert={item.onPress}
                                testID={item.testID}
                            />
                        ))}
                    </View>
                </TransactionActionsMenuContext.Provider>
            </PopoverMenu>
        </View>
    );
};
