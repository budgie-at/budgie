import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useOpenConvertToInstallment } from '../../../installment-plan/hook/use-open-convert-to-installment.hook';
import { useTransactionListContextMenu } from '../../context/transaction-list-context-menu.context';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

export const TransactionListConvertToInstallmentMenuItem = () => {
    const { t } = useLingui();
    const { transaction, closeMenu } = useTransactionListContextMenu();
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
