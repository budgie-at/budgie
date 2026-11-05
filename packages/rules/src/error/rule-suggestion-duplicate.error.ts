import * as Schema from 'effect/Schema';

export class RuleSuggestionDuplicateError extends Schema.TaggedError<RuleSuggestionDuplicateError, { readonly brand: unique symbol }>()(
    'RuleSuggestionDuplicateError',
    {
        ruleId: Schema.Number
    }
) {}
