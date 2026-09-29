import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';

import type { Mutable } from 'effect/Types';

const MIN_PERIOD_START_DAY = 1;
const MAX_PERIOD_START_DAY = 28;

const BudgetCategoryLimitFormSchema = Schema.Struct({
    categoryId: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0)),
    limitAmount: Schema.Finite.check(Schema.isGreaterThan(0))
});

const budgetFormFields = {
    name: Schema.Trim.check(Schema.isMinLength(1)),
    periodStartDay: Schema.Finite.check(Schema.isInt(), Schema.isBetween({ minimum: MIN_PERIOD_START_DAY, maximum: MAX_PERIOD_START_DAY })),
    useLastDayOfMonth: Schema.Boolean,
    overallLimit: Schema.Finite.check(Schema.isGreaterThan(0)),
    otherLimit: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
    categoryLimits: Schema.mutable(Schema.Array(BudgetCategoryLimitFormSchema)),
    instrumentId: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0))
};

export const BudgetFormSchema = Schema.Struct(budgetFormFields)
    .check(
        Schema.makeFilter(
            values =>
                values.categoryLimits.reduce((sum, limit) => sum + limit.limitAmount, 0) + values.otherLimit <= values.overallLimit || {
                    path: ['otherLimit'],
                    issue: ''
                }
        )
    )
    .pipe(
        Schema.decodeTo(Schema.Struct(budgetFormFields), {
            decode: SchemaGetter.transform(values => ({
                ...values,
                periodStartDay: values.useLastDayOfMonth ? MIN_PERIOD_START_DAY : values.periodStartDay
            })),
            encode: SchemaGetter.transform(values => values)
        })
    );

export type BudgetFormValues = Mutable<typeof BudgetFormSchema.Encoded>;
