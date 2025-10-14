import { array } from 'zod';

import { isPositiveNumber } from '@rnw-community/shared';

import { TransactionLineRoleEnum } from '../../../transaction-line/enum/transaction-line-role.enum';
import { AssetTransactionLineEntitySchema } from '../../../transaction-line/schema/asset/asset-transaction-line-entity.schema';
import { BaseTransactionCreateEntityFieldsSchema } from '../base/base-transaction-create-entity-fields.schema';

import { BuyAssetTransactionEntitySchema } from './buy-asset-transaction-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = BuyAssetTransactionEntitySchema.pick({ type: true })
    .extend({
        ...BaseTransactionCreateEntityFieldsSchema.shape,
        lines: array(AssetTransactionLineEntitySchema).length(1)
    })
    .superRefine(({ lines }, ctx) => {
        const principals = lines.filter(({ role }) => role === TransactionLineRoleEnum.PRINCIPAL);

        if (principals.length !== 2) {
            ctx.addIssue({ code: 'custom', path: ['lines'], message: 'transfer requires exactly 2 principal lines' });

            return;
        }

        const [principalA, principalB] = principals;

        const oneNegOnePos =
            (!isPositiveNumber(principalA.quantity) && isPositiveNumber(principalB.quantity)) ||
            (isPositiveNumber(principalA.quantity) && !isPositiveNumber(principalB.quantity));

        if (!oneNegOnePos) {
            ctx.addIssue({ code: 'custom', path: ['lines'], message: 'one principal must be negative (source) and one positive (target)' });
        }

        if (principalA.accountId === principalB.accountId) {
            ctx.addIssue({ code: 'custom', path: ['lines'], message: 'source and target accounts must differ' });
        }

        const sourceAcc = isPositiveNumber(principalA.quantity) ? principalB.accountId : principalA.accountId;

        lines.forEach(({ role, quantity, accountId }, index) => {
            if (role !== TransactionLineRoleEnum.FEE && role !== TransactionLineRoleEnum.TAX) {
                return;
            }

            if (quantity >= 0) {
                ctx.addIssue({ code: 'custom', path: ['lines', index, 'quantity'], message: 'fee/tax must be negative' });
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
