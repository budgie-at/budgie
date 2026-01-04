import { AccountTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { useAccountBalanceQuery } from '../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../account/query/use-get-account-by-id.query';

interface UseTransferDebtValidationOptions {
    readonly fromAccountId: number | null | undefined;
    readonly amount: number;
    readonly form: UseFormReturn<TransactionCreateInputInterface>;
}

export const useTransferDebtValidation = (options: UseTransferDebtValidationOptions) => {
    const { fromAccountId, amount, form } = options;
    const { t } = useLingui();

    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { balance } = useAccountBalanceQuery(fromAccountId ?? 0);
    const exceedsDebtBalance = account?.type === AccountTypeEnum.DEBT && amount > balance;

    useEffect(() => {
        if (exceedsDebtBalance) {
            form.setError('amount', { type: 'custom', message: t`Amount exceeds debt account balance` });
        } else {
            form.clearErrors('amount');
        }
    }, [exceedsDebtBalance, form, t]);

    return { account };
};
