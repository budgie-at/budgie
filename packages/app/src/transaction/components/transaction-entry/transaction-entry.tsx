import { TransactionAssociationEnum, TransactionCreateEntityInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { View } from 'react-native';

import { AmountInput } from '../../../@generic/components/amount-input/amount-input';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TransactionEntryCategorySelector } from '../../../category/components/transaction-entry-category-selector/transaction-entry-category-selector';

type Field = Pick<TransactionCreateEntityInterface, TransactionAssociationEnum.ENTRIES>;

interface Props {
    readonly onRemove: (index: number) => void;
    readonly variant: ColorPaletteVariant;
    readonly control: Control<Field>;
    readonly index: number;
}

export const TransactionEntry = (props: Props) => {
    const { variant, control, index, onRemove } = props;

    const handleRemove = () => void onRemove(index);

    const renderCategorySelector = ({ field: { onChange, value } }: UseControllerReturn<Field>) => (
        <TransactionEntryCategorySelector variant={variant} onSelect={onChange} categoryId={value} />
    );

    const renderAmountInput = ({ field: { onChange, value } }: UseControllerReturn<Field>) => (
        <AmountInput
            value={value}
            placeholder="$ 0.00"
            onChangeValue={onChange}
            inputClassName="text-sm/1 h-full flex-1 text-primary placeholder:text-secondary-foreground rounded-5xl px-lg border border-secondary-corner"
        />
    );

    return (
        <View key={index} className="flex-row items-center p-lg rounded-5xl bg-secondary-background gap-x-md">
            <Controller render={renderCategorySelector} name={`entries.${index}.categoryId`} control={control} />

            <Controller render={renderAmountInput} name={`entries.${index}.amount`} control={control} />

            <HapticPressable onPress={handleRemove} className="p-md">
                <Icon size={16} icon={ICONS.X} className="text-primary" />
            </HapticPressable>
        </View>
    );
};
