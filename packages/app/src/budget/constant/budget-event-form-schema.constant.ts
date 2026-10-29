import * as Schema from 'effect/Schema';

import { BudgetCategoryLimitFormSchema } from './budget-form-schema.constant';

import type { Mutable } from 'effect/Types';

export const BudgetEventFormSchema = Schema.Struct({
    name: Schema.Trim.check(Schema.isMinLength(1)),
    tagId: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0)),
    startsAtMs: Schema.Finite.check(Schema.isGreaterThan(0)),
    endsAtMs: Schema.Finite.check(Schema.isGreaterThan(0)),
    overallLimit: Schema.Finite.check(Schema.isGreaterThan(0)),
    categoryLimits: Schema.mutable(Schema.Array(BudgetCategoryLimitFormSchema)),
    instrumentId: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0))
}).check(
    Schema.makeFilter(values => values.endsAtMs >= values.startsAtMs || { path: ['endsAtMs'], issue: '' }),
    Schema.makeFilter(
        values =>
            values.categoryLimits.reduce((sum, limit) => sum + limit.limitAmount, 0) <= values.overallLimit || {
                path: ['overallLimit'],
                issue: ''
            }
    )
);

export type BudgetEventFormValues = Mutable<typeof BudgetEventFormSchema.Encoded>;
