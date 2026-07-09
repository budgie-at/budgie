import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useConvertToRefundModal } from '../context/convert-to-refund-modal.context';

export const useOpenRefundConvert = (transactionId: number) => {
    const [openConvertToRefund] = useConvertToRefundModal();

    return () =>
        void openConvertToRefund({
            refundIncomeTransactionId: transactionId
        }).then(canonicalId => {
            if (isDefined(canonicalId)) {
                router.replace({ pathname: '/transactions/[id]/expense', params: { id: String(canonicalId) } });
            }

            return null;
        });
};
