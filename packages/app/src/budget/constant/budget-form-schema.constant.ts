import { BudgetLimitSourceEnum, BudgetPeriodEnum, BudgetRolloverModeEnum } from '@budgie/contracts';
import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';

import { isDefined } from '@rnw-community/shared';

import type { Mutable } from 'effect/Types';

const MIN_PERIOD_START_DAY = 1;
const MAX_PERIOD_START_DAY = 28;

export const BudgetCategoryLimitFormSchema = Schema.Struct({
    categoryId: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0)),
    limitAmount: Schema.Finite.check(Schema.isGreaterThan(0)),
    rolloverMode: Schema.Enum(BudgetRolloverModeEnum)
});

const budgetFormFields = {
    name: Schema.Trim.check(Schema.isMinLength(1)),
    period: Schema.Enum(BudgetPeriodEnum),
    periodStartDay: Schema.Finite.check(Schema.isInt(), Schema.isBetween({ minimum: MIN_PERIOD_START_DAY, maximum: MAX_PERIOD_START_DAY })),
    useLastDayOfMonth: Schema.Boolean,
    periodAnchorMs: Schema.NullOr(Schema.Finite),
    limitSource: Schema.Enum(BudgetLimitSourceEnum),
    isAutoTuneEnabled: Schema.Boolean,
    overallLimit: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
    otherLimit: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
    otherRolloverMode: Schema.Enum(BudgetRolloverModeEnum),
    categoryLimits: Schema.mutable(Schema.Array(BudgetCategoryLimitFormSchema)),
    instrumentId: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0))
};

export const BudgetFormSchema = Schema.Struct(budgetFormFields)
    .check(
        Schema.makeFilter(
            values =>
                values.period === BudgetPeriodEnum.MONTHLY || isDefined(values.periodAnchorMs) || { path: ['periodAnchorMs'], issue: '' }
        ),
        Schema.makeFilter(values => {
            if (values.limitSource !== BudgetLimitSourceEnum.FIXED) {
                return true;
            }

            if (values.overallLimit <= 0) {
                return { path: ['overallLimit'], issue: '' };
            }

            return (
                values.categoryLimits.reduce((sum, limit) => sum + limit.limitAmount, 0) + values.otherLimit <= values.overallLimit || {
                    path: ['otherLimit'],
                    issue: ''
                }
            );
        })
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
