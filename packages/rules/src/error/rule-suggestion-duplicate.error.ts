import * as Schema from 'effect/Schema';

export class RuleSuggestionDuplicateError extends Schema.TaggedError<RuleSuggestionDuplicateError>()('RuleSuggestionDuplicateError', {
    ruleId: Schema.Number
}) {}
