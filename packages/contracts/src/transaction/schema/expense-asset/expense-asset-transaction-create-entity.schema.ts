import { array } from 'zod';

import { TransactionLineRoleEnum } from '../../../transaction-line/enum/transaction-line-role.enum';
import { AssetTransactionLineCreateEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-create-entity.schema';
import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { ExpenseAssetTransactionEntitySchema } from './expense-asset-transaction-entity.schema';

export const ExpenseAssetTransactionCreateEntitySchema = ExpenseAssetTransactionEntitySchema.pick({
    type: true
})
    .extend({
        ...BaseTransactionCreateEntityFieldsSchema.shape,
        lines: array(AssetTransactionLineCreateEntitySchema).min(1).describe('Lines associated with the asset-expense transaction.')
    })
    .superRefine(({ lines }, ctx) => {
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
    });
