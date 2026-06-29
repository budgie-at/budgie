import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { TransactionListAttachDebtMenuItem } from '../transaction-list-attach-debt-menu-item/transaction-list-attach-debt-menu-item';
import { TransactionListConvertMenuItem } from '../transaction-list-convert-menu-item/transaction-list-convert-menu-item';

import { TransactionListContextMenuSelector } from './transaction-list-context-menu.selector';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly canConvertToRefund: boolean;
    readonly canConvert: boolean;
    readonly canAttachDebtSettlement: boolean;
    readonly actionIcon: UserIconNameEnum;
    readonly actionLabel: string;
    readonly actionTestID: string;
    readonly onEdit: EmptyFn;
    readonly onConvertToRefund: EmptyFn;
    readonly onConvert: EmptyFn;
    readonly onAttachDebtSettlement: EmptyFn;
    readonly onAction: EmptyFn;
}

export const TransactionListContextMenuItems = ({
    canConvertToRefund,
    canConvert,
    canAttachDebtSettlement,
    actionIcon,
    actionLabel,
    actionTestID,
    onEdit,
    onConvertToRefund,
    onConvert,
    onAttachDebtSettlement,
    onAction
}: Props) => {
    const { t } = useLingui();

    return (
        <View className="py-sm">
            <PopoverMenuItem
                icon={UserIconNameEnum.Pencil}
                label={t`Edit Transaction`}
                onPress={onEdit}
                testID={TransactionListContextMenuSelector.EditButton}
            />
            <TransactionListConvertMenuItem isVisible={canConvertToRefund} isRefund onConvert={onConvertToRefund} />
            <TransactionListConvertMenuItem isVisible={canConvert} onConvert={onConvert} />
            <TransactionListAttachDebtMenuItem isVisible={canAttachDebtSettlement} onAttach={onAttachDebtSettlement} />
            <PopoverMenuItem icon={actionIcon} label={actionLabel} onPress={onAction} variant="destructive" testID={actionTestID} />
        </View>
    );
};
