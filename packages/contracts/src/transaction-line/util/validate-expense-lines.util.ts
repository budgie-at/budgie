import { TransactionLineRoleEnum } from '../enum/transaction-line-role.enum';

import type { TransactionLineEntityInterface } from '../entity/transaction-line-entity.interface';
import type { RefinementCtx } from 'zod';

export const validateExpenseLines = (
    lines: Pick<TransactionLineEntityInterface, 'amount' | 'accountId' | 'role'>[],
    ctx: RefinementCtx
): void => {
    const principals = lines.filter(({ role }) => role === TransactionLineRoleEnum.PRINCIPAL);

    if (principals.length !== 1) {
        ctx.addIssue({ code: 'custom', path: ['lines'], message: 'expense requires exactly 1 principal line' });

        return;
    }

    const [principal] = principals;

    if (principal.amount >= 0) {
        ctx.addIssue({ code: 'custom', path: ['lines'], message: 'expense principal amount must be < 0' });
    }

    lines.forEach(({ accountId, role, amount }, index) => {
        if (accountId !== principal.accountId) {
            ctx.addIssue({ code: 'custom', path: ['lines', index, 'accountId'], message: 'must match expense account' });
        }

        if ((role === TransactionLineRoleEnum.FEE || role === TransactionLineRoleEnum.TAX) && amount >= 0) {
            ctx.addIssue({ code: 'custom', path: ['lines', index, 'amount'], message: 'fee/tax must be negative' });
        }
    });
};
