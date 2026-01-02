import { BudgetAllocationTypeEnum, BudgetRolloverRuleEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Control, Controller, UseFormSetValue } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { FormPercentageInput } from '../../../@generic/component/form-percentage-input/form-percentage-input';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { CategorySelector } from '../../../category/components/category-selector/category-selector';
import { AllocationFormValues } from '../../schema/allocation-form.schema';

const ROLLOVER_OPTIONS = [
    { value: BudgetRolloverRuleEnum.NONE, label: msg`None`, hint: msg`Unused budget is lost at period end` },
    { value: BudgetRolloverRuleEnum.CARRY_POSITIVE, label: msg`Carry Surplus`, hint: msg`Only unspent amounts roll over` },
    { value: BudgetRolloverRuleEnum.CARRY_ALL, label: msg`Carry All`, hint: msg`Both surplus and deficit roll over` }
];

interface Props {
    readonly control: Control<AllocationFormValues>;
    readonly setValue: UseFormSetValue<AllocationFormValues>;
    readonly currencySymbol: string;
    readonly defaultAllocationType?: BudgetAllocationTypeEnum;
}

export const AllocationFormFields = (props: Props) => {
    const { control, setValue, currencySymbol, defaultAllocationType = BudgetAllocationTypeEnum.FIXED } = props;
    const [isFixed, setIsFixed] = useState(defaultAllocationType === BudgetAllocationTypeEnum.FIXED);
    const { t, i18n } = useLingui();

    const handleSetFixed = () => {
        setIsFixed(true);
        setValue('allocationType', BudgetAllocationTypeEnum.FIXED);
    };
    const handleSetPercentage = () => {
        setIsFixed(false);
        setValue('allocationType', BudgetAllocationTypeEnum.PERCENTAGE);
    };

    const fixedClassName = cn(
        'flex-1 items-center py-3 rounded-xl border',
        isFixed ? 'bg-primary border-primary' : 'bg-secondary-background border-secondary-corner'
    );
    const fixedTextClassName = cn('text-sm font-medium', isFixed ? 'text-primary-reverse' : 'text-secondary-foreground');
    const percentageClassName = cn(
        'flex-1 items-center py-3 rounded-xl border',
        !isFixed ? 'bg-primary border-primary' : 'bg-secondary-background border-secondary-corner'
    );
    const percentageTextClassName = cn('text-sm font-medium', !isFixed ? 'text-primary-reverse' : 'text-secondary-foreground');

    return (
        <FormLayoutGroup>
            <View className="flex-row gap-2 mb-4">
                <HapticPressable onPress={handleSetFixed} className={fixedClassName}>
                    <Text className={fixedTextClassName}>{t`Fixed Amount`}</Text>
                </HapticPressable>

                <HapticPressable onPress={handleSetPercentage} className={percentageClassName}>
                    <Text className={percentageTextClassName}>{t`% of Income`}</Text>
                </HapticPressable>
            </View>

            {isFixed ? (
                <Controller
                    name="amount"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => {
                        const displayValue = convertFromMicroUnits(value ?? 0);
                        const handleChange = (val: number) => void onChange(convertToMicroUnits(val));

                        return (
                            <FormItem label={t`Amount`} error={error?.message}>
                                <FormAmountInput
                                    value={displayValue}
                                    onChange={handleChange}
                                    variant="primary"
                                    instrumentSymbol={currencySymbol}
                                />
                            </FormItem>
                        );
                    }}
                />
            ) : (
                <Controller
                    name="percentage"
                    control={control}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <FormItem label={t`Percentage of Income`} error={error?.message}>
                            <FormPercentageInput value={value ?? 0} onChange={onChange} variant="primary" />
                        </FormItem>
                    )}
                />
            )}

            <Controller
                name="categoryId"
                control={control}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <FormItem label={t`Category`} error={error?.message}>
                        <CategorySelector categoryId={value ?? null} onSelect={onChange} variant="primary" />
                    </FormItem>
                )}
            />

            <Controller
                name="rolloverRule"
                control={control}
                render={({ field: { onChange, value } }) => {
                    const selectedOption = ROLLOVER_OPTIONS.find(opt => opt.value === value);

                    return (
                        <FormItem label={t`Rollover Rule`}>
                            <View className="gap-2">
                                <View className="flex-row gap-2">
                                    {ROLLOVER_OPTIONS.map(option => {
                                        const isSelected = value === option.value;
                                        const handlePress = () => void onChange(option.value);
                                        const optionClassName = cn(
                                            'flex-1 items-center py-2 rounded-lg border',
                                            isSelected ? 'bg-primary border-primary' : 'bg-secondary-background border-secondary-corner'
                                        );
                                        const optionTextClassName = cn(
                                            'text-xs',
                                            isSelected ? 'text-primary-reverse' : 'text-secondary-foreground'
                                        );

                                        return (
                                            <HapticPressable key={option.value} onPress={handlePress} className={optionClassName}>
                                                <Text className={optionTextClassName}>{i18n.t(option.label)}</Text>
                                            </HapticPressable>
                                        );
                                    })}
                                </View>

                                {isDefined(selectedOption) && (
                                    <Text className="text-xs text-secondary-foreground">{i18n.t(selectedOption.hint)}</Text>
                                )}
                            </View>
                        </FormItem>
                    );
                }}
            />
        </FormLayoutGroup>
    );
};
