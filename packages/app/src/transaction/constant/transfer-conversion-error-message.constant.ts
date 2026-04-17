import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const TRANSFER_CONVERSION_ERROR_MESSAGE = {
    expense: {
        wrongType: msg`Only expense transactions can be converted`,
        multiEntry: msg`Only single-entry expenses can be converted`
    },
    income: {
        wrongType: msg`Only income transactions can be converted`,
        multiEntry: msg`Only single-entry incomes can be converted`
    }
} satisfies Record<'expense' | 'income', Record<'wrongType' | 'multiEntry', MessageDescriptor>>;
