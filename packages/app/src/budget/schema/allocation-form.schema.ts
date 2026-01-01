import { BudgetAllocationTypeEnum, BudgetRolloverRuleEnum } from '@budgie/contracts';
import { z } from 'zod';

export const AllocationFormSchema = z.object({
    categoryId: z.number().positive().nullable().optional(),
    allocationType: z.nativeEnum(BudgetAllocationTypeEnum),
    amount: z.number().nonnegative(),
    percentage: z.number().min(0).max(100),
    rolloverRule: z.nativeEnum(BudgetRolloverRuleEnum),
    rolloverCap: z.number().positive().nullable().optional(),
    isSinkingFund: z.boolean(),
    sinkingFundTarget: z.number().positive().nullable().optional(),
    isExcluded: z.boolean()
});

export type AllocationFormValues = z.infer<typeof AllocationFormSchema>;

