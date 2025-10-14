import type { TransactionLineEntityInterface } from '../entity/transaction-line-entity.interface';
import type { RefinementCtx } from 'zod';

export const validateLineLinkageToTransaction = (
    transactionId: number,
    lines: Pick<TransactionLineEntityInterface, 'transactionId' | 'id'>[],
    ctx: RefinementCtx
): void => {
    const seen = new Set<number>();

    lines.forEach((line, index) => {
        if (line.transactionId !== transactionId) {
            ctx.addIssue({ code: 'custom', path: ['lines', index, 'transactionId'], message: 'must equal transaction id' });
        }

        if (seen.has(line.id)) {
            ctx.addIssue({ code: 'custom', path: ['lines', index, 'id'], message: 'duplicate line id' });
        }

        seen.add(line.id);
    });
};
