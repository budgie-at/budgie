import { BudgetAllocationTypeEnum } from '@budgie/contracts';
import { useState } from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { AllocationFormValues } from '../../schema/allocation-form.schema';
import { AllocationAmountField } from '../allocation-amount-field/allocation-amount-field';
import { AllocationCategoryField } from '../allocation-category-field/allocation-category-field';
import { AllocationPercentageField } from '../allocation-percentage-field/allocation-percentage-field';
import { AllocationRolloverRuleField } from '../allocation-rollover-rule-field/allocation-rollover-rule-field';
import { AllocationTypeToggle } from '../allocation-type-toggle/allocation-type-toggle';

interface Props {
    readonly currencySymbol: string;
    readonly control: Control<AllocationFormValues>;
    readonly setValue: UseFormSetValue<AllocationFormValues>;
    readonly defaultAllocationType?: BudgetAllocationTypeEnum;
}

export const AllocationFormFields = (props: Props) => {
    const { control, setValue, currencySymbol, defaultAllocationType = BudgetAllocationTypeEnum.FIXED } = props;
    const [isFixed, setIsFixed] = useState(defaultAllocationType === BudgetAllocationTypeEnum.FIXED);

    const handleSetFixed = () => {
        setIsFixed(true);
        setValue('allocationType', BudgetAllocationTypeEnum.FIXED);
    };

    const handleSetPercentage = () => {
        setIsFixed(false);
        setValue('allocationType', BudgetAllocationTypeEnum.PERCENTAGE);
    };

    return (
        <FormLayoutGroup>
            <AllocationTypeToggle isFixed={isFixed} onSelectFixed={handleSetFixed} onSelectPercentage={handleSetPercentage} />

            {isFixed ? (
                <AllocationAmountField currencySymbol={currencySymbol} control={control} />
            ) : (
                <AllocationPercentageField control={control} />
            )}

            <AllocationCategoryField control={control} />

            <AllocationRolloverRuleField control={control} />
        </FormLayoutGroup>
    );
};
