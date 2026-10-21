import { useContext } from 'react';

import { isDefined } from '@rnw-community/shared';

import { AmountFieldContext } from '../../context/amount-field.context';

import type { AmountFieldContextValueInterface } from '../../interface/amount-field-context-value.interface';

export const useAmountFieldContext = (): AmountFieldContextValueInterface => {
    const context = useContext(AmountFieldContext);

    if (!isDefined(context)) {
        throw new Error('AmountField parts must be rendered inside AmountField');
    }

    return context;
};
