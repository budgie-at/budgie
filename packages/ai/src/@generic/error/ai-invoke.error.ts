import * as Schema from 'effect/Schema';

export class AiInvokeError extends Schema.TaggedError<AiInvokeError, { readonly brand: unique symbol }>()('AiInvokeError', {
    cause: Schema.Defect()
}) {}
