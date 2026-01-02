import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { BudgetFormSchema, BudgetFormValues, DEFAULT_BUDGET_FORM_VALUES } from '../schema/budget-form.schema';
import { budgetService } from '../service/budget.service';

export const useBudgetForm = (defaultValues: Partial<BudgetFormValues> = {}) => {
    const showError = useShowError();

    const form = useForm<BudgetFormValues>({
        resolver: zodResolver(BudgetFormSchema),
        mode: 'onSubmit',
        defaultValues: { ...DEFAULT_BUDGET_FORM_VALUES, ...defaultValues }
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
            showError(error);
        }
    };

    return {
        ...form,
        instrument,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
