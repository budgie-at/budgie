import { z } from 'zod';

import { BudgetPeriodEnum } from '../../budget/enum/budget-period.enum';
import { BUDGET_TEMPLATE_NAME_MAX_LENGTH } from '../constant/budget-template-name-max-length.constant';

export const BudgetTemplateCreateInputSchema = z.object({
    name: z.string().min(1).max(BUDGET_TEMPLATE_NAME_MAX_LENGTH),
    period: z.nativeEnum(BudgetPeriodEnum),
    periodStartDay: z.number().int().min(1).max(28),
    overallLimit: z.number().int().min(0),
    rolloverEnabled: z.boolean(),
    rolloverDeficitEnabled: z.boolean(),
    categoryLimits: z.array(
        z.object({
            categoryId: z.number().int().positive(),
            limit: z.number().int().min(0)
        })
    ),
    incomeExpectations: z.array(
        z.object({
            categoryId: z.number().int().positive(),
            expectedAmount: z.number().int().min(0)
        })
    )
});
