import { Redirect } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useInzhurTopUpQuery } from '../../query/use-inzhur-top-up.query';
import { InzhurPurchaseForm } from '../inzhur-purchase-form/inzhur-purchase-form';

interface Props {
    readonly topUpTransactionId: number;
}

export const InzhurPurchasePage = ({ topUpTransactionId }: Props) => {
    const { topUp, isLoading } = useInzhurTopUpQuery(topUpTransactionId);

    if (isLoading) {
        return <EmptyScreen />;
    }

    return isDefined(topUp) ? <InzhurPurchaseForm topUp={topUp} /> : <Redirect href="/" />;
};
