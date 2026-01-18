import { UserIconNameEnum } from '@budgie/contracts';
import { MacroMessageDescriptor, msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PopoverMenu, PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';

type TransactionType = 'expense' | 'income' | 'transfer';

interface Props {
    readonly onDelete: EmptyFn;
    readonly onChangeType?: EmptyFn;
    readonly currentType: TransactionType;
}

const TYPE_LABELS: Record<TransactionType, MacroMessageDescriptor> = {
    expense: msg`Expense`,
    income: msg`Income`,
    transfer: msg`Transfer`
};

export const TransactionActionsMenu = ({ onDelete, onChangeType, currentType }: Props) => {
    const { t } = useLingui();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchor, setAnchor] = useState<PopoverMenuAnchor>({ x: 0, y: 0, width: 0, height: 0 });
    const triggerRef = useRef<View>(null);
    const { ref, isLoading, handleConfirm, handleOpen } = useConfirmAction(onDelete);

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

    const handleCloseMenu = () => {
        setIsMenuOpen(false);
    };

    const handleChangeType = () => {
        handleCloseMenu();
        onChangeType?.();
    };

    const handleDeletePress = () => {
        handleCloseMenu();
        handleOpen();
    };

    const getChangeTypeLabels = () => {
        const isExpense = currentType === 'expense';

        return {
            label: isExpense ? t`Convert to Transfer` : t`Change Type`,
            rightLabel: isExpense ? null : t(TYPE_LABELS[currentType])
        };
    };

    return (
        <View>
            <View ref={triggerRef} collapsable={false}>
                <HapticPressable onPress={handleToggleMenu}>
                    <CircleIcon icon={UserIconNameEnum.EllipsisVertical} variant="ghost" size={40} iconSize={24} border={false} />
                </HapticPressable>
            </View>

            <PopoverMenu isOpen={isMenuOpen} onClose={handleCloseMenu} anchor={anchor}>
                <View className="py-sm">
                    {isDefined(onChangeType) ? (
                        <PopoverMenuItem
                            icon={UserIconNameEnum.ArrowRightLeft}
                            label={getChangeTypeLabels().label}
                            onPress={handleChangeType}
                            rightLabel={getChangeTypeLabels().rightLabel}
                        />
                    ) : null}

                    <PopoverMenuItem
                        icon={UserIconNameEnum.Trash2}
                        label={t`Delete Transaction`}
                        onPress={handleDeletePress}
                        variant="destructive"
                    />
                </View>
            </PopoverMenu>

            <ConfirmActionBottomSheet
                ref={ref}
                isLoading={isLoading}
                variant="destructive"
                description={t`This action cannot be undone.`}
                buttonText={t`Delete transaction`}
                onSubmit={handleConfirm}
                icon={UserIconNameEnum.Info}
                title={t`Are you sure you want to delete this transaction?`}
            />
        </View>
    );
};
