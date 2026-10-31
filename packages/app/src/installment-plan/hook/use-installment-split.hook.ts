import { convertToMicroUnits } from '@budgie/contracts';
import { useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { ConvertToInstallmentFormValues } from '../constant/convert-to-installment-form-schema.constant';
import type { InstallmentSplitInterface } from '../interface/installment-split.interface';
import type { Control } from 'react-hook-form';

const PERCENT_BASE = 100;

export const useInstallmentSplit = (control: Control<ConvertToInstallmentFormValues>, paidAmount: number): InstallmentSplitInterface => {
    const [installmentCount, totalAmount, feePercent] = useWatch({ control, name: ['installmentCount', 'totalAmount', 'feePercent'] });

    const centAmount = convertToMicroUnits(0.01);
    const roundToCent = (microAmount: number) => Math.round(microAmount / centAmount) * centAmount;
    const purchaseAmount = paidAmount * installmentCount;
    const isCustomTotal = isDefined(totalAmount);
    const planTotal = isCustomTotal
        ? convertToMicroUnits(totalAmount)
        : purchaseAmount + roundToCent((purchaseAmount * feePercent) / PERCENT_BASE);
    const baseAmount = isCustomTotal ? roundToCent((planTotal * PERCENT_BASE) / (PERCENT_BASE + feePercent)) : purchaseAmount;
    const regularAmount = Math.round(planTotal / installmentCount);
    const lastAmount = planTotal - paidAmount - regularAmount * (installmentCount - 2);
    const isSinglePaymentLeft = installmentCount === 2;

    return {
        installmentCount,
        feePercent,
        isCustomTotal,
        planTotal,
        baseAmount,
        feeAmount: planTotal - baseAmount,
        regularAmount,
        lastAmount,
        isSinglePaymentLeft,
        hasEqualParts: lastAmount === regularAmount || isSinglePaymentLeft,
        isSplittable: isPositiveNumber(lastAmount)
    };
};
