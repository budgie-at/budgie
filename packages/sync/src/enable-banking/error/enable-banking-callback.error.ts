import * as Schema from 'effect/Schema';

import { EnableBankingCallbackFailureEnum } from '../enum/enable-banking-callback-failure.enum';

export class EnableBankingCallbackError extends Schema.TaggedError<EnableBankingCallbackError, { readonly brand: unique symbol }>()(
    'EnableBankingCallbackError',
    {
        failure: Schema.Enum(EnableBankingCallbackFailureEnum)
    }
) {}
