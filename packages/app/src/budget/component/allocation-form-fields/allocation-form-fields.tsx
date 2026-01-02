import { BudgetAllocationTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { Control, Controller, UseControllerReturn, UseFormSetValue } from 'react-hook-form';
import { Text, View } from 'react-native';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { FormPercentageInput } from '../../../@generic/component/form-percentage-input/form-percentage-input';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { CategorySelector } from '../../../category/components/category-selector/category-selector';
import { AllocationFormValues } from '../../schema/allocation-form.schema';
import { RolloverRuleSelector } from '../rollover-rule-selector/rollover-rule-selector';

interface Props {
    readonly control: Control<AllocationFormValues>;
    readonly setValue: UseFormSetValue<AllocationFormValues>;
    readonly currencySymbol: string;
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
    const { t } = useLingui();

    const handleSetFixed = () => {
        setIsFixed(true);
        setValue('allocationType', BudgetAllocationTypeEnum.FIXED);
    };

    const handleSetPercentage = () => {
        setIsFixed(false);
        setValue('allocationType', BudgetAllocationTypeEnum.PERCENTAGE);
    };

    const isPercentage = !isFixed;

    const handleAmountChange = (onChange: (val: number) => void) => (val: number) => void onChange(convertToMicroUnits(val));

    const renderAmount = ({ field: { onChange, value }, fieldState: { error } }: UseControllerReturn<AllocationFormValues, 'amount'>) => (
        <FormItem label={t`Amount`} error={error?.message}>
            <FormAmountInput
                value={convertFromMicroUnits(value)}
                onChange={handleAmountChange(onChange)}
                variant="primary"
                instrumentSymbol={currencySymbol}
            />
        </FormItem>
    );

    const renderPercentage = ({
        field: { onChange, value },
        fieldState: { error }
    }: UseControllerReturn<AllocationFormValues, 'percentage'>) => (
        <FormItem label={t`Percentage of Income`} error={error?.message}>
            <FormPercentageInput value={value} onChange={onChange} variant="primary" />
        </FormItem>
    );

    const renderCategory = ({
        field: { onChange, value },
        fieldState: { error }
    }: UseControllerReturn<AllocationFormValues, 'categoryId'>) => (
        <FormItem label={t`Category`} error={error?.message}>
            <CategorySelector categoryId={value} onSelect={onChange} variant="primary" />
        </FormItem>
    );

    const renderRolloverRule = ({ field: { onChange, value } }: UseControllerReturn<AllocationFormValues, 'rolloverRule'>) => (
        <FormItem label={t`Rollover Rule`}>
            <RolloverRuleSelector value={value} onChange={onChange} />
        </FormItem>
    );

    return (
        <FormLayoutGroup>
            <View className="flex-row gap-2 mb-4">
                <HapticPressable onPress={handleSetFixed} className={buttonVariants({ active: isFixed })}>
                    <Text className={buttonTextVariants({ active: isFixed })}>
                        <Trans>Fixed Amount</Trans>
                    </Text>
                </HapticPressable>

                <HapticPressable onPress={handleSetPercentage} className={buttonVariants({ active: isPercentage })}>
                    <Text className={buttonTextVariants({ active: isPercentage })}>
                        <Trans>% of Income</Trans>
                    </Text>
                </HapticPressable>
            </View>

            {isFixed ? (
                <Controller name="amount" control={control} render={renderAmount} />
            ) : (
                <Controller name="percentage" control={control} render={renderPercentage} />
            )}

            <Controller name="categoryId" control={control} render={renderCategory} />

            <Controller name="rolloverRule" control={control} render={renderRolloverRule} />
        </FormLayoutGroup>
    );
};
