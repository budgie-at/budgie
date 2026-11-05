import { Redirect, useIsFocused, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { TransactionInfoPage } from '../../../transaction/components/transaction-info-page/transaction-info-page';
import { useRecurringSeriesDetail } from '../../hook/use-recurring-series-detail.hook';
import { RecurringDetailContent } from '../recurring-detail-content/recurring-detail-content';

export const RecurringDetailRoute = () => {
    const isFocused = useIsFocused();
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { detail, isNotFound } = useRecurringSeriesDetail(Number(id));

    if (isNotFound) {
        return isFocused ? <Redirect href="/" /> : null;
    }

    if (!isDefined(detail)) {
        return null;
    }

    return (
        <TransactionInfoPage>
            <RecurringDetailContent detail={detail} />
        </TransactionInfoPage>
    );
};
