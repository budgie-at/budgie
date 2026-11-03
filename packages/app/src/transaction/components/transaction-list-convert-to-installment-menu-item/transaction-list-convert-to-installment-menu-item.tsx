import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useOpenConvertToInstallment } from '../../../installment-plan/hook/use-open-convert-to-installment.hook';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListConvertToInstallmentMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const openConvertToInstallment = useOpenConvertToInstallment(transaction);

    if (!isDefined(openConvertToInstallment)) {
        return null;
    }

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.CalendarClock}
            label={t`Pay in parts`}
            onPress={openConvertToInstallment}
            testID={TransactionListContextMenuSelector.ConvertToInstallmentButton}
        />
    );
};
