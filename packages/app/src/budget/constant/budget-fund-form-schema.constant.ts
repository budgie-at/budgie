import * as Schema from 'effect/Schema';

import type { Mutable } from 'effect/Types';

const MIN_REPEAT_MONTHS = 1;
const MAX_REPEAT_MONTHS = 120;

export const BudgetFundFormSchema = Schema.Struct({
    name: Schema.Trim.check(Schema.isMinLength(1)),
    categoryId: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0)),
    targetAmount: Schema.Finite.check(Schema.isGreaterThan(0)),
    dueAtMs: Schema.Finite.check(Schema.isGreaterThan(0)),
    repeatEveryMonths: Schema.NullOr(
        Schema.Finite.check(Schema.isInt(), Schema.isBetween({ minimum: MIN_REPEAT_MONTHS, maximum: MAX_REPEAT_MONTHS }))
    ),
    recurringSeriesId: Schema.NullOr(Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0)))
});

export type BudgetFundFormValues = Mutable<typeof BudgetFundFormSchema.Encoded>;
