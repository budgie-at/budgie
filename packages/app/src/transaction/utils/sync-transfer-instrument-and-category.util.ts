import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { UseFormSetValue } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { TransactionCreateInputInterface } from '../schema/transaction-create-input.schema';

import { getTransferCategoryId } from './get-transfer-category-id.util';

export const syncTransferInstrumentAndCategory = (
    fromAccount: AccountWithInstrumentEntityInterface | null,
    toAccount: AccountWithInstrumentEntityInterface | null,
    setValue: UseFormSetValue<TransactionCreateInputInterface>
) => {
    if (isDefined(fromAccount)) {
        setValue('entries.0.instrumentId', fromAccount.instrument.id);
    }
    if (isDefined(toAccount)) {
        setValue('entries.1.instrumentId', toAccount.instrument.id);
    }

    if (fromAccount && toAccount) {
        const categoryId = getTransferCategoryId(fromAccount.type, toAccount.type);

        if (isDefined(categoryId)) {
            setValue('entries.0.categoryId', categoryId);
            setValue('entries.1.categoryId', categoryId);
        }
    }
};
