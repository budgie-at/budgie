import * as Schema from 'effect/Schema';

export class RecurringSeriesNotFoundError extends Schema.TaggedError<RecurringSeriesNotFoundError>()('RecurringSeriesNotFoundError', {
    seriesId: Schema.Number
}) {}
