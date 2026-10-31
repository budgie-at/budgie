import { AccountDebtTypeEnum, DebtEventAssociationEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { DEBT_SETTLEMENT_LABEL } from '../../constant/debt-settlement-label.constant';
import { TransactionInfoDebtProgress } from '../transaction-info-debt-progress/transaction-info-debt-progress';
import { TransactionInfoInstallmentTerms } from '../transaction-info-installment-terms/transaction-info-installment-terms';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoDebtRows = ({ transaction }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const debtAccount = transaction.debtEvents.at(0)?.[DebtEventAssociationEnum.DEBT_ACCOUNT];

    if (!isDefined(debtAccount)) {
        return null;
    }

    const handleOpen = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(debtAccount.id) } });
    const icon = debtAccount.debtType === AccountDebtTypeEnum.INSTALLMENT ? UserIconNameEnum.CalendarClock : UserIconNameEnum.BookOpen;

    return (
        <>
            <TransactionInfoRow
                icon={icon}
                label={t(DEBT_SETTLEMENT_LABEL[debtAccount.debtType])}
                value={debtAccount.title}
                testID={TransactionInfoPageSelector.Row.Debt}
                onPress={handleOpen}
            />
            {debtAccount.debtType === AccountDebtTypeEnum.INSTALLMENT ? (
                <TransactionInfoInstallmentTerms account={debtAccount} />
            ) : (
                <TransactionInfoDebtProgress account={debtAccount} />
            )}
        </>
    );
};
