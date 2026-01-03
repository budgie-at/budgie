import { BudgetAllocationTypeEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { Text, View } from 'react-native';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { AllocationFormValues } from '../../schema/allocation-form.schema';
import { AllocationAmountField } from '../allocation-amount-field/allocation-amount-field';
import { AllocationCategoryField } from '../allocation-category-field/allocation-category-field';
import { AllocationPercentageField } from '../allocation-percentage-field/allocation-percentage-field';
import { AllocationRolloverRuleField } from '../allocation-rollover-rule-field/allocation-rollover-rule-field';

interface Props {
    readonly currencySymbol: string;
    readonly control: Control<AllocationFormValues>;
    readonly setValue: UseFormSetValue<AllocationFormValues>;
    readonly defaultAllocationType?: BudgetAllocationTypeEnum;
}

const buttonVariants = cva('flex-1 items-center py-3 rounded-xl border', {
    variants: {
        active: {
            true: 'bg-primary border-primary',
            false: 'bg-secondary-background border-secondary-corner'
        }
    },
    defaultVariants: { active: false }
});

const buttonTextVariants = cva('text-sm font-medium', {
    variants: {
        active: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    },
    defaultVariants: { active: false }
});

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
            <View className="flex-row gap-2 mb-4">
                <HapticPressable onPress={handleSetFixed} className={buttonVariants({ active: isFixed })}>
                    <Text className={buttonTextVariants({ active: isFixed })}>
                        <Trans>Fixed Amount</Trans>
                    </Text>
                </HapticPressable>

                <HapticPressable onPress={handleSetPercentage} className={buttonVariants({ active: !isFixed })}>
                    <Text className={buttonTextVariants({ active: !isFixed })}>
                        <Trans>% of Income</Trans>
                    </Text>
                </HapticPressable>
            </View>

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
