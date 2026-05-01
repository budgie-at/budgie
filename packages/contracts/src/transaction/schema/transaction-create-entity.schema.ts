import { boolean } from 'zod';

import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { TransactionEntitySchema } from './transaction-entity.schema';

export const TransactionCreateEntitySchema = convertToCreateEntitySchema(TransactionEntitySchema)
    .omit({ operatedWeekday: true, operatedMinuteOfDay: true })
    .partial({ consolidationParentTransactionId: true, consolidationType: true })
    .extend({ needsEmbedding: boolean().optional() });
