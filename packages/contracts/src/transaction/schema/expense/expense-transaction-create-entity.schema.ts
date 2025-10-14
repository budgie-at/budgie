import { array } from 'zod';

import { TransactionLineRoleEnum } from '../../../transaction-line/enum/transaction-line-role.enum';
import { TransactionLineCreateEntitySchema } from '../../../transaction-line/schema/transaction-line-create-entity.schema';
import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { ExpenseTransactionEntitySchema } from './expense-transaction-entity.schema';

export const ExpenseTransactionCreateEntitySchema = ExpenseTransactionEntitySchema.pick({ type: true })
    .extend({
        ...BaseTransactionCreateEntityFieldsSchema.shape,
        lines: array(TransactionLineCreateEntitySchema).min(1)
    })
    .superRefine(({ lines }, ctx) => {
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
    });
