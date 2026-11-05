import { TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useEffectEvent, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { isPositiveNumber } from '@rnw-community/shared';

import { useGetAccountByIdQuery } from '../../account/query/use-get-account-by-id.query';
import { useConvertToTransferModalParams } from '../context/convert-to-transfer-modal.context';

import { useCurrencyConversion } from './use-currency-conversion.hook';
import { useKeypadInput } from './use-keypad-input.hook';
import { useQuickFormValidation } from './use-quick-form-validation.hook';
import { useTransferAccounts } from './use-transfer-accounts.hook';

import type { ConvertTransferFormResultInterface } from '../interface/convert-transfer-form-result.interface';

export const useConvertTransferForm = (onSubmit: () => void): ConvertTransferFormResultInterface => {
    const { t } = useLingui();
    const params = useConvertToTransferModalParams();
    const { setValue } = useFormContext<TransactionCreateInputInterface>();
    const { account: originalAccount } = useGetAccountByIdQuery(params?.excludeAccountId ?? 0);
    const { fromAccount, toAccount } = useTransferAccounts();
    const { validateAndShake } = useQuickFormValidation();
    const [isEditing, setIsEditing] = useState(false);
    const counterAccount = params?.transactionType === TransactionTypeEnum.EXPENSE ? toAccount : fromAccount;
    const conversion = useCurrencyConversion(
        originalAccount?.instrumentId ?? 0,
        counterAccount?.instrumentId ?? 0,
        params?.sourceAmount ?? 0
    );
    const keypad = useKeypadInput({ initialValue: 0 });

    const handleConversion = useEffectEvent(() => {
        conversion.convert(params?.sourceAmount ?? 0, originalAccount?.instrumentId ?? 0, counterAccount?.instrumentId ?? 0);
    });

    useEffect(() => {
        handleConversion();
    }, [params?.sourceAmount, originalAccount?.instrumentId, counterAccount?.instrumentId]);

    const handleEdit = () => {
        keypad.setFromNumeric(conversion.destinationAmount);
        setIsEditing(true);
    };

    const handleConfirm = () => {
        if (isEditing) {
            if (isPositiveNumber(keypad.numericValue)) {
                conversion.setManualDestinationAmount(params?.sourceAmount ?? 0, keypad.numericValue);
                setIsEditing(false);
            }

            return;
        }
        if (
            validateAndShake([
                {
                    isValid: isPositiveNumber(counterAccount?.id),
                    field: params?.transactionType === TransactionTypeEnum.EXPENSE ? 'toAccountId' : 'fromAccountId',
                    message:
                        params?.transactionType === TransactionTypeEnum.EXPENSE
                            ? t`Choose a destination account`
                            : t`Choose a source account`
                }
            ])
        ) {
            setValue('exchangeRate', conversion.exchangeRate);
            onSubmit();
        }
    };

    return { originalAccount, fromAccount, counterAccount, isEditing, conversion, keypad, handleEdit, handleConfirm };
};
