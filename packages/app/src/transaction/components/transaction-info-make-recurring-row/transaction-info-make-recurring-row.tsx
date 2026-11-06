import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isNotEmptyArray } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useRecurringFittingSeries } from '../../../recurring/hook/use-recurring-fitting-series.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
interface Props {
    readonly transactionId: number;
}
export const TransactionInfoMakeRecurringRow = ({ transactionId }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { fittingSeries, isLoading, isFailed } = useRecurringFittingSeries(transactionId);
    const pathname = isNotEmptyArray(fittingSeries) ? '/make-recurring' : '/recurring/create';
    const handlePress = () => void router.push({ pathname, params: { transactionId: String(transactionId) } });
    if (isFailed) {
        return null;
    }

    return (
        <LoadingContent isLoading={isLoading}>
            <TransactionInfoActionRow
                icon={UserIconNameEnum.Repeat}
                label={t`Make recurring`}
                onPress={handlePress}
                testID={TransactionActionsMenuSelector.MakeRecurringButton}
            />
        </LoadingContent>
    );
};
