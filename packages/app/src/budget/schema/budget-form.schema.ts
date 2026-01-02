import { BudgetPeriodEnum } from '@budgie/contracts';
import { z } from 'zod';

export const BudgetFormSchema = z.object({
    title: z.string().min(1).max(100),
    period: z.nativeEnum(BudgetPeriodEnum),
    startDay: z.number().min(1).max(31),
    customStartDate: z.date().nullable(),
    customEndDate: z.date().nullable(),
    instrumentId: z.number().positive()
});

export type BudgetFormValues = z.infer<typeof BudgetFormSchema>;

export const DEFAULT_BUDGET_FORM_VALUES: BudgetFormValues = {
    title: '',
    period: BudgetPeriodEnum.MONTHLY,
    startDay: 1,
    customStartDate: null,
    customEndDate: null,
    instrumentId: 1
};

