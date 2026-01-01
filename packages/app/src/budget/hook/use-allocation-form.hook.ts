import { BudgetAllocationTypeEnum, BudgetRolloverRuleEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { AllocationFormSchema, AllocationFormValues } from '../schema/allocation-form.schema';
import { budgetService } from '../service/budget.service';

const DEFAULT_VALUES: AllocationFormValues = {
    categoryId: null,
    allocationType: BudgetAllocationTypeEnum.FIXED,
    amount: 0,
    percentage: 0,
    rolloverRule: BudgetRolloverRuleEnum.NONE,
    rolloverCap: null,
    isSinkingFund: false,
    sinkingFundTarget: null,
    isExcluded: false
};

export const useAllocationForm = (budgetId: number, defaultValues: Partial<AllocationFormValues> = {}) => {
    const showError = useShowError();

    const form = useForm<AllocationFormValues>({
        resolver: zodResolver(AllocationFormSchema),
        mode: 'onSubmit',
        defaultValues: { ...DEFAULT_VALUES, ...defaultValues }
    });

    const handleSubmit = async (values: AllocationFormValues) => {
        try {
            console.log('Submitting allocation:', { budgetId, values });
            const result = await budgetService.addAllocation(budgetId, values);
            console.log('Allocation created:', result);

            router.back();
        } catch (error: unknown) {
            console.error('Allocation error:', error);
            showError(error);
        }
    };

    const onError = (errors: Record<string, unknown>) => {
        console.log('Form validation errors:', errors);
    };

    return {
        ...form,
        handleSubmit: form.handleSubmit(handleSubmit, onError)
    };
};
