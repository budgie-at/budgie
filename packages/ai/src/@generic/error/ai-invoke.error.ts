import * as Schema from 'effect/Schema';

export class AiInvokeError extends Schema.TaggedError<AiInvokeError>()('AiInvokeError', { cause: Schema.Defect() }) {}
