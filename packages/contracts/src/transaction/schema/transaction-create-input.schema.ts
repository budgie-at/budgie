import * as Schema from 'effect/Schema';

import { PositiveNumberSchema } from '../../@generic/schema/positive-number.schema';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { TransactionEntryCreateInputSchema } from '../../transaction-entry/schema/transaction-entry-create-input.schema';
import { TRANSACTION_COMMENT_MAX_LENGTH } from '../constant/transaction-comment-max-length.constant';
import { TRANSACTION_TITLE_MAX_LENGTH } from '../constant/transaction-title-max-length.constant';
import { TransactionConsolidationTypeEnum } from '../enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionUpdatedByEnum } from '../enum/transaction-updated-by.enum';

export const TransactionCreateInputSchema = Schema.Struct({
    type: Schema.Enum(TransactionTypeEnum),
    title: Schema.String.check(Schema.isMaxLength(TRANSACTION_TITLE_MAX_LENGTH)),
    externalId: Schema.NullOr(Schema.String),
    operatedAt: Schema.Date,
    comment: Schema.String.check(Schema.isMaxLength(TRANSACTION_COMMENT_MAX_LENGTH)),
    toAccountId: Schema.NullOr(PositiveNumberSchema),
    fromAccountId: Schema.NullOr(PositiveNumberSchema),
    exchangeRate: PositiveNumberSchema,
    externalSource: Schema.NullOr(Schema.Enum(ExternalSourceEnum)),
    updatedBy: Schema.NullOr(Schema.Enum(TransactionUpdatedByEnum)),
    needsEmbedding: Schema.optional(Schema.Boolean),
    consolidationParentTransactionId: Schema.optional(Schema.NullOr(PositiveNumberSchema)),
    consolidationType: Schema.optional(Schema.NullOr(Schema.Enum(TransactionConsolidationTypeEnum))),
    amount: Schema.Finite,
    debtAccountId: Schema.optional(Schema.NullOr(PositiveNumberSchema)),
    externalIdAliases: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
    tagIds: Schema.mutable(Schema.Array(Schema.Finite)),
    entries: Schema.mutable(Schema.Array(TransactionEntryCreateInputSchema).check(Schema.isMinLength(1)))
});
