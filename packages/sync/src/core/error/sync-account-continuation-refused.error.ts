import * as Schema from 'effect/Schema';

import { SyncAccountContinuationRefusalEnum } from '../enum/sync-account-continuation-refusal.enum';

export class SyncAccountContinuationRefusedError extends Schema.TaggedError<SyncAccountContinuationRefusedError>()(
    'SyncAccountContinuationRefusedError',
    {
        accountId: Schema.Number,
        reason: Schema.Enum(SyncAccountContinuationRefusalEnum),
        message: Schema.String
    }
) {}
