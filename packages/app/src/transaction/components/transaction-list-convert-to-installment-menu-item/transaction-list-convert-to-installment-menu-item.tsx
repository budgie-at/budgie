import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useOpenConvertToInstallment } from '../../../installment-plan/hook/use-open-convert-to-installment.hook';
import { useTransactionActionsMenu } from '../../context/transaction-actions-menu.context';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListConvertToInstallmentMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const closeMenu = useTransactionActionsMenu();
    const openConvertToInstallment = useOpenConvertToInstallment(transaction);

    if (!isDefined(openConvertToInstallment)) {
        return null;
    }

    const handlePress = () => {
        closeMenu(openConvertToInstallment);
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.CalendarClock}
            label={t`Pay in parts`}
            onPress={handlePress}
            testID={TransactionListContextMenuSelector.ConvertToInstallmentButton}
        />
    );
};
