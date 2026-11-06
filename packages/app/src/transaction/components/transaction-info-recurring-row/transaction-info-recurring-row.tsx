import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useRecurringSeriesForTransaction } from '../../../recurring/hook/use-recurring-series-for-transaction.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoMakeRecurringRow } from '../transaction-info-make-recurring-row/transaction-info-make-recurring-row';

interface Props {
    readonly transactionId: number;
}

export const TransactionInfoRecurringRow = ({ transactionId }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { seriesId, isLoading } = useRecurringSeriesForTransaction(transactionId);
    const handleViewRecurring = () => void router.push({ pathname: '/recurring/[id]', params: { id: String(seriesId) } });

    if (isLoading) {
        return (
            <TransactionInfoActionRow
                icon={UserIconNameEnum.Repeat}
                label={t`Make recurring`}
                testID={TransactionActionsMenuSelector.MakeRecurringButton}
            />
        );
    }

    return isDefined(seriesId) ? (
        <TransactionInfoActionRow
            icon={UserIconNameEnum.Repeat}
            label={t`View recurring`}
            onPress={handleViewRecurring}
            testID={TransactionActionsMenuSelector.ViewRecurringButton}
        />
    ) : (
        <TransactionInfoMakeRecurringRow transactionId={transactionId} />
    );
};
