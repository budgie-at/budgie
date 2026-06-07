import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { FullPage } from '../../../../@generic/component/page/full-page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { UpdateAdjustmentTransaction } from '../../../../transaction/components/update-adjustment-transaction/update-adjustment-transaction';
import { useGetTransactionByIdQuery } from '../../../../transaction/query/use-get-transaction-by-id.query';
import { getTransactionHref } from '../../../../transaction/utils/get-transaction-href.util';

export default function UpdateAdjustmentTransactionPage() {
    const { t } = useLingui();
    const { id } = useLocalSearchParams<IdParamInterface>();
    const transactionId = Number(id);
    const { transaction, isLoading } = useGetTransactionByIdQuery(transactionId);

    if (isLoading) {
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
        <FullPage header={<PageHeader title={t`Balance Adjustment`} onGoBack={handleGoBack} />}>
            <UpdateAdjustmentTransaction transaction={transaction} transactionId={transactionId} />
        </FullPage>
    );
}
