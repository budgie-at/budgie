import { TransactionCreateInputInterface } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { TransactionFeeFieldIcon } from '../transaction-fee-field-icon/transaction-fee-field-icon';

interface Props {
    readonly onPress: () => void;
}

export const ConvertTransferFee = ({ onPress }: Props) => {
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const entries = useWatch({ control, name: 'entries' });
    const { fromAccount } = useTransferAccounts();

    if (!isDefined(fromAccount)) {
        return null;
    }

    return (
        <TransactionFeeFieldIcon
            amount={sumEntryAmounts(getTransactionFeeEntries(entries))}
            currencySymbol={fromAccount.instrument.symbol}
            instrumentType={fromAccount.instrument.type}
            onPress={onPress}
        />
    );
};
