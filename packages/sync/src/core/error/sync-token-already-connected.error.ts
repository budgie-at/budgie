import { ExternalSourceEnum } from '@budgie/contracts';
import * as Schema from 'effect/Schema';

export class SyncTokenAlreadyConnectedError extends Schema.TaggedError<SyncTokenAlreadyConnectedError>()('SyncTokenAlreadyConnectedError', {
    provider: Schema.Enum(ExternalSourceEnum),
    integrationId: Schema.Number,
    message: Schema.String
}) {}
