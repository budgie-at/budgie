import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import { useAccountBalanceQuery } from '../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../account/query/use-get-account-by-id.query';
import { useTransactionFormContext } from '../context/transaction-form.context';

export const useTransferValidation = () => {
    const { control, setError, clearErrors } = useTransactionFormContext();
    const { t } = useLingui();

    const [fromAccountId, amount] = useWatch({
        control,
        name: ['fromAccountId', 'amount']
    });

    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { balance } = useAccountBalanceQuery(fromAccountId ?? 0);

    const isDebtAccount = account?.type === AccountTypeEnum.DEBT;
    const exceedsDebtBalance = isDebtAccount && amount > balance;

    useEffect(() => {
        if (exceedsDebtBalance) {
            setError('amount', { type: 'custom', message: t`Amount exceeds debt account balance` });
        } else {
            clearErrors('amount');
        }
    }, [exceedsDebtBalance, setError, clearErrors, t]);
};
