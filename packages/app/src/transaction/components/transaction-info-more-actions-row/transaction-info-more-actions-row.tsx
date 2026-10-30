import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

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
    const consequences = [...new Set(items.map(item => item.consequence).filter(isDefined))];
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

            <PopoverMenu isOpen={isOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
                <TransactionActionsMenuContext.Provider value={closeMenu}>
                    <View className="py-sm">
                        {items
                            .filter(item => !isDefined(item.consequence))
                            .map(item => (
                                <TransactionConvertMenuItem
                                    key={item.key}
                                    icon={item.icon}
                                    label={item.label}
                                    onConvert={item.onPress}
                                    testID={item.testID}
                                />
                            ))}
                        {consequences.map(consequence => (
                            <View key={consequence} className="mt-xs border-t border-secondary-corner pt-xs">
                                <Text className="px-xl pt-sm text-[13px] leading-[18px] text-secondary-foreground">{consequence}</Text>
                                {items
                                    .filter(item => item.consequence === consequence)
                                    .map(item => (
                                        <TransactionConvertMenuItem
                                            key={item.key}
                                            icon={item.icon}
                                            label={item.label}
                                            onConvert={item.onPress}
                                            testID={item.testID}
                                        />
                                    ))}
                            </View>
                        ))}
                    </View>
                </TransactionActionsMenuContext.Provider>
            </PopoverMenu>
        </View>
    );
};
