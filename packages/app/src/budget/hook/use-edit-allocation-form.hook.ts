import { BudgetAllocationEntityInterface } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { budgetAllocationRepository } from '../../@generic/drizzle/db/db';
import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { AllocationFormSchema, AllocationFormValues } from '../schema/allocation-form.schema';

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
            await budgetAllocationRepository.updateById(allocation.id, values);

            goBackOrReplace('/');
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleDelete = async () => {
        try {
            await budgetAllocationRepository.deleteById(allocation.id);

            goBackOrReplace('/');
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
