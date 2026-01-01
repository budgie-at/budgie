import { BudgetAllocationEntityInterface } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';

import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { AllocationFormSchema, AllocationFormValues } from '../schema/allocation-form.schema';
import { budgetService } from '../service/budget.service';

export const useEditAllocationForm = (allocation: BudgetAllocationEntityInterface) => {
    const showError = useShowError();

    const form = useForm<AllocationFormValues>({
        resolver: zodResolver(AllocationFormSchema),
        mode: 'onSubmit',
        defaultValues: {
            categoryId: allocation.categoryId,
            allocationType: allocation.allocationType,
            amount: allocation.amount,
            percentage: allocation.percentage,
            rolloverRule: allocation.rolloverRule,
            rolloverCap: allocation.rolloverCap,
            isSinkingFund: allocation.isSinkingFund,
            sinkingFundTarget: allocation.sinkingFundTarget,
            isExcluded: allocation.isExcluded
        }
    });

    const handleSubmit = async (values: AllocationFormValues) => {
        try {
            await budgetService.updateAllocation(allocation.id, values);

            router.back();
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleDelete = async () => {
        try {
            await budgetService.deleteAllocation(allocation.id);

            router.back();
        } catch (error: unknown) {
            showError(error);
        }
    };

    return {
        ...form,
        handleSubmit: form.handleSubmit(handleSubmit),
        handleDelete
    };
};
