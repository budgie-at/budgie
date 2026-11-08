import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { useGetAccountSync } from '../../../../sync/query/use-get-account-sync.query';
import { TransactionFormScreen } from '../../../../transaction/components/transaction-form-screen/transaction-form-screen';
import { UpdateAdjustmentTransaction } from '../../../../transaction/components/update-adjustment-transaction/update-adjustment-transaction';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { getTransactionHref } from '../../../../transaction/utils/get-transaction-href.util';

export default function UpdateAdjustmentTransactionPage() {
    const { t } = useLingui();
    const { id } = useLocalSearchParams<IdParamInterface>();
    const transactionId = Number(id);
    const { transaction, isLoading } = useGetTransactionByIdQuery(transactionId);

    const { sync, isLoading: isSyncLoading } = useGetAccountSync(transaction?.toAccountId ?? transaction?.fromAccountId ?? 0);

    if (isLoading || isSyncLoading) {
        return null;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    if (transaction.type !== TransactionTypeEnum.ADJUSTMENT) {
        return <Redirect href={getTransactionHref(transaction)} />;
    }

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <TransactionFormScreen title={t`Balance Adjustment`} onGoBack={handleGoBack}>
            <UpdateAdjustmentTransaction transaction={transaction} transactionId={transactionId} sync={sync} />
        </TransactionFormScreen>
    );
}
