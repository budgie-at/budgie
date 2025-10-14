import { array } from 'zod';

import { isPositiveNumber } from '@rnw-community/shared';

import { TransactionLineRoleEnum } from '../../../transaction-line/enum/transaction-line-role.enum';
import { TransactionLineCreateEntitySchema } from '../../../transaction-line/schema/transaction-line-create-entity.schema';
import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { TransferTransactionEntitySchema } from './transfer-transaction-entity.schema';

export const TransferTransactionCreateEntitySchema = TransferTransactionEntitySchema.pick({ type: true })
    .extend({
        ...BaseTransactionCreateEntityFieldsSchema.shape,
        lines: array(TransactionLineCreateEntitySchema).length(1)
    })
    .superRefine(({ lines }, ctx) => {
        const principals = lines.filter(({ role }) => role === TransactionLineRoleEnum.PRINCIPAL);

        if (principals.length !== 2) {
            ctx.addIssue({ code: 'custom', path: ['lines'], message: 'transfer requires exactly 2 principal lines' });

            return;
        }

        const [principalA, principalB] = principals;

        const oneNegOnePos =
            (!isPositiveNumber(principalA.amount) && isPositiveNumber(principalB.amount)) ||
            (isPositiveNumber(principalA.amount) && !isPositiveNumber(principalB.amount));

        if (!oneNegOnePos) {
            ctx.addIssue({ code: 'custom', path: ['lines'], message: 'one principal must be negative (source) and one positive (target)' });
        }

        if (principalA.accountId === principalB.accountId) {
            ctx.addIssue({ code: 'custom', path: ['lines'], message: 'source and target accounts must differ' });
        }

        const sourceAcc = isPositiveNumber(principalA.amount) ? principalB.accountId : principalA.accountId;

        lines.forEach(({ role, amount, accountId }, index) => {
            if (role !== TransactionLineRoleEnum.FEE && role !== TransactionLineRoleEnum.TAX) {
                return;
            }

            if (amount >= 0) {
                ctx.addIssue({ code: 'custom', path: ['lines', index, 'amount'], message: 'fee/tax must be negative' });
            }

            if (accountId !== sourceAcc) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['lines', index, 'accountId'],
                    message: 'fee/tax should be on the source account'
                });
            }
        });
    });
