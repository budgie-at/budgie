import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { OptionalNullablePositiveNumberSchema } from '../../@generic/schema/optional-nullable-positive-number.schema';
import { PositiveNumberSchema } from '../../@generic/schema/positive-number.schema';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { TransactionEntryCreateInputSchema } from '../../transaction-entry/schema/transaction-entry-create-input.schema';
import { TRANSACTION_COMMENT_MAX_LENGTH } from '../constant/transaction-comment-max-length.constant';
import { TRANSACTION_TITLE_MAX_LENGTH } from '../constant/transaction-title-max-length.constant';
import { TransactionConsolidationTypeEnum } from '../enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionUpdatedByEnum } from '../enum/transaction-updated-by.enum';
import { YieldKindEnum } from '../enum/yield-kind.enum';
import { isYieldKindAllowedForType } from '../utils/is-yield-kind-allowed-for-type.util';

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
    importFingerprint: Schema.String.pipe(Schema.NullOr, Schema.optional),
    consolidationParentTransactionId: OptionalNullablePositiveNumberSchema,
    fundAccountId: OptionalNullablePositiveNumberSchema,
    yieldKind: Schema.Enum(YieldKindEnum).pipe(Schema.NullOr, Schema.optional),
    yieldSourceAccountId: OptionalNullablePositiveNumberSchema,
    consolidationType: Schema.Enum(TransactionConsolidationTypeEnum).pipe(Schema.NullOr, Schema.optional),
    amount: Schema.Finite,
    debtAccountId: OptionalNullablePositiveNumberSchema,
    externalIdAliases: Schema.String.pipe(Schema.Array, Schema.mutable, Schema.optional),
    tagIds: Schema.Finite.pipe(Schema.Array, Schema.mutable),
    ruleTagIds: Schema.Finite.pipe(Schema.Array, Schema.mutable, Schema.optional),
    entries: Schema.mutable(Schema.Array(TransactionEntryCreateInputSchema).check(Schema.isMinLength(1)))
}).check(
    Schema.makeFilter(
        ({ type, yieldKind }) =>
            !isDefined(yieldKind) ||
            isYieldKindAllowedForType(type, yieldKind) || {
                path: ['yieldKind'],
                issue: `Yield kind '${yieldKind}' is not allowed for '${type}' transactions.`
            }
    )
);
