import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { CurrencyModePill } from '../currency-mode-pill/currency-mode-pill';
import { MccInfoRow } from '../mcc-info-row/mcc-info-row';

interface Props {
    readonly currencyLabel: string | null;
    readonly onCurrencyPress: () => void;
}

export const TransferFormSummary = ({ currencyLabel, onCurrencyPress }: Props) => {
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const title = useWatch({ control, name: 'title' });
    const { fromAccount, toAccount } = useTransferAccounts();

    const route = isDefined(fromAccount) && isDefined(toAccount) ? `${fromAccount.title} → ${toAccount.title}` : '';
    const summary = isNotEmptyString(title) ? title : route;

    return (
        <MccInfoRow transactionTitle={summary} mccCategoryId={null}>
            {isNotEmptyString(currencyLabel) ? <CurrencyModePill label={currencyLabel} isFlipped onPress={onCurrencyPress} /> : null}
        </MccInfoRow>
    );
};
