import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { MccInfoRow } from '../mcc-info-row/mcc-info-row';

import type { ReactNode } from 'react';

interface Props {
    readonly children?: ReactNode;
}

export const TransferFormSummary = ({ children }: Props) => {
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const title = useWatch({ control, name: 'title' });
    const { fromAccount, toAccount } = useTransferAccounts();

    const route = isDefined(fromAccount) && isDefined(toAccount) ? `${fromAccount.title} → ${toAccount.title}` : '';
    const summary = isNotEmptyString(title) ? title : route;

    return (
        <MccInfoRow transactionTitle={summary} mccCategoryId={null}>
            {children}
        </MccInfoRow>
    );
};
