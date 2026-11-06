import * as Schema from 'effect/Schema';

export class RecurringSeriesNotFoundError extends Schema.TaggedError<RecurringSeriesNotFoundError, { readonly brand: unique symbol }>()(
    'RecurringSeriesNotFoundError',
    {
        seriesId: Schema.Finite
    }
) {}
