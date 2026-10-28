import { CurrencyEnum } from '@budgie/contracts';
import * as Schema from 'effect/Schema';

export class ReceiptAccountNotFoundError extends Schema.TaggedError<ReceiptAccountNotFoundError>()('ReceiptAccountNotFoundError', {
    currency: Schema.Enum(CurrencyEnum)
}) {}
