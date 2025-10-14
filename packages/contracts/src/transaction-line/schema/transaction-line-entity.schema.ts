import { number, enum as zodEnum } from 'zod';

import { AccountEntitySchema } from '../../account/schema/account-entity.schema';
import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { InstrumentEntitySchema } from '../../instrument/schema/instrument-entity.schema';
import { TransactionEntitySchema } from '../../transaction/schema/transaction-entity.schema';
import { TransactionLineAssociationEnum } from '../enum/transaction-line-association.enum';
import { TransactionLineRoleEnum } from '../enum/transaction-line-role.enum';

export const TransactionLineEntitySchema = BaseEntitySchema.extend({
    amount: number().default(0).describe('Amount of the transaction line.'),
    accountId: number().positive().describe('Id of the account associated with the transaction line.'),
    transactionId: number().positive().describe('Id of the transaction to which the transaction line belongs.'),
    instrumentId: number().positive().nullable().describe('Id of the instrument associated with the transaction line.'),
    quantity: number().nonnegative().default(0).describe('Quantity of the asset associated with the transaction line.'),
    pricePerUnit: number().nonnegative().default(0).describe('Price per unit of the asset associated with the transaction line.'),
    role: zodEnum(TransactionLineRoleEnum).default(TransactionLineRoleEnum.PRINCIPAL).describe('Role of the transaction line.'),

    get [TransactionLineAssociationEnum.TRANSACTION]() {
        return TransactionEntitySchema.describe('Transaction associated with the transaction line.');
    },
    get [TransactionLineAssociationEnum.INSTRUMENT]() {
        return InstrumentEntitySchema.nullable().describe('Instrument associated with the transaction line.');
    },
    get [TransactionLineAssociationEnum.ACCOUNT]() {
        return AccountEntitySchema.describe('Account associated with the transaction line.');
    }
});
