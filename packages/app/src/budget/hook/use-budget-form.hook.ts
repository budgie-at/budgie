/* eslint-disable lingui/no-unlocalized-strings */
import { BudgetPeriodEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { budgetService } from '../service/budget.service';

const BudgetFormSchema = z.object({
    title: z.string().min(1, 'Budget name is required').max(100, 'Budget name is too long'),
    period: z.nativeEnum(BudgetPeriodEnum),
    startDay: z.number().min(1).max(31),
    customStartDate: z.date().nullable(),
    customEndDate: z.date().nullable(),
    instrumentId: z.number().positive()
});

type BudgetFormValues = z.infer<typeof BudgetFormSchema>;

const DEFAULT_VALUES: BudgetFormValues = {
    title: '',
    period: BudgetPeriodEnum.MONTHLY,
    startDay: 1,
    customStartDate: null,
    customEndDate: null,
    instrumentId: 1
};

export const useBudgetForm = (defaultValues: Partial<BudgetFormValues> = {}) => {
    const showError = useShowError();

    const form = useForm<BudgetFormValues>({
        resolver: zodResolver(BudgetFormSchema),
        mode: 'onSubmit',
        defaultValues: { ...DEFAULT_VALUES, ...defaultValues }
    });

    const instrumentId = useWatch({
        control: form.control,
        name: 'instrumentId'
    });

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    const handleSubmit = async (values: BudgetFormValues) => {
        try {
            const budget = await budgetService.createBudget({
                title: values.title,
                period: values.period,
                startDay: values.startDay,
                instrumentId: values.instrumentId,
                customStartDate: values.customStartDate,
                customEndDate: values.customEndDate
            });

            router.replace(`/budget/${budget.id}`);
        } catch (error: unknown) {
            // eslint-disable-next-line no-console
            console.error('Failed to create budget:', error);
            showError(error);
        }
    };

    return {
        ...form,
        instrument,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
