import { z } from 'zod';

const MIN_PERIOD_START_DAY = 1;
const MAX_PERIOD_START_DAY = 28;

const BudgetCategoryLimitFormSchema = z.object({
    categoryId: z.number().int().positive(),
    limitAmount: z.number().positive()
});

export const BudgetFormSchema = z
    .object({
        name: z.string().trim().min(1),
        periodStartDay: z.number().int().min(MIN_PERIOD_START_DAY).max(MAX_PERIOD_START_DAY),
        useLastDayOfMonth: z.boolean(),
        overallLimit: z.number().positive(),
        categoryLimits: z.array(BudgetCategoryLimitFormSchema),
        pushEnabled: z.boolean()
    })
    .transform(values => ({
        ...values,
        periodStartDay: values.useLastDayOfMonth ? MIN_PERIOD_START_DAY : values.periodStartDay
    }));

export type BudgetFormValues = z.input<typeof BudgetFormSchema>;
