import type { ErsteModernInlineTransactionStateInterface } from '../interface/erste-modern-inline-transaction-state.interface';
import type { ErsteModernStandardTransactionStateInterface } from '../interface/erste-modern-standard-transaction-state.interface';

export const appendErsteModernTransactionLine = (
    state: ErsteModernInlineTransactionStateInterface | ErsteModernStandardTransactionStateInterface,
    line: string
): void => {
    if (state.kind === 'standard') {
        state.trailingLines.push(line);

        return;
    }

    state.continuationLines.push(line);
};
