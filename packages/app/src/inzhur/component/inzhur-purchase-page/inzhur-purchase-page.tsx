import { Redirect } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useInzhurFundOptions } from '../../hook/use-inzhur-fund-options.hook';
import { useInzhurTopUpQuery } from '../../query/use-inzhur-top-up.query';
import { InzhurPurchaseForm } from '../inzhur-purchase-form/inzhur-purchase-form';

interface Props {
    readonly topUpTransactionId: number;
}

export const InzhurPurchasePage = ({ topUpTransactionId }: Props) => {
    const { topUp, isLoading: isTopUpLoading } = useInzhurTopUpQuery(topUpTransactionId);
    const { fundOptions, isLoading: isFundOptionsLoading } = useInzhurFundOptions();

    if (isTopUpLoading || isFundOptionsLoading) {
        return <EmptyScreen />;
    }

    return isDefined(topUp) ? <InzhurPurchaseForm topUp={topUp} defaultFundName={fundOptions.at(0)?.name ?? ''} /> : <Redirect href="/" />;
};
