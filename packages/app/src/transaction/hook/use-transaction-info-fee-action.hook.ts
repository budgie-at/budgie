import { useRouter } from 'expo-router';

export const useTransactionInfoFeeAction = (
    pathname: '/transactions/[id]/expense/edit' | '/transactions/[id]/income/edit' | '/transactions/[id]/transfer/edit',
    transactionId: number
) => {
    const router = useRouter();

    return () => {
        void router.push({
            pathname,
            params: { id: String(transactionId), openFee: '1' }
        });
    };
};
