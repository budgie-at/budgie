import * as Schema from 'effect/Schema';

import { EnableBankingSetupErrorReasonEnum } from '../enum/enable-banking-setup-error-reason.enum';

export class EnableBankingSetupError extends Schema.TaggedError<EnableBankingSetupError>()('EnableBankingSetupError', {
    reason: Schema.Enum(EnableBankingSetupErrorReasonEnum)
}) {}
