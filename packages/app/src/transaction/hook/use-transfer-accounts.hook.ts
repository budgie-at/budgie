import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { useGetAccountByIdQuery } from '../../account/query/use-get-account-by-id.query';

interface UseTransferAccountsResult {
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
    readonly fromAccount: ReturnType<typeof useGetAccountByIdQuery>['account'];
    readonly toAccount: ReturnType<typeof useGetAccountByIdQuery>['account'];
}

export const useTransferAccounts = (): UseTransferAccountsResult => {
    const { control } = useFormContext<TransactionCreateInputInterface>();

    const fromAccountId = useWatch({ control, name: 'fromAccountId' });
    const toAccountId = useWatch({ control, name: 'toAccountId' });

    const { account: fromAccount } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { account: toAccount } = useGetAccountByIdQuery(toAccountId ?? 0);

    return { fromAccountId, toAccountId, fromAccount, toAccount };
};
