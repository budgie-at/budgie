import * as Schema from 'effect/Schema';

import { PositiveNumberSchema } from '../../@generic/schema/positive-number.schema';
import { CategorySourceEnum } from '../enum/category-source.enum';
import { TransactionEntryKindEnum } from '../enum/transaction-entry-kind.enum';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';

const OptionalPositiveNumberSchema = Schema.optional(Schema.NullOr(PositiveNumberSchema));

export const TransactionEntryCreateInputSchema = Schema.Struct({
    accountId: PositiveNumberSchema,
    categoryId: Schema.NullOr(PositiveNumberSchema),
    categorySource: Schema.optional(Schema.Enum(CategorySourceEnum)),
    mccCategoryId: Schema.NullOr(PositiveNumberSchema),
    type: Schema.Enum(TransactionEntryTypeEnum),
    kind: Schema.optional(Schema.Enum(TransactionEntryKindEnum)),
    amount: PositiveNumberSchema,
    externalId: Schema.optional(Schema.NullOr(Schema.String)),
    exchangeRate: Schema.optional(PositiveNumberSchema),
    baseInstrumentId: OptionalPositiveNumberSchema,
    baseExchangeRate: OptionalPositiveNumberSchema,
    baseAmount: OptionalPositiveNumberSchema,
    quotedInstrumentId: OptionalPositiveNumberSchema,
    quotedAmount: OptionalPositiveNumberSchema,
    quotedUnitPrice: OptionalPositiveNumberSchema,
    operationInstrumentId: OptionalPositiveNumberSchema,
    operationAmount: OptionalPositiveNumberSchema,
    toIban: Schema.optional(Schema.NullOr(Schema.String.check(Schema.isMaxLength(34)))),
    originalTransactionId: OptionalPositiveNumberSchema
});
