import { BudgetAllocationTypeEnum, BudgetRolloverRuleEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';

import { budgetAllocationRepository } from '../../@generic/drizzle/db/db';
import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { AllocationFormSchema, AllocationFormValues } from '../schema/allocation-form.schema';

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
            await budgetAllocationRepository.create({ ...values, budgetId });

            router.back();
        } catch (error: unknown) {
            showError(error);
        }
    };

    return {
        ...form,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
