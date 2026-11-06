import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
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

    const isLinkedRowShown = isLoading || isDefined(seriesId);

    return (
        <LoadingContent isLoading={isLoading}>
            {isLinkedRowShown ? (
                <TransactionInfoActionRow
                    icon={UserIconNameEnum.Repeat}
                    label={t`View recurring`}
                    onPress={handleViewRecurring}
                    testID={TransactionActionsMenuSelector.ViewRecurringButton}
                />
            ) : (
                <TransactionInfoMakeRecurringRow transactionId={transactionId} />
            )}
        </LoadingContent>
    );
};
