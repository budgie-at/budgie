import { TransactionLineRoleEnum } from '../enum/transaction-line-role.enum';

import type { TransactionLineEntityInterface } from '../entity/transaction-line-entity.interface';
import type { RefinementCtx } from 'zod';

export const validateAssetExpenseLines = (
    lines: Pick<TransactionLineEntityInterface, 'quantity' | 'accountId' | 'role'>[],
    ctx: RefinementCtx
): void => {
    const principals = lines.filter(({ role }) => role === TransactionLineRoleEnum.PRINCIPAL);

    if (principals.length !== 1) {
        ctx.addIssue({ code: 'custom', path: ['lines'], message: 'expense requires exactly 1 principal line' });

        return;
    }

    const [principal] = principals;

    if (principal.quantity >= 0) {
        ctx.addIssue({ code: 'custom', path: ['lines'], message: 'expense principal quantity must be < 0' });
    }

    lines.forEach(({ accountId, role, quantity }, index) => {
        if (accountId !== principal.accountId) {
            ctx.addIssue({ code: 'custom', path: ['lines', index, 'accountId'], message: 'must match expense account' });
        }

        if ((role === TransactionLineRoleEnum.FEE || role === TransactionLineRoleEnum.TAX) && quantity >= 0) {
            ctx.addIssue({ code: 'custom', path: ['lines', index, 'quantity'], message: 'fee/tax must be negative' });
        }
    });
};
