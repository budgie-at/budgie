import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';


export const TransactionEntitySchema = createSelectSchema(TransactionEntityTable, {
    ...BaseEntityFields,
    type: zodEnum(TransactionTypeEnum).describe('The type of the transaction.'),
    externalId: schema => schema.describe('The external id of the transaction.'),
    operatedAt: schema => schema.describe('The date when the transaction was operated.'),
    exchangeRate: schema => schema.describe('The exchange rate of the transaction.'),
    externalSource: zodEnum(ExternalSourceEnum).describe('The external source of the transaction.')
});
