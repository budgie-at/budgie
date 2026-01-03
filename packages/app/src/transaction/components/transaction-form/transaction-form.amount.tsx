import { useWatch } from 'react-hook-form';

import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useTransactionFormContext } from '../../context/transaction-form.context';
import { useAmountSync } from '../../hook/use-amount-sync.hook';
import { TransactionFormAmountBase } from '../transaction-form-amount/transaction-form-amount-base';

export const TransactionFormAmount = () => {
    const { control, variant } = useTransactionFormContext();
    const { defaultInstrument } = useSettingsContext();
    const { handleAmountChange } = useAmountSync();

    const [fromAccountId, toAccountId] = useWatch({
        control,
        name: ['fromAccountId', 'toAccountId']
    });

    const accountId = fromAccountId ?? toAccountId ?? 0;
    const { account } = useGetAccountByIdQuery(accountId);

    const instrumentSymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    return (
        <TransactionFormAmountBase
            variant={variant}
            control={control}
            instrumentSymbol={instrumentSymbol}
            onAmountChange={handleAmountChange}
        />
    );
};
