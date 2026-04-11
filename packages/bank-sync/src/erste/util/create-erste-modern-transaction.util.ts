import { isNotEmptyArray } from '@rnw-community/shared';

import type { ErsteModernInlineTransactionStateInterface } from '../interface/erste-modern-inline-transaction-state.interface';
import type { ErsteModernStandardTransactionStateInterface } from '../interface/erste-modern-standard-transaction-state.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';

export const createErsteModernTransaction = (
    state: ErsteModernInlineTransactionStateInterface | ErsteModernStandardTransactionStateInterface
): ErsteRowInterface => {
    if (state.kind === 'standard') {
        const reference = isNotEmptyArray(state.leadingLines) ? state.leadingLines[state.leadingLines.length - 1] : '';
        const description = isNotEmptyArray(state.trailingLines) ? state.trailingLines[0] : reference;
        const details = state.trailingLines.slice(1).join(' ').trim();

        return {
            date: state.date,
            reference,
            description,
            details,
            amount: state.amount,
            isCredit: state.isCredit
        };
    }

    const description = isNotEmptyArray(state.continuationLines) ? state.continuationLines[0] : state.reference;
    const details = state.continuationLines.slice(1).join(' ').trim();

    return {
        date: state.date,
        reference: state.reference,
        description,
        details,
        amount: state.amount,
        isCredit: state.isCredit
    };
};
