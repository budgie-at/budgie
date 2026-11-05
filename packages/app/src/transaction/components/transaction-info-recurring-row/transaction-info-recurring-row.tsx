import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useRecurringSeriesForTransaction } from '../../../recurring/hook/use-recurring-series-for-transaction.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';

interface Props {
    readonly transactionId: number;
}

export const TransactionInfoRecurringRow = ({ transactionId }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { seriesId, isLoading } = useRecurringSeriesForTransaction(transactionId);

    if (isLoading) {
        return null;
    }

    const handleViewRecurring = () => void router.push({ pathname: '/recurring/[id]', params: { id: String(seriesId) } });
    const handleMakeRecurring = () =>
        void router.push({ pathname: '/recurring/make-recurring', params: { transactionId: String(transactionId) } });

    return isDefined(seriesId) ? (
        <TransactionInfoActionRow
            icon={UserIconNameEnum.Repeat}
            label={t`View recurring`}
            onPress={handleViewRecurring}
            testID={TransactionActionsMenuSelector.ViewRecurringButton}
        />
    ) : (
        <TransactionInfoActionRow
            icon={UserIconNameEnum.Repeat}
            label={t`Make recurring`}
            onPress={handleMakeRecurring}
            testID={TransactionActionsMenuSelector.MakeRecurringButton}
        />
    );
};
