export const getTransactionFeeEditHref = (
    pathname: '/transactions/[id]/expense/edit' | '/transactions/[id]/income/edit' | '/transactions/[id]/transfer/edit',
    transactionId: number
) => ({ pathname, params: { id: String(transactionId), openFee: '1' } });
