import { TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useQuickFormFee } from '../../hook/use-quick-form-fee.hook';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { TransactionFeeFieldIcon } from '../transaction-fee-field-icon/transaction-fee-field-icon';

export const ConvertTransferFee = () => {
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const entries = useWatch({ control, name: 'entries' });
    const { fromAccount } = useTransferAccounts();
    const { feeAmount, handleFeePress } = useQuickFormFee({
        accountFieldName: 'fromAccountId',
        currencySymbol: fromAccount?.instrument.symbol ?? '',
        entries,
        transactionType: TransactionTypeEnum.TRANSFER,
        variant: 'default'
    });

    if (!isDefined(fromAccount)) {
        return null;
    }

    return (
        <TransactionFeeFieldIcon
            amount={feeAmount}
            currencySymbol={fromAccount.instrument.symbol}
            instrumentType={fromAccount.instrument.type}
            onPress={handleFeePress}
        />
    );
};
